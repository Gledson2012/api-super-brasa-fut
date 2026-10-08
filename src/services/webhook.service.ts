import { WebhookSubscription, CreateWebhookDto, WebhookEventType, WebhookDeliveryLog } from '../models/webhook.model.js';
import { NotFoundError } from '../utils/errors.js';
import { assertSafeWebhookUrl, assertResolvesToPublicHost, signWebhookPayload } from '../utils/webhook-security.js';
import { stateStore, STATE_PREFIX } from '../repositories/state-store.js';
import type { StateStore } from '../repositories/state-store.js';
import { withTimeout } from '../utils/with-timeout.js';
import { webhookConfig } from '../config/environment.js';
import { webhookDeliveriesTotal } from './metrics.service.js';

const WEBHOOKS_KEY = `${STATE_PREFIX}:webhooks`;
const HYDRATE_TIMEOUT_MS = 4000;
const MAX_DELIVERIES_STORED = 100;
const MAX_REDIRECTS = 5;
const REDIRECT_STATUS_CODES = new Set([301, 302, 303, 307, 308]);

export class WebhookService {
  private static instance: WebhookService;
  private subscriptions: WebhookSubscription[] = [];
  private deliveries: WebhookDeliveryLog[] = [];

  private constructor() {}

  public static getInstance(): WebhookService {
    if (!WebhookService.instance) {
      WebhookService.instance = new WebhookService();
    }
    return WebhookService.instance;
  }

  /** Conjunto de IDs de webhooks pertencentes a uma chave de API. */
  private ownedWebhookIds(ownerKey: string): Set<string> {
    return new Set(this.subscriptions.filter((s) => s.ownerKey === ownerKey).map((s) => s.id));
  }

  /** Restaura as assinaturas persistidas externamente (chamar no boot). */
  public async hydrate(store: StateStore = stateStore): Promise<void> {
    if (store.name === 'memory') return;

    try {
      const stored = await withTimeout(
        store.get<WebhookSubscription[]>(WEBHOOKS_KEY),
        HYDRATE_TIMEOUT_MS,
        'hydrate de webhooks'
      );
      if (Array.isArray(stored)) {
        this.subscriptions = stored;
      }
    } catch (err) {
      console.error('Falha ao hidratar webhooks do estado externo.', err);
    }
  }

  private persist(): void {
    if (stateStore.name === 'memory') return;
    stateStore.set(WEBHOOKS_KEY, this.subscriptions).catch((err) => {
      console.error('Erro ao persistir webhooks no estado externo:', err);
    });
  }

  public subscribe(dto: CreateWebhookDto, ownerKey: string = 'anonymous'): WebhookSubscription {
    // Valida protocolo e bloqueia hosts internos (proteção contra SSRF).
    assertSafeWebhookUrl(dto.url);

    const sub: WebhookSubscription = {
      id: `whk-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      url: dto.url,
      events: dto.events && dto.events.length > 0 ? dto.events : ['ALL'],
      matchId: dto.matchId,
      leagueId: dto.leagueId,
      secret: dto.secret,
      createdAt: new Date().toISOString(),
      active: true,
      ownerKey,
    };

    this.subscriptions.push(sub);
    this.persist();
    return sub;
  }

  /**
   * Lista apenas os webhooks da chave de API informada. O `secret` nunca deve
   * ser exposto em respostas — veja `toPublicSubscription`.
   */
  public list(ownerKey: string): WebhookSubscription[] {
    return this.subscriptions.filter((s) => s.ownerKey === ownerKey);
  }

  /**
   * Busca um webhook garantindo que ele pertence à chave informada. Usa
   * NotFoundError tanto para "não existe" quanto para "não é seu", evitando
   * vazar a existência de assinaturas de outros clientes.
   */
  public getById(id: string, ownerKey: string): WebhookSubscription {
    const sub = this.subscriptions.find((s) => s.id === id && s.ownerKey === ownerKey);
    if (!sub) {
      throw new NotFoundError(`Webhook com ID '${id}' não encontrado.`);
    }
    return sub;
  }

  public unsubscribe(id: string, ownerKey: string): boolean {
    const index = this.subscriptions.findIndex((s) => s.id === id && s.ownerKey === ownerKey);
    if (index === -1) {
      throw new NotFoundError(`Webhook com ID '${id}' não encontrado.`);
    }
    this.subscriptions.splice(index, 1);
    this.persist();
    return true;
  }

  /**
   * Executa a entrega HTTP seguindo redirecionamentos de forma segura. Cada hop
   * revalida protocolo e DNS do alvo (proteção SSRF/DNS rebinding) e o número de
   * hops é limitado. Redirecionamentos para hosts internos/rede privada fazem a
   * entrega falhar sem jamais contatar o destino, impedindo contorno da
   * validação via 302 para metadata/loopback.
   */
  private async deliverTo(
    initialUrl: string,
    init: Parameters<typeof fetch>[1]
  ): Promise<Response> {
    let currentUrl = initialUrl;

    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      // Revalida a resolução DNS imediatamente antes de cada requisição (anti DNS rebinding).
      await assertResolvesToPublicHost(currentUrl);

      const response = await fetch(currentUrl, { ...init, redirect: 'manual' });

      const location = response.headers.get('location');
      if (!location || !REDIRECT_STATUS_CODES.has(response.status)) {
        return response;
      }

      if (hop >= MAX_REDIRECTS) {
        return response; // excedeu o número máximo de redirecionamentos
      }

      currentUrl = new URL(location, currentUrl).toString();
      assertSafeWebhookUrl(currentUrl);
    }

    /* istanbul ignore next -- caminho inalcançável: o loop sempre retorna. */
    throw new Error('Número máximo de redirecionamentos excedido.');
  }

  /**
   * Executa a entrega de um evento para um webhook específico com retentativas
   * automáticas e backoff exponencial em caso de falha.
   */
  public async executeDelivery(
    target: WebhookSubscription,
    eventType: WebhookEventType,
    payload: any
  ): Promise<WebhookDeliveryLog> {
    const deliveryId = `dlv-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const timestamp = new Date().toISOString();
    const body = JSON.stringify({
      event: eventType,
      timestamp,
      data: payload,
    });

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-SuperBrasa-Event': eventType,
      'X-SuperBrasa-Timestamp': timestamp,
      'X-SuperBrasa-Delivery': deliveryId,
      'Idempotency-Key': deliveryId,
    };

    if (target.secret) {
      headers['X-SuperBrasa-Signature'] = signWebhookPayload(target.secret, body, timestamp);
    }

    const startedAt = Date.now();
    let success = false;
    let statusCode: number | undefined;
    let lastError: string | undefined;
    let attempts = 0;

    for (let attempt = 1; attempt <= webhookConfig.maxRetries; attempt++) {
      attempts = attempt;

      try {
        const response = await this.deliverTo(target.url, {
          method: 'POST',
          headers,
          body,
          signal: AbortSignal.timeout(3000),
        });

        statusCode = response.status;
        if (response.ok) {
          success = true;
          webhookDeliveriesTotal.inc({ event: eventType, status: 'success' });
          break;
        }

        lastError = `HTTP ${response.status}: ${response.statusText || 'Falha na entrega'}`;
      } catch (err) {
        lastError = err instanceof Error ? err.message : 'Erro na requisição HTTP';
      }

      // Se falhou e ainda há tentativas restantes, aguarda backoff exponencial
      if (!success && attempt < webhookConfig.maxRetries) {
        webhookDeliveriesTotal.inc({ event: eventType, status: 'retrying' });
        const delay = webhookConfig.retryDelayMs * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    if (!success) {
      webhookDeliveriesTotal.inc({ event: eventType, status: 'failed' });
    }

    const log: WebhookDeliveryLog = {
      id: deliveryId,
      webhookId: target.id,
      url: target.url,
      event: eventType,
      payload,
      timestamp,
      attempts,
      success,
      statusCode,
      error: success ? undefined : lastError,
      durationMs: Date.now() - startedAt,
    };

    this.deliveries.unshift(log);
    if (this.deliveries.length > MAX_DELIVERIES_STORED) {
      this.deliveries.length = MAX_DELIVERIES_STORED;
    }

    return log;
  }

  public async notify(eventType: WebhookEventType, payload: any): Promise<void> {
    const targets = this.subscriptions.filter(
      (s) => s.active && (s.events.includes('ALL') || s.events.includes(eventType))
    );

    const deliveryPromises: Promise<WebhookDeliveryLog | null>[] = targets.map(async (target) => {
      // Filtrar por matchId se o webhook foi configurado para uma partida específica
      if (target.matchId && payload.matchId && target.matchId !== payload.matchId) {
        return null;
      }

      // Filtrar por leagueId se o webhook foi configurado para uma liga específica
      if (target.leagueId && payload.leagueId && target.leagueId !== payload.leagueId) {
        return null;
      }

      try {
        return await this.executeDelivery(target, eventType, payload);
      } catch {
        return null;
      }
    });

    await Promise.all(deliveryPromises);
  }

  /**
   * Retorna o histórico de entregas apenas dos webhooks pertencentes à chave.
   * Quando `webhookId` é fornecido, o webhook deve pertencer à chave.
   */
  public getDeliveries(ownerKey: string, webhookId?: string, limit = 50): WebhookDeliveryLog[] {
    const ownedIds = this.ownedWebhookIds(ownerKey);

    if (webhookId) {
      if (!ownedIds.has(webhookId)) {
        throw new NotFoundError(`Webhook com ID '${webhookId}' não encontrado.`);
      }
      return this.deliveries
        .filter((d) => d.webhookId === webhookId)
        .slice(0, Math.min(limit, MAX_DELIVERIES_STORED));
    }

    return this.deliveries
      .filter((d) => ownedIds.has(d.webhookId))
      .slice(0, Math.min(limit, MAX_DELIVERIES_STORED));
  }

  public async redeliver(deliveryId: string, ownerKey: string): Promise<WebhookDeliveryLog> {
    const delivery = this.deliveries.find((d) => d.id === deliveryId);
    if (!delivery) {
      throw new NotFoundError(`Entrega com ID '${deliveryId}' não encontrada no histórico recente.`);
    }

    const target = this.subscriptions.find((s) => s.id === delivery.webhookId && s.ownerKey === ownerKey);
    if (!target) {
      throw new NotFoundError(`Webhook '${delivery.webhookId}' associado a esta entrega não está mais ativo.`);
    }

    return this.executeDelivery(target, delivery.event, delivery.payload);
  }

  public clearDeliveries(): void {
    this.deliveries = [];
  }

  public clear(): void {
    this.subscriptions = [];
    this.deliveries = [];
    if (stateStore.name !== 'memory') {
      stateStore.del(WEBHOOKS_KEY).catch(() => undefined);
    }
  }
}

/**
 * View pública de uma assinatura: remove o `secret` (que assina os payloads)
 * do corpo da resposta, expondo apenas `secretSet` como sinalizador.
 */
export function toPublicSubscription(sub: WebhookSubscription) {
  const { secret: _secret, ...rest } = sub;
  return { ...rest, secretSet: Boolean(sub.secret) };
}

export const webhookService = WebhookService.getInstance();

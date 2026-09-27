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

  public subscribe(dto: CreateWebhookDto): WebhookSubscription {
    // Valida protocolo e bloqueia hosts internos (proteção contra SSRF).
    assertSafeWebhookUrl(dto.url);

    const sub: WebhookSubscription = {
      id: `whk-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      url: dto.url,
      events: dto.events && dto.events.length > 0 ? dto.events : ['ALL'],
      matchId: dto.matchId,
      secret: dto.secret,
      createdAt: new Date().toISOString(),
      active: true,
    };

    this.subscriptions.push(sub);
    this.persist();
    return sub;
  }

  public list(): WebhookSubscription[] {
    return this.subscriptions;
  }

  public getById(id: string): WebhookSubscription {
    const sub = this.subscriptions.find((s) => s.id === id);
    if (!sub) {
      throw new NotFoundError(`Webhook com ID '${id}' não encontrado.`);
    }
    return sub;
  }

  public unsubscribe(id: string): boolean {
    const index = this.subscriptions.findIndex((s) => s.id === id);
    if (index === -1) {
      throw new NotFoundError(`Webhook com ID '${id}' não encontrado.`);
    }
    this.subscriptions.splice(index, 1);
    this.persist();
    return true;
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
        // Revalida a resolução DNS imediatamente antes de cada tentativa (anti DNS rebinding).
        await assertResolvesToPublicHost(target.url);
      } catch (err) {
        lastError = err instanceof Error ? err.message : 'DNS inválido ou privado.';
        break;
      }

      try {
        const response = await fetch(target.url, {
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

      try {
        return await this.executeDelivery(target, eventType, payload);
      } catch {
        return null;
      }
    });

    await Promise.all(deliveryPromises);
  }

  public getDeliveries(webhookId?: string, limit = 50): WebhookDeliveryLog[] {
    const list = webhookId
      ? this.deliveries.filter((d) => d.webhookId === webhookId)
      : this.deliveries;
    return list.slice(0, Math.min(limit, MAX_DELIVERIES_STORED));
  }

  public getDeliveryById(id: string): WebhookDeliveryLog | undefined {
    return this.deliveries.find((d) => d.id === id);
  }

  public async redeliver(deliveryId: string): Promise<WebhookDeliveryLog> {
    const delivery = this.getDeliveryById(deliveryId);
    if (!delivery) {
      throw new NotFoundError(`Entrega com ID '${deliveryId}' não encontrada no histórico recente.`);
    }

    const target = this.subscriptions.find((s) => s.id === delivery.webhookId);
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

export const webhookService = WebhookService.getInstance();

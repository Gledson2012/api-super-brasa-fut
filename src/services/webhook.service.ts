import { WebhookSubscription, CreateWebhookDto, WebhookEventType } from '../models/webhook.model.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';
import { assertSafeWebhookUrl, assertResolvesToPublicHost, signWebhookPayload } from '../utils/webhook-security.js';
import { stateStore, STATE_PREFIX } from '../repositories/state-store.js';
import type { StateStore } from '../repositories/state-store.js';
import { withTimeout } from '../utils/with-timeout.js';

const WEBHOOKS_KEY = `${STATE_PREFIX}:webhooks`;
const HYDRATE_TIMEOUT_MS = 4000;

export class WebhookService {
  private static instance: WebhookService;
  private subscriptions: WebhookSubscription[] = [];

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

  public async notify(eventType: WebhookEventType, payload: any): Promise<void> {
    const targets = this.subscriptions.filter(
      (s) => s.active && (s.events.includes('ALL') || s.events.includes(eventType))
    );

    for (const target of targets) {
      // Filtrar por matchId se o webhook foi configurado para uma partida específica
      if (target.matchId && payload.matchId && target.matchId !== payload.matchId) {
        continue;
      }

      try {
        // Revalida a resolução DNS imediatamente antes do disparo (anti DNS rebinding).
        await assertResolvesToPublicHost(target.url);
      } catch {
        // Host interno/ inválido no momento do disparo: ignora este destino.
        continue;
      }

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
      };

      if (target.secret) {
        headers['X-SuperBrasa-Signature'] = signWebhookPayload(target.secret, body, timestamp);
      }

      // Disparo não bloqueante (fire and forget com timeout seguro)
      try {
        fetch(target.url, {
          method: 'POST',
          headers,
          body,
          signal: AbortSignal.timeout(3000),
        }).catch(() => {
          // Ignorar erros em caso de endpoint indisponível durante simulações
        });
      } catch {
        // Ignora erros de inicialização de requisição
      }
    }
  }

  public clear(): void {
    this.subscriptions = [];
    if (stateStore.name !== 'memory') {
      stateStore.del(WEBHOOKS_KEY).catch(() => undefined);
    }
  }
}

export const webhookService = WebhookService.getInstance();

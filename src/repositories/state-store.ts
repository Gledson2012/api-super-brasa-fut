import { Redis } from '@upstash/redis';
import { stateStoreConfig } from '../config/environment.js';

export interface StateStore {
  readonly name: string;
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  del(key: string): Promise<void>;
}

/** Backend padrão: processo em memória (suficiente para dev e testes). */
export class MemoryStateStore implements StateStore {
  public readonly name = 'memory';
  private readonly values = new Map<string, string>();

  public async get<T>(key: string): Promise<T | null> {
    const raw = this.values.get(key);
    if (raw === undefined) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  public async set<T>(key: string, value: T): Promise<void> {
    this.values.set(key, JSON.stringify(value));
  }

  public async del(key: string): Promise<void> {
    this.values.delete(key);
  }
}

/** Backend externo via Upstash Redis (REST), ideal para ambientes serverless. */
export class UpstashStateStore implements StateStore {
  public readonly name = 'upstash';
  private readonly client: Redis;

  constructor(url: string, token: string) {
    // Retries curtos: se o backend estiver indisponível, falhamos rápido em vez
    // de prender o boot/hidratação.
    this.client = new Redis({ url, token, retry: { retries: 1, backoff: () => 50 } });
  }

  public async get<T>(key: string): Promise<T | null> {
    const value = await this.client.get<T>(key);
    return value ?? null;
  }

  public async set<T>(key: string, value: T): Promise<void> {
    await this.client.set(key, value);
  }

  public async del(key: string): Promise<void> {
    await this.client.del(key);
  }
}

export function createStateStore(): StateStore {
  // Em testes o store é sempre em memória, garantindo uma suíte hermética
  // mesmo que credenciais externas estejam presentes no ambiente.
  if (stateStoreConfig.enabled && process.env.NODE_ENV !== 'test') {
    return new UpstashStateStore(stateStoreConfig.url, stateStoreConfig.token);
  }
  return new MemoryStateStore();
}

export const stateStore: StateStore = createStateStore();

/** Prefixo aplicado a todas as chaves persistidas da aplicação. */
export const STATE_PREFIX = 'super-brasa-fut';

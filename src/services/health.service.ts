import { stateStore, STATE_PREFIX } from '../repositories/state-store.js';
import { withTimeout } from '../utils/with-timeout.js';

export interface PersistenceHealth {
  backend: string;
  ok: boolean;
  latencyMs: number;
  error?: string;
}

const READINESS_TIMEOUT_MS = 3000;

/**
 * Verifica a conectividade real com o backend de persistência. Nunca lança:
 * erros são convertidos em `ok: false` para uso em probes de prontidão.
 */
export async function checkPersistenceHealth(): Promise<PersistenceHealth> {
  const startedAt = Date.now();

  try {
    await withTimeout(
      stateStore.get(`${STATE_PREFIX}:__readiness__`),
      READINESS_TIMEOUT_MS,
      'readiness check'
    );
    return { backend: stateStore.name, ok: true, latencyMs: Date.now() - startedAt };
  } catch (err) {
    return {
      backend: stateStore.name,
      ok: false,
      latencyMs: Date.now() - startedAt,
      error: err instanceof Error ? err.message : 'Erro desconhecido',
    };
  }
}

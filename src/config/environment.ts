import dotenv from 'dotenv';

dotenv.config();

function readEnv(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : fallback;
}

function readInt(value: string | undefined, fallback: number): number {
  const parsed = parseInt(value || '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/** Chaves de API por plano (configuráveis via variáveis de ambiente). */
export const apiKeys = {
  free: readEnv(process.env.API_KEY_FREE, 'brasa-free-key'),
  pro: readEnv(process.env.API_KEY_PRO, 'brasa-pro-2026'),
  enterprise: readEnv(process.env.API_KEY_ENTERPRISE, 'brasa-enterprise-secret'),
};

/** Limites de requisições por minuto de cada plano. */
export const rateLimits = {
  free: readInt(process.env.RATE_LIMIT_FREE, 60),
  pro: readInt(process.env.RATE_LIMIT_PRO, 300),
  enterprise: readInt(process.env.RATE_LIMIT_ENTERPRISE, 1000),
};

/**
 * Indica se cada chave foi definida explicitamente por variável de ambiente.
 * Quando `false`, o valor em uso é o default público do repositório.
 */
export const apiKeySources = {
  free: Boolean(process.env.API_KEY_FREE?.trim()),
  pro: Boolean(process.env.API_KEY_PRO?.trim()),
  enterprise: Boolean(process.env.API_KEY_ENTERPRISE?.trim()),
};

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || '0.0.0.0',
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  appName: 'API Super Brasa Fut',
  appVersion: '1.0.0',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  timeZone: readEnv(process.env.TIME_ZONE, 'America/Sao_Paulo'),
  defaultLimit: 20,
  maxLimit: 100,
};

/**
 * Configuração de persistência externa (Upstash Redis). Quando as credenciais
 * não estão presentes, a API opera 100% em memória a partir dos seeds JSON.
 */
export const stateStoreConfig = {
  url: process.env.UPSTASH_REDIS_REST_URL?.trim() || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN?.trim() || '',
  get enabled(): boolean {
    return this.url.length > 0 && this.token.length > 0;
  },
};

/**
 * Em produção, chaves de API dos planos pagos que não vieram de variável de
 * ambiente deixam de ser aceitas (ver `buildApiKeys` em auth.middleware). Esta
 * função apenas registra o aviso no boot, para que a configuração incompleta
 * não passe silenciosa.
 */
export function warnIfDefaultApiKeysInUse(): void {
  if (config.env !== 'production') return;

  const missing = (['pro', 'enterprise'] as const).filter((tier) => !apiKeySources[tier]);
  if (missing.length === 0) return;

  console.warn(
    `[segurança] API_KEY_* não definidas em produção para: ${missing.join(', ')}. ` +
      'Os valores default do repositório foram desativados para esses planos. ' +
      'Defina API_KEY_PRO / API_KEY_ENTERPRISE no ambiente para reativá-los.'
  );
}

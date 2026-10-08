import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../utils/response.js';
import { apiKeys, apiKeySources, rateLimits, config } from '../config/environment.js';

export interface ApiKeyInfo {
  key: string;
  tier: 'free' | 'pro' | 'enterprise';
  name: string;
  rateLimit: number;
}

export interface ApiKeySourceFlags {
  free: boolean;
  pro: boolean;
  enterprise: boolean;
}

/**
 * Monta a tabela de chaves aceitas. Em produção, os planos pagos só são
 * registrados quando a chave correspondente veio de variável de ambiente — caso
 * contrário os defaults públicos do repositório (`brasa-pro-2026`, ...)
 * concederiam tier Pro/Enterprise a qualquer cliente. O plano gratuito continua
 * sempre disponível, para não derrubar o acesso público.
 */
export function buildApiKeys(
  env: string,
  sources: ApiKeySourceFlags,
  keys: typeof apiKeys = apiKeys,
  limits: typeof rateLimits = rateLimits
): Record<string, ApiKeyInfo> {
  const privileged = env === 'production' ? sources : { pro: true, enterprise: true };

  const table: Record<string, ApiKeyInfo> = {
    [keys.free]: {
      key: keys.free,
      tier: 'free',
      name: 'Desenvolvedor Gratuito',
      rateLimit: limits.free,
    },
  };

  if (privileged.pro) {
    table[keys.pro] = {
      key: keys.pro,
      tier: 'pro',
      name: 'Plano Pro Super Brasa',
      rateLimit: limits.pro,
    };
  }

  if (privileged.enterprise) {
    table[keys.enterprise] = {
      key: keys.enterprise,
      tier: 'enterprise',
      name: 'Plano Enterprise',
      rateLimit: limits.enterprise,
    };
  }

  return table;
}

export const KNOWN_API_KEYS: Record<string, ApiKeyInfo> = buildApiKeys(config.env, apiKeySources);

declare global {
  namespace Express {
    interface Request {
      apiKeyInfo?: ApiKeyInfo;
    }
  }
}

export function apiKeyMiddleware(req: Request, res: Response, next: NextFunction): void {
  const headerKey = req.headers['x-api-key'] as string | undefined;

  if (headerKey) {
    const keyInfo = Object.prototype.hasOwnProperty.call(KNOWN_API_KEYS, headerKey)
      ? KNOWN_API_KEYS[headerKey]
      : undefined;
    if (!keyInfo) {
      res.status(401).json(errorResponse('Chave de API (X-API-Key) inválida ou expirada.', 'UNAUTHORIZED'));
      return;
    }
    req.apiKeyInfo = keyInfo;
    res.setHeader('X-API-Tier', keyInfo.tier);
    res.setHeader('X-API-Limit', String(keyInfo.rateLimit));
  } else {
    req.apiKeyInfo = {
      key: 'anonymous',
      tier: 'free',
      name: 'Acesso Público',
      rateLimit: rateLimits.free,
    };
    res.setHeader('X-API-Tier', 'free');
    res.setHeader('X-API-Limit', String(rateLimits.free));
  }

  next();
}

export function requireTier(minTier: 'pro' | 'enterprise') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const userTier = req.apiKeyInfo?.tier || 'free';
    if (minTier === 'pro' && userTier !== 'pro' && userTier !== 'enterprise') {
      res.status(403).json(
        errorResponse('Este recurso exige uma chave de API do Plano Pro ou Enterprise (X-API-Key).', 'FORBIDDEN_TIER')
      );
      return;
    }
    if (minTier === 'enterprise' && userTier !== 'enterprise') {
      res.status(403).json(
        errorResponse('Este recurso exige uma chave de API do Plano Enterprise (X-API-Key).', 'FORBIDDEN_TIER')
      );
      return;
    }
    next();
  };
}

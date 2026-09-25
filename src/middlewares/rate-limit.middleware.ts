// Named import (em vez do default) para funcionar tanto com a resolução de
// tipos ESM (index.d.mts) quanto com a CJS (index.d.ts), que não expõe default.
import { rateLimit, ipKeyGenerator } from 'express-rate-limit';
import { Request } from 'express';
import { errorResponse } from '../utils/response.js';
import { rateLimits } from '../config/environment.js';

/** Limite de requisições por minuto do plano identificado na requisição. */
function resolveRateLimit(req: Request): number {
  return req.apiKeyInfo?.rateLimit ?? rateLimits.free;
}

export const tieredRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: (req) => resolveRateLimit(req as Request),
  standardHeaders: true,
  legacyHeaders: false,
  // Health checks are always available
  skip: (req) => req.path === '/health' || req.path === '/health/ready',
  // Authenticated requests are limited per API key; anonymous ones per IP.
  keyGenerator: (req) => {
    const info = (req as Request).apiKeyInfo;
    if (info && info.key && info.key !== 'anonymous') {
      return `key:${info.key}`;
    }
    return `ip:${ipKeyGenerator(req.ip ?? '')}`;
  },
  handler: (_req, res) => {
    res.status(429).json(
      errorResponse(
        'Limite de requisições excedido. Por favor, tente novamente em alguns instantes.',
        'TOO_MANY_REQUESTS'
      )
    );
  },
});

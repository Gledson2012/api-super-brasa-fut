import rateLimit from 'express-rate-limit';
import { errorResponse } from '../utils/response.js';

export const globalRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 120, // limit each IP to 120 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health' || req.path === '/api/v1/health',
  handler: (_req, res) => {
    res.status(429).json(
      errorResponse(
        'Limite de requisições excedido. Por favor, tente novamente em alguns instantes.',
        'TOO_MANY_REQUESTS'
      )
    );
  },
});

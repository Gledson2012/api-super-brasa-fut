import { Router } from 'express';
import { successResponse } from '../utils/response.js';
import { rateLimits } from '../config/environment.js';

export const authRoutes = Router();

authRoutes.get('/verify', (req, res) => {
  const apiKeyInfo = req.apiKeyInfo || {
    key: 'anonymous',
    tier: 'free',
    name: 'Acesso Público',
    rateLimit: rateLimits.free,
  };

  res.json(
    successResponse({
      authenticated: apiKeyInfo.key !== 'anonymous',
      key: apiKeyInfo.key,
      tier: apiKeyInfo.tier,
      name: apiKeyInfo.name,
      rateLimitRequestsPerMin: apiKeyInfo.rateLimit,
      features: {
        liveStreamingSSE: true,
        simulationEngine: true,
        webhooks: true,
        statsLeaders: true,
        oddsComparison: true,
      },
    })
  );
});

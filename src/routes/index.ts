import { Router } from 'express';
import { leagueRoutes } from './league.routes.js';
import { teamRoutes } from './team.routes.js';
import { matchRoutes } from './match.routes.js';
import { standingRoutes } from './standing.routes.js';
import { playerRoutes } from './player.routes.js';
import { newsRoutes } from './news.routes.js';
import { oddsRoutes } from './odds.routes.js';
import { statsRoutes } from './stats.routes.js';
import { searchRoutes } from './search.routes.js';
import { authRoutes } from './auth.routes.js';
import { webhookRoutes } from './webhook.routes.js';
import { apiKeyMiddleware } from '../middlewares/auth.middleware.js';
import { tieredRateLimiter } from '../middlewares/rate-limit.middleware.js';
import { stateStore } from '../repositories/state-store.js';
import { asyncHandler } from '../utils/async-handler.js';
import { checkPersistenceHealth } from '../services/health.service.js';
import { alertService } from '../services/alert.service.js';
import { config } from '../config/environment.js';

export const apiRouter = Router();

// Middleware de identificação de chave de API e tier
apiRouter.use(apiKeyMiddleware);

// Rate limiting por plano (free/pro/enterprise), sempre após a identificação do tier
if (config.env !== 'test') {
  apiRouter.use(tieredRateLimiter);
}

// Health check and root info
apiRouter.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: config.appVersion,
    name: config.appName,
    persistence: stateStore.name,
    timeZone: config.timeZone,
  });
});

// Readiness probe: verifica a conectividade real com o backend de persistência
apiRouter.get(
  '/health/ready',
  asyncHandler(async (_req, res) => {
    const health = await checkPersistenceHealth();

    // Dispara alerta em mudança de estado (degradado/recuperado), respeitando o cooldown.
    await alertService.reportReadiness(health);

    res.status(health.ok ? 200 : 503).json({
      status: health.ok ? 'ready' : 'degraded',
      timestamp: new Date().toISOString(),
      checks: { persistence: health },
    });
  })
);

// Resource routes
apiRouter.use('/auth', authRoutes);
apiRouter.use('/webhooks', webhookRoutes);
apiRouter.use('/search', searchRoutes);
apiRouter.use('/leagues', leagueRoutes);
apiRouter.use('/teams', teamRoutes);
apiRouter.use('/matches', matchRoutes);
apiRouter.use('/standings', standingRoutes);
apiRouter.use('/players', playerRoutes);
apiRouter.use('/news', newsRoutes);
apiRouter.use('/odds', oddsRoutes);
apiRouter.use('/stats', statsRoutes);

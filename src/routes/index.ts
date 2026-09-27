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
import { syncRoutes } from './sync.routes.js';
import { apiKeyMiddleware } from '../middlewares/auth.middleware.js';
import { tieredRateLimiter } from '../middlewares/rate-limit.middleware.js';
import { stateStore } from '../repositories/state-store.js';
import { asyncHandler } from '../utils/async-handler.js';
import { checkPersistenceHealth } from '../services/health.service.js';
import { alertService } from '../services/alert.service.js';
import { config } from '../config/environment.js';
import { getPrometheusMetrics, getMetricsContentType } from '../services/metrics.service.js';

export const apiRouter = Router();

// Middleware de identificação de chave de API e tier
apiRouter.use(apiKeyMiddleware);

// Rate limiting por plano (free/pro/enterprise), sempre após a identificação do tier
if (config.env !== 'test') {
  apiRouter.use(tieredRateLimiter);
}

export function getApiMetadata() {
  return {
    name: config.appName,
    version: config.appVersion,
    status: 'active',
    documentation: '/docs',
    apiBase: config.apiPrefix,
    endpoints: {
      health: `${config.apiPrefix}/health`,
      readiness: `${config.apiPrefix}/health/ready`,
      metrics: '/metrics',
      search: `${config.apiPrefix}/search?q=flamengo`,
      leagues: `${config.apiPrefix}/leagues`,
      matches: `${config.apiPrefix}/matches`,
      live: `${config.apiPrefix}/matches/live`,
      liveStream: `${config.apiPrefix}/matches/live/stream`,
      standings: `${config.apiPrefix}/standings`,
      teams: `${config.apiPrefix}/teams`,
      players: `${config.apiPrefix}/players`,
      playerCompare: `${config.apiPrefix}/players/compare?p1=estevao-willian&p2=pedro-flamengo`,
      news: `${config.apiPrefix}/news`,
      odds: `${config.apiPrefix}/odds`,
      stats: `${config.apiPrefix}/stats/leaders`,
      webhooks: `${config.apiPrefix}/webhooks`,
      syncStatus: `${config.apiPrefix}/sync/status`,
      syncFlashscore: `${config.apiPrefix}/sync/flashscore`,
    },
  };
}

// Root info and API metadata for base prefix
apiRouter.get('/', (_req, res) => {
  res.json(getApiMetadata());
});

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

// Prometheus metrics endpoint
apiRouter.get(
  '/metrics',
  asyncHandler(async (_req, res) => {
    res.setHeader('Content-Type', getMetricsContentType());
    res.send(await getPrometheusMetrics());
  })
);

// Resource routes
apiRouter.use('/auth', authRoutes);
apiRouter.use('/webhooks', webhookRoutes);
apiRouter.use('/sync', syncRoutes);
apiRouter.use('/search', searchRoutes);
apiRouter.use('/leagues', leagueRoutes);
apiRouter.use('/teams', teamRoutes);
apiRouter.use('/matches', matchRoutes);
apiRouter.use('/standings', standingRoutes);
apiRouter.use('/players', playerRoutes);
apiRouter.use('/news', newsRoutes);
apiRouter.use('/odds', oddsRoutes);
apiRouter.use('/stats', statsRoutes);


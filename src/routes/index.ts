import { Router } from 'express';
import { leagueRoutes } from './league.routes.js';
import { teamRoutes } from './team.routes.js';
import { matchRoutes } from './match.routes.js';
import { standingRoutes } from './standing.routes.js';
import { playerRoutes } from './player.routes.js';
import { newsRoutes } from './news.routes.js';
import { oddsRoutes } from './odds.routes.js';
import { statsRoutes } from './stats.routes.js';
import { config } from '../config/environment.js';

export const apiRouter = Router();

// Health check and root info
apiRouter.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: config.appVersion,
    name: config.appName,
  });
});

// Resource routes
apiRouter.use('/leagues', leagueRoutes);
apiRouter.use('/teams', teamRoutes);
apiRouter.use('/matches', matchRoutes);
apiRouter.use('/standings', standingRoutes);
apiRouter.use('/players', playerRoutes);
apiRouter.use('/news', newsRoutes);
apiRouter.use('/odds', oddsRoutes);
apiRouter.use('/stats', statsRoutes);

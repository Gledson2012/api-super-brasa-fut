import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { config } from './config/environment.js';
import { apiRouter } from './routes/index.js';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware.js';
import { swaggerDocument } from './docs/swagger.js';
import { globalRateLimiter } from './middlewares/rate-limit.middleware.js';

export function createApp(): Express {
  const app = express();

  // Rate limiting (skip in test mode or custom headers)
  if (config.env !== 'test') {
    app.use(globalRateLimiter);
  }

  // Basic security and parsing middlewares
  const helmetFn = helmet as unknown as (options?: Record<string, unknown>) => express.RequestHandler;
  app.use(
    helmetFn({
      contentSecurityPolicy: false, // Allows Swagger UI assets
    })
  );
  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Logging middleware (skip in test mode)
  if (config.env !== 'test') {
    app.use(morgan('dev'));
  }

  // Root endpoint with API metadata
  app.get('/', (_req, res) => {
    res.json({
      name: config.appName,
      version: config.appVersion,
      status: 'active',
      documentation: '/docs',
      apiBase: config.apiPrefix,
      endpoints: {
        health: `${config.apiPrefix}/health`,
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
      },
    });
  });

  // Swagger UI documentation
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  // Mount API routes
  app.use(config.apiPrefix, apiRouter);

  // Error handling middlewares
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export const app = createApp();
export default app;

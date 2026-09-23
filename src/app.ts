import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { config } from './config/environment.js';
import { apiRouter } from './routes/index.js';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware.js';
import { swaggerDocument } from './docs/swagger.js';

export function createApp(): Express {
  const app = express();

  // Basic security and parsing middlewares
  const helmetMiddleware = (typeof helmet === 'function' ? helmet : (helmet as unknown as { default: typeof helmet }).default) as typeof helmet;
  app.use(
    (helmetMiddleware as unknown as (options?: Record<string, unknown>) => express.RequestHandler)({
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
        leagues: `${config.apiPrefix}/leagues`,
        matches: `${config.apiPrefix}/matches`,
        live: `${config.apiPrefix}/matches/live`,
        standings: `${config.apiPrefix}/standings`,
        teams: `${config.apiPrefix}/teams`,
        players: `${config.apiPrefix}/players`,
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

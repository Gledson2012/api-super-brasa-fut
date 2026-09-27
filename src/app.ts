import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { config } from './config/environment.js';
import { apiRouter, getApiMetadata } from './routes/index.js';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware.js';
import { metricsMiddleware } from './middlewares/metrics.middleware.js';
import { getPrometheusMetrics, getMetricsContentType } from './services/metrics.service.js';
import { swaggerDocument } from './docs/swagger.js';

export function createApp(): Express {
  const app = express();

  // Basic parsing/CORS middlewares
  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Prometheus Metrics instrumentation
  app.use(metricsMiddleware);

  // Logging middleware (skip in test mode)
  if (config.env !== 'test') {
    app.use(morgan('dev'));
  }

  // Swagger UI documentation: Helmet sem CSP (os assets do Swagger UI usam
  // scripts/estilos inline injetados pela própria lib), mas com os demais
  // cabeçalhos de segurança.
  const helmetFn = helmet as unknown as (options?: Record<string, unknown>) => express.RequestHandler;
  const helmetForDocs = helmetFn({ contentSecurityPolicy: false });
  app.use('/docs', helmetForDocs, swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  app.use('/api-docs', helmetForDocs, swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  // Demais rotas (inclui toda a API) com a CSP padrão do Helmet.
  app.use(helmetFn());

  // Root Prometheus scrape endpoint
  app.get('/metrics', async (_req, res) => {
    res.setHeader('Content-Type', getMetricsContentType());
    res.send(await getPrometheusMetrics());
  });

  // Root endpoint with API metadata
  app.get('/', (_req, res) => {
    res.json(getApiMetadata());
  });

  // Mount API routes
  app.use(config.apiPrefix, apiRouter);

  // Error handling middlewares
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export const app = createApp();
export default app;

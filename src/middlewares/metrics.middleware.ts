import { Request, Response, NextFunction } from 'express';
import { httpRequestDurationSeconds, httpRequestsTotal } from '../services/metrics.service.js';

/**
 * Normaliza o caminho da rota para evitar explosão de cardinalidade no Prometheus.
 * Prioriza o padrão parametrizado do Express (ex: /matches/:id) quando disponível.
 */
function resolveRoutePattern(req: Request): string {
  if (req.route?.path) {
    const base = req.baseUrl || '';
    const sub = typeof req.route.path === 'string' ? req.route.path : String(req.route.path);
    return `${base}${sub}` || '/';
  }
  return req.baseUrl || req.path || 'unknown';
}

export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Ignora chamadas ao próprio endpoint de métricas
  if (req.path === '/metrics' || req.path === '/api/v1/metrics') {
    next();
    return;
  }

  const start = performance.now();

  res.on('finish', () => {
    const durationSeconds = (performance.now() - start) / 1000;
    const route = resolveRoutePattern(req);
    const statusCode = String(res.statusCode);

    httpRequestDurationSeconds.observe(
      {
        method: req.method,
        route,
        status_code: statusCode,
      },
      durationSeconds
    );

    httpRequestsTotal.inc({
      method: req.method,
      route,
      status_code: statusCode,
    });
  });

  next();
}

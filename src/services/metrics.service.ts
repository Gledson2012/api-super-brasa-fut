import client from 'prom-client';

export const register = new client.Registry();

// Coleta métricas padrão do Node.js (GC, memória heap, event loop lag, CPU)
client.collectDefaultMetrics({ register, prefix: 'super_brasa_' });

export const httpRequestDurationSeconds = new client.Histogram({
  name: 'super_brasa_http_request_duration_seconds',
  help: 'Duração das requisições HTTP em segundos',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [register],
});

export const httpRequestsTotal = new client.Counter({
  name: 'super_brasa_http_requests_total',
  help: 'Total de requisições HTTP atendidas pela API',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

export const activeSseConnections = new client.Gauge({
  name: 'super_brasa_active_sse_connections',
  help: 'Número de conexões SSE ativas no streaming de partidas ao vivo',
  registers: [register],
});

export const webhookDeliveriesTotal = new client.Counter({
  name: 'super_brasa_webhook_deliveries_total',
  help: 'Total de entregas de webhooks realizadas',
  labelNames: ['event', 'status'],
  registers: [register],
});

export async function getPrometheusMetrics(): Promise<string> {
  return register.metrics();
}

export function getMetricsContentType(): string {
  return register.contentType;
}

export function resetMetrics(): void {
  register.resetMetrics();
}

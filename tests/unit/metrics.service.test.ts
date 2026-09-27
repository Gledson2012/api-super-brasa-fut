import { describe, it, expect, beforeEach } from 'vitest';
import {
  register,
  httpRequestDurationSeconds,
  httpRequestsTotal,
  activeSseConnections,
  webhookDeliveriesTotal,
  getPrometheusMetrics,
  getMetricsContentType,
  resetMetrics,
} from '../../src/services/metrics.service.js';

describe('MetricsService Unit Tests', () => {
  beforeEach(() => {
    resetMetrics();
  });

  it('exposes a valid Prometheus Content-Type', () => {
    const contentType = getMetricsContentType();
    expect(contentType).toContain('text/plain');
  });

  it('collects default Node.js and custom application metrics', async () => {
    httpRequestsTotal.inc({ method: 'GET', route: '/api/v1/matches', status_code: '200' });
    httpRequestDurationSeconds.observe(
      { method: 'GET', route: '/api/v1/matches', status_code: '200' },
      0.045
    );
    activeSseConnections.set(3);
    webhookDeliveriesTotal.inc({ event: 'GOAL', status: 'success' });

    const output = await getPrometheusMetrics();

    expect(output).toContain('super_brasa_http_requests_total');
    expect(output).toContain('method="GET"');
    expect(output).toContain('route="/api/v1/matches"');
    expect(output).toContain('status_code="200"');
    expect(output).toContain('super_brasa_active_sse_connections 3');
    expect(output).toContain('super_brasa_webhook_deliveries_total');
    expect(output).toContain('event="GOAL"');
    expect(output).toContain('status="success"');
  });

  it('resets metrics accurately when resetMetrics is called', async () => {
    activeSseConnections.set(5);
    resetMetrics();
    const output = await getPrometheusMetrics();
    expect(output).toContain('super_brasa_active_sse_connections 0');
  });
});

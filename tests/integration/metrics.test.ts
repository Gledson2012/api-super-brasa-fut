import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { resetMetrics } from '../../src/services/metrics.service.js';

describe('Prometheus Metrics Integration Tests', () => {
  beforeEach(() => {
    resetMetrics();
  });

  it('GET /metrics should return 200 with Prometheus text format', async () => {
    const res = await request(app).get('/metrics');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/plain/);
    expect(res.text).toContain('super_brasa_');
  });

  it('GET /api/v1/metrics should return 200 and Prometheus metrics', async () => {
    const res = await request(app).get('/api/v1/metrics');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/plain/);
    expect(res.text).toContain('super_brasa_http_requests_total');
  });

  it('records incoming requests in metrics counters and histograms', async () => {
    // Fazer uma requisição normal
    await request(app).get('/api/v1/health');

    const metricsRes = await request(app).get('/metrics');
    expect(metricsRes.status).toBe(200);
    expect(metricsRes.text).toContain('super_brasa_http_requests_total');
    expect(metricsRes.text).toContain('status_code="200"');
  });
});

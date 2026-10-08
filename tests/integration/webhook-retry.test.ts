import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import request from 'supertest';
import { app } from '../../src/app.js';
import { webhookService } from '../../src/services/webhook.service.js';
import { apiKeys } from '../../src/config/environment.js';

let receiver: http.Server;
let port = 0;
let requestCount = 0;
let failUntilAttempt = 0;

describe('Webhook Retry & Delivery History Integration Tests', () => {
  beforeAll(async () => {
    process.env.WEBHOOK_ALLOW_PRIVATE_HOSTS = 'true';

    receiver = http.createServer((_req, res) => {
      requestCount++;
      if (requestCount <= failUntilAttempt) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Falha temporária de servidor' }));
      } else {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      }
    });

    await new Promise<void>((resolve) => receiver.listen(0, '127.0.0.1', resolve));
    port = (receiver.address() as AddressInfo).port;
  });

  afterAll(async () => {
    delete process.env.WEBHOOK_ALLOW_PRIVATE_HOSTS;
    await new Promise<void>((resolve) => receiver.close(() => resolve()));
  });

  beforeEach(() => {
    requestCount = 0;
    failUntilAttempt = 0;
    webhookService.clear();
  });

  it('retries when the destination returns 500 and succeeds when it recovers', async () => {
    // Falha nas 2 primeiras tentativas e sucede na 3ª
    failUntilAttempt = 2;

    const sub = webhookService.subscribe({
      url: `http://127.0.0.1:${port}/hook-flaky`,
      events: ['GOAL'],
    }, apiKeys.pro);

    await webhookService.notify('GOAL', { matchId: 'match-flaky-1', minute: 23 });

    expect(requestCount).toBe(3);

    const deliveries = webhookService.getDeliveries(apiKeys.pro, sub.id);
    expect(deliveries.length).toBe(1);
    expect(deliveries[0].success).toBe(true);
    expect(deliveries[0].attempts).toBe(3);
    expect(deliveries[0].statusCode).toBe(200);
  });

  it('records delivery failure after exhausting max retries', async () => {
    // Falha em todas as tentativas
    failUntilAttempt = 10;

    const sub = webhookService.subscribe({
      url: `http://127.0.0.1:${port}/hook-down`,
      events: ['MATCH_EVENT'],
    }, apiKeys.pro);

    await webhookService.notify('MATCH_EVENT', { matchId: 'match-down-1' });

    expect(requestCount).toBe(3);

    const deliveries = webhookService.getDeliveries(apiKeys.pro, sub.id);
    expect(deliveries.length).toBe(1);
    expect(deliveries[0].success).toBe(false);
    expect(deliveries[0].attempts).toBe(3);
    expect(deliveries[0].statusCode).toBe(500);
    expect(deliveries[0].error).toContain('HTTP 500');
  });

  it('allows querying delivery history via API and redelivering an event', async () => {
    failUntilAttempt = 0;

    const sub = webhookService.subscribe({
      url: `http://127.0.0.1:${port}/hook-history`,
      events: ['GOAL'],
    }, apiKeys.pro);

    await webhookService.notify('GOAL', { matchId: 'match-hist-1', minute: 90 });

    // Consulta histórico geral de entregas
    const listRes = await request(app)
      .get('/api/v1/webhooks/deliveries')
      .set('x-api-key', apiKeys.pro);

    expect(listRes.status).toBe(200);
    expect(listRes.body.success).toBe(true);
    expect(listRes.body.data.length).toBeGreaterThanOrEqual(1);

    const deliveryId = listRes.body.data[0].id;

    // Consulta histórico do webhook específico
    const subDeliveriesRes = await request(app)
      .get(`/api/v1/webhooks/${sub.id}/deliveries`)
      .set('x-api-key', apiKeys.pro);

    expect(subDeliveriesRes.status).toBe(200);
    expect(subDeliveriesRes.body.success).toBe(true);
    expect(subDeliveriesRes.body.data[0].id).toBe(deliveryId);

    // Reenvio manual (redeliver)
    const redeliverRes = await request(app)
      .post(`/api/v1/webhooks/deliveries/${deliveryId}/redeliver`)
      .set('x-api-key', apiKeys.pro);

    expect(redeliverRes.status).toBe(200);
    expect(redeliverRes.body.success).toBe(true);
    expect(redeliverRes.body.data.success).toBe(true);
    expect(redeliverRes.body.data.attempts).toBe(1);
  });
});

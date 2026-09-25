import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { webhookService } from '../../src/services/webhook.service.js';
import { apiKeys } from '../../src/config/environment.js';

describe('Auth & API Key Integration Tests', () => {
  it('GET /api/v1/auth/verify without key should return free tier and public status', async () => {
    const res = await request(app).get('/api/v1/auth/verify');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.tier).toBe('free');
    expect(res.body.data.authenticated).toBe(false);
    expect(res.headers['x-api-tier']).toBe('free');
  });

  it('GET /api/v1/auth/verify with valid Pro key should return pro tier and 300 req/min limit', async () => {
    const res = await request(app)
      .get('/api/v1/auth/verify')
      .set('x-api-key', apiKeys.pro);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.tier).toBe('pro');
    expect(res.body.data.authenticated).toBe(true);
    expect(res.body.data.rateLimitRequestsPerMin).toBe(300);
    expect(res.headers['x-api-tier']).toBe('pro');
    expect(res.headers['x-api-limit']).toBe('300');
  });

  it('GET /api/v1/auth/verify with invalid key should return 401 UNAUTHORIZED', async () => {
    const res = await request(app)
      .get('/api/v1/auth/verify')
      .set('x-api-key', 'chave-invalida-xyz');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
});

describe('Webhooks API Integration Tests', () => {
  beforeEach(() => {
    webhookService.clear();
  });

  it('POST /api/v1/webhooks should register a new webhook subscriber', async () => {
    const res = await request(app)
      .post('/api/v1/webhooks')
      .set('x-api-key', apiKeys.pro)
      .send({
        url: 'https://meu-app.com/webhook/gols',
        events: ['GOAL', 'MATCH_EVENT'],
        secret: 'meu-segredo-123',
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.url).toBe('https://meu-app.com/webhook/gols');
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.events).toContain('GOAL');
  });

  it('POST /api/v1/webhooks with invalid url should return 400 BadRequest', async () => {
    const res = await request(app)
      .post('/api/v1/webhooks')
      .set('x-api-key', apiKeys.pro)
      .send({ url: 'url-invalida-sem-protocolo' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/v1/webhooks without a Pro key should be forbidden', async () => {
    const res = await request(app)
      .post('/api/v1/webhooks')
      .send({ url: 'https://meu-app.com/webhook/negado' });
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN_TIER');
  });

  it('GET /api/v1/webhooks should list all registered webhooks', async () => {
    webhookService.subscribe({ url: 'https://webhook.site/teste-1' });
    webhookService.subscribe({ url: 'https://webhook.site/teste-2' });

    const res = await request(app).get('/api/v1/webhooks').set('x-api-key', apiKeys.pro);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(2);
  });

  it('DELETE /api/v1/webhooks/:id should remove subscriber', async () => {
    const sub = webhookService.subscribe({ url: 'https://webhook.site/remover' });
    const res = await request(app).delete(`/api/v1/webhooks/${sub.id}`).set('x-api-key', apiKeys.pro);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.deleted).toBe(true);
    expect(webhookService.list().length).toBe(0);
  });
});

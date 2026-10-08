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

  it('GET /api/v1/auth/verify with prototype-derived keys must return 401, not 500', async () => {
    // Lookup por propriedades herdadas do prototype (constructor/toString/__proto__)
    // não deve ser tratado como chave válida.
    for (const maliciousKey of ['constructor', 'toString', '__proto__', 'hasOwnProperty']) {
      const res = await request(app).get('/api/v1/auth/verify').set('x-api-key', maliciousKey);
      expect(res.status, `chave "${maliciousKey}"`).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    }
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
    // O secret nunca é ecoado de volta; apenas um sinalizador indica que há um.
    expect(res.body.data.secret).toBeUndefined();
    expect(res.body.data.secretSet).toBe(true);
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

  it('GET /api/v1/webhooks should list only webhooks of the requesting key and never expose the secret', async () => {
    webhookService.subscribe({ url: 'https://webhook.site/teste-1', secret: 'segredo-abc-1' }, apiKeys.pro);
    webhookService.subscribe({ url: 'https://webhook.site/teste-2' }, apiKeys.pro);

    const res = await request(app).get('/api/v1/webhooks').set('x-api-key', apiKeys.pro);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(2);
    for (const sub of res.body.data) {
      expect(sub.secret).toBeUndefined();
      expect(typeof sub.secretSet).toBe('boolean');
    }
  });

  it('DELETE /api/v1/webhooks/:id should remove subscriber only for its owner', async () => {
    const sub = webhookService.subscribe({ url: 'https://webhook.site/remover' }, apiKeys.pro);
    const res = await request(app).delete(`/api/v1/webhooks/${sub.id}`).set('x-api-key', apiKeys.pro);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.deleted).toBe(true);
    expect(webhookService.list(apiKeys.pro).length).toBe(0);
  });

  it('GET/DELETE of a webhook owned by another API key should behave as 404 (no existence leak)', async () => {
    const sub = webhookService.subscribe({ url: 'https://webhook.site/alheio' }, apiKeys.enterprise);

    const deniedDelete = await request(app).delete(`/api/v1/webhooks/${sub.id}`).set('x-api-key', apiKeys.pro);
    expect(deniedDelete.status).toBe(404);

    const deniedGet = await request(app).get(`/api/v1/webhooks/${sub.id}`).set('x-api-key', apiKeys.pro);
    expect(deniedGet.status).toBe(404);
  });

  it('GET /api/v1/webhooks is scoped per API key (multi-tenant)', async () => {
    webhookService.subscribe({ url: 'https://webhook.site/do-pro', secret: 'segredo-pro-1' }, apiKeys.pro);
    webhookService.subscribe({ url: 'https://webhook.site/do-enterprise', secret: 'segredo-ent-1' }, apiKeys.enterprise);

    const proRes = await request(app).get('/api/v1/webhooks').set('x-api-key', apiKeys.pro);
    expect(proRes.status).toBe(200);
    expect(proRes.body.data).toHaveLength(1);
    expect(proRes.body.data[0].url).toBe('https://webhook.site/do-pro');
    expect(proRes.body.data[0].secret).toBeUndefined();

    const enterpriseRes = await request(app).get('/api/v1/webhooks').set('x-api-key', apiKeys.enterprise);
    expect(enterpriseRes.status).toBe(200);
    expect(enterpriseRes.body.data).toHaveLength(1);
    expect(enterpriseRes.body.data[0].url).toBe('https://webhook.site/do-enterprise');
    expect(enterpriseRes.body.data[0].secret).toBeUndefined();
  });
});

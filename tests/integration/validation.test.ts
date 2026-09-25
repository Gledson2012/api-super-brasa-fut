import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { apiKeys } from '../../src/config/environment.js';

describe('Zod Validation Middleware Integration Tests', () => {
  it('GET /api/v1/matches com status inválido deve retornar 422 VALIDATION_ERROR', async () => {
    const res = await request(app).get('/api/v1/matches?status=STATUS_INVALIDO');
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(Array.isArray(res.body.error.details)).toBe(true);
    expect(res.body.error.details[0].field).toBe('status');
  });

  it('GET /api/v1/matches com formato de data inválido deve retornar 422', async () => {
    const res = await request(app).get('/api/v1/matches?date=24/09/2026');
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details[0].field).toBe('date');
  });

  it('GET /api/v1/matches com limit superior a 100 deve retornar 422', async () => {
    const res = await request(app).get('/api/v1/matches?limit=999');
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details[0].field).toBe('limit');
  });

  it('GET /api/v1/matches/h2h sem parâmetros obrigatórios deve retornar 422', async () => {
    const res = await request(app).get('/api/v1/matches/h2h');
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('GET /api/v1/players com posição inválida deve retornar 422', async () => {
    const res = await request(app).get('/api/v1/players?position=Quarterback');
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details[0].field).toBe('position');
  });

  it('POST /api/v1/webhooks sem url deve retornar 422 com field url', async () => {
    const res = await request(app)
      .post('/api/v1/webhooks')
      .set('x-api-key', apiKeys.pro)
      .send({ events: ['GOAL'] });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.some((d: any) => d.field === 'url')).toBe(true);
  });

  it('POST /api/v1/webhooks com evento desconhecido deve retornar 422 com field events', async () => {
    const res = await request(app)
      .post('/api/v1/webhooks')
      .set('x-api-key', apiKeys.pro)
      .send({ url: 'https://meu-app.com/hook', events: ['GOLO'] });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details[0].field).toBe('events.0');
  });

  it('POST /api/v1/webhooks com segredo curto deve retornar 422 com field secret', async () => {
    const res = await request(app)
      .post('/api/v1/webhooks')
      .set('x-api-key', apiKeys.pro)
      .send({ url: 'https://meu-app.com/hook', secret: 'curto' });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details[0].field).toBe('secret');
  });

  it('POST /api/v1/matches/:id/simulate-event com tipo inválido deve retornar 422 com field type', async () => {
    const res = await request(app)
      .post('/api/v1/matches/match-pal-bot-2026/simulate-event')
      .set('x-api-key', apiKeys.pro)
      .send({ type: 'PENALTY', team: 'home' });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details[0].field).toBe('type');
  });

  it('POST /api/v1/matches/:id/simulate-event com minuto fora do intervalo deve retornar 422', async () => {
    const res = await request(app)
      .post('/api/v1/matches/match-pal-bot-2026/simulate-event')
      .set('x-api-key', apiKeys.pro)
      .send({ type: 'GOAL', team: 'away', minute: 200 });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details[0].field).toBe('minute');
  });
});

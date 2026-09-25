import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';

// Simula a queda do Upstash: qualquer leitura no store rejeita.
const { failingStore } = vi.hoisted(() => ({
  failingStore: {
    name: 'upstash',
    get: async () => {
      throw new Error('redis down');
    },
    set: async () => undefined,
    del: async () => undefined,
  },
}));

vi.mock('../../src/repositories/state-store.js', () => ({
  stateStore: failingStore,
  STATE_PREFIX: 'super-brasa-fut',
  createStateStore: () => failingStore,
}));

import { app } from '../../src/app.js';

describe('Readiness com persistência indisponível', () => {
  it('GET /api/v1/health/ready retorna 503 degraded quando o Upstash falha', async () => {
    const res = await request(app).get('/api/v1/health/ready');

    expect(res.status).toBe(503);
    expect(res.body.status).toBe('degraded');
    expect(res.body.checks.persistence.ok).toBe(false);
    expect(res.body.checks.persistence.backend).toBe('upstash');
    expect(res.body.checks.persistence.error).toBe('redis down');
  });

  it('GET /api/v1/health continua 200 (liveness não depende da persistência)', async () => {
    const res = await request(app).get('/api/v1/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.persistence).toBe('upstash');
  });
});

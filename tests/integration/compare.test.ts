import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';

describe('Player Comparison API Integration Tests', () => {
  it('GET /api/v1/players/compare without parameters should return 400', async () => {
    const res = await request(app).get('/api/v1/players/compare');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('MISSING_PARAMS');
  });

  it('GET /api/v1/players/compare with non-existent player should return 404', async () => {
    const res = await request(app).get('/api/v1/players/compare?p1=estevao-willian&p2=non-existent-player');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/v1/players/compare?p1=estevao-willian&p2=pedro-flamengo should return full side-by-side comparison', async () => {
    const res = await request(app).get('/api/v1/players/compare?p1=estevao-willian&p2=pedro-flamengo');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.player1).toBeDefined();
    expect(res.body.data.player2).toBeDefined();
    expect(res.body.data.player1.name).toContain('Estêvão');
    expect(res.body.data.player2.name).toContain('Pedro');
    expect(res.body.data.metricsComparison).toBeDefined();
    expect(['player1', 'player2', 'tie']).toContain(res.body.data.metricsComparison.moreGoals);
    expect(['player1', 'player2', 'tie']).toContain(res.body.data.metricsComparison.higherRating);
  });
});

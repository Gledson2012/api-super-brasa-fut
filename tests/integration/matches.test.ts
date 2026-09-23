import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';

describe('Matches API Integration Tests', () => {
  it('GET /api/v1/matches should return paginated matches', async () => {
    const res = await request(app).get('/api/v1/matches?limit=5');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeLessThanOrEqual(5);
    expect(res.body.meta).toBeDefined();
    expect(res.body.meta.total).toBeGreaterThan(0);
  });

  it('GET /api/v1/matches/live should return in-progress games', async () => {
    const res = await request(app).get('/api/v1/matches/live');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    res.body.data.forEach((match: any) => {
      expect(['LIVE', 'HALFTIME']).toContain(match.status);
    });
  });

  it('GET /api/v1/matches/h2h should return confrontation stats', async () => {
    const res = await request(app).get('/api/v1/matches/h2h?team1Id=palmeiras&team2Id=botafogo');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.team1Id).toBe('palmeiras');
    expect(res.body.data.team2Id).toBe('botafogo');
    expect(typeof res.body.data.totalMatches).toBe('number');
  });

  it('GET /api/v1/matches/:id should return single match details', async () => {
    const res = await request(app).get('/api/v1/matches/match-pal-bot-2026');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe('match-pal-bot-2026');
    expect(res.body.data.homeTeam.name).toBe('Palmeiras');
  });

  it('POST /api/v1/matches/:id/simulate-tick should progress match minute', async () => {
    const res = await request(app).post('/api/v1/matches/match-pal-bot-2026/simulate-tick');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.minute).toBeGreaterThanOrEqual(72);
  });

  it('GET /api/v1/matches/:id/odds should return match betting odds', async () => {
    const res = await request(app).get('/api/v1/matches/match-pal-bot-2026/odds');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.matchId).toBe('match-pal-bot-2026');
    expect(res.body.data.bookmakers.length).toBeGreaterThan(0);
  });
});

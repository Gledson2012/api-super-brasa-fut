import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';

describe('Search API Integration Tests', () => {
  it('GET /api/v1/search without query should return 400 error', async () => {
    const res = await request(app).get('/api/v1/search');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('MISSING_PARAM');
  });

  it('GET /api/v1/search?q=flamengo should return search results across multiple entities', async () => {
    const res = await request(app).get('/api/v1/search?q=flamengo');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.query).toBe('flamengo');
    expect(res.body.data.totalResults).toBeGreaterThan(0);
    expect(res.body.data.results.teams.length).toBeGreaterThan(0);
    expect(res.body.data.results.teams[0].name).toContain('Flamengo');
  });

  it('GET /api/v1/search?q=pedro&type=players should return only players', async () => {
    const res = await request(app).get('/api/v1/search?q=pedro&type=players');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.results.players.length).toBeGreaterThan(0);
    expect(res.body.data.results.teams.length).toBe(0);
    expect(res.body.data.results.leagues.length).toBe(0);
  });

  it('GET /api/v1/search?q=libertadores&type=leagues should return copa libertadores league', async () => {
    const res = await request(app).get('/api/v1/search?q=libertadores&type=leagues');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.results.leagues.length).toBeGreaterThan(0);
    expect(res.body.data.results.leagues[0].name).toContain('Libertadores');
  });

  it('GET /api/v1/search should include Cache-Control header', async () => {
    const res = await request(app).get('/api/v1/search?q=palmeiras');
    expect(res.status).toBe(200);
    expect(res.headers['cache-control']).toBeDefined();
    expect(res.headers['cache-control']).toContain('public');
  });
});

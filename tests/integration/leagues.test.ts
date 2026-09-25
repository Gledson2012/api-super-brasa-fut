import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';

describe('Leagues API Integration Tests', () => {
  it('GET /api/v1/health should return 200 and healthy status', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
  });

  it('GET /api/v1/leagues should return list of leagues', async () => {
    const res = await request(app).get('/api/v1/leagues');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('GET /api/v1/leagues/bra-serie-a-2026 should return Brasileirão Série A 2026', async () => {
    const res = await request(app).get('/api/v1/leagues/bra-serie-a-2026');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe('bra-serie-a-2026');
    expect(res.body.data.name).toBe('Brasileirão Série A 2026');
  });

  it('GET /api/v1/leagues/bra-serie-a-2026/standings should return standings table', async () => {
    const res = await request(app).get('/api/v1/leagues/bra-serie-a-2026/standings');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.leagueId).toBe('bra-serie-a-2026');
    expect(res.body.data.groups[0].table.length).toBe(20);
  });

  it('GET /api/v1/leagues/bra-serie-a-2026/matches should return matches', async () => {
    const res = await request(app).get('/api/v1/leagues/bra-serie-a-2026/matches');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /api/v1/leagues/bra-serie-a-2026/teams should return all 20 clubs', async () => {
    const res = await request(app).get('/api/v1/leagues/bra-serie-a-2026/teams');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(20);
  });

  it('GET /api/v1/leagues/bra-serie-a-2026/leaders should return stats leaders', async () => {
    const res = await request(app).get('/api/v1/leagues/bra-serie-a-2026/leaders');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.topScorers.length).toBeGreaterThan(0);
  });

  it('GET /api/v1/leagues/bra-copa-do-brasil-2026 should return Copa do Brasil 2026', async () => {
    const res = await request(app).get('/api/v1/leagues/bra-copa-do-brasil-2026');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Copa do Brasil 2026');
    expect(res.body.data.tier).toBe('cup');
  });

  it('GET /api/v1/leagues/uefa-champions-league-2026 should return UEFA Champions League 2026/27', async () => {
    const res = await request(app).get('/api/v1/leagues/uefa-champions-league-2026');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('UEFA Champions League 2026/27');
    expect(res.body.data.tier).toBe('continental');
  });

  it('GET /api/v1/leagues/bra-copa-do-brasil-2026/matches should return Flamengo x Corinthians match', async () => {
    const res = await request(app).get('/api/v1/leagues/bra-copa-do-brasil-2026/matches');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].id).toBe('match-fla-cor-cdb-2026');
  });

  it('GET /api/v1/leagues/uefa-champions-league-2026/matches should return Real Madrid x Man City match', async () => {
    const res = await request(app).get('/api/v1/leagues/uefa-champions-league-2026/matches');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].id).toBe('match-rma-mci-ucl-2026');
  });

  it('GET /api/v1/leagues/fifa-world-cup-2026 should return Copa do Mundo FIFA 2026', async () => {
    const res = await request(app).get('/api/v1/leagues/fifa-world-cup-2026');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Copa do Mundo FIFA 2026');
    expect(res.body.data.tier).toBe('international');
  });

  it('GET /api/v1/leagues/fifa-club-world-cup-2026 should return Mundial de Clubes FIFA 2026', async () => {
    const res = await request(app).get('/api/v1/leagues/fifa-club-world-cup-2026');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Mundial de Clubes FIFA 2026');
    expect(res.body.data.countryCode).toBe('FIFA');
  });

  it('GET /api/v1/leagues/conmebol-wc-qualifiers-2026/matches should return Brasil x Argentina match', async () => {
    const res = await request(app).get('/api/v1/leagues/conmebol-wc-qualifiers-2026/matches');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].id).toBe('match-bra-arg-wcq-2026');
  });

  it('GET /api/v1/leagues/uefa-nations-league-2026/matches should return França x Alemanha match', async () => {
    const res = await request(app).get('/api/v1/leagues/uefa-nations-league-2026/matches');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].id).toBe('match-fra-ger-unl-2026');
  });
});



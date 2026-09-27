import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';

describe('Additional Resources Integration Tests', () => {
  describe('Teams API', () => {
    it('GET /api/v1/teams should return teams list', async () => {
      const res = await request(app).get('/api/v1/teams?leagueId=bra-serie-a-2026');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(20);
    });

    it('GET /api/v1/teams/flamengo should return Flamengo details', async () => {
      const res = await request(app).get('/api/v1/teams/flamengo');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toContain('Flamengo');
    });

    it('GET /api/v1/teams/flamengo/players should return roster', async () => {
      const res = await request(app).get('/api/v1/teams/flamengo/players');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(15);
    });

    it('GET /api/v1/teams/corinthians/squad should return full squad with Memphis Depay and Garro', async () => {
      const res = await request(app).get('/api/v1/teams/corinthians/squad');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(15);
      const names = res.body.data.map((p: any) => p.name);
      expect(names).toContain('Memphis Depay');
      expect(names).toContain('Rodrigo Garro');
    });

    it('GET /api/v1/teams/sao-paulo/squad should return full squad with Lucas Moura and Calleri', async () => {
      const res = await request(app).get('/api/v1/teams/sao-paulo/squad');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(15);
      const names = res.body.data.map((p: any) => p.name);
      expect(names).toContain('Lucas Moura');
      expect(names).toContain('Jonathan Calleri');
    });

    it('GET /api/v1/teams/santos/squad should return full Santos squad', async () => {
      const res = await request(app).get('/api/v1/teams/santos/squad');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(12);
    });

    it('GET /api/v1/teams/brazil-national/squad should return Brazilian national team squad', async () => {
      const res = await request(app).get('/api/v1/teams/brazil-national/squad');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(12);
      const names = res.body.data.map((p: any) => p.name);
      expect(names).toContain('Vinicius Júnior');
      expect(names).toContain('Alisson Becker');
    });
  });

  describe('Players API', () => {
    it('GET /api/v1/players should return paginated players', async () => {
      const res = await request(app).get('/api/v1/players?limit=5');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeLessThanOrEqual(5);
    });

    it('GET /api/v1/players/:id should return player profile', async () => {
      const res = await request(app).get('/api/v1/players/estevao-willian');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Estêvão');
    });
  });

  describe('News API', () => {
    it('GET /api/v1/news should return sports news', async () => {
      const res = await request(app).get('/api/v1/news');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('GET /api/v1/news/:id should return single article', async () => {
      const res = await request(app).get('/api/v1/news/news-estevao-endrick-2026');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe('news-estevao-endrick-2026');
    });
  });

  describe('Odds API', () => {
    it('GET /api/v1/odds should return betting odds list', async () => {
      const res = await request(app).get('/api/v1/odds');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('Stats Leaders API', () => {
    it('GET /api/v1/stats/leaders should return stats leaders list', async () => {
      const res = await request(app).get('/api/v1/stats/leaders');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0].topScorers).toBeDefined();
    });

    it('GET /api/v1/stats/leaders/bra-serie-a-2026 should return league stats leaders', async () => {
      const res = await request(app).get('/api/v1/stats/leaders/bra-serie-a-2026');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.topScorers).toBeDefined();
    });
  });

  describe('API Root Metadata', () => {
    it('GET /api/v1 should return API metadata and endpoints list', async () => {
      const res = await request(app).get('/api/v1');
      expect(res.status).toBe(200);
      expect(res.body.name).toBe('API Super Brasa Fut');
      expect(res.body.status).toBe('active');
      expect(res.body.endpoints).toBeDefined();
      expect(res.body.endpoints.health).toBe('/api/v1/health');
    });

    it('GET /api/v1/ should return API metadata and endpoints list', async () => {
      const res = await request(app).get('/api/v1/');
      expect(res.status).toBe(200);
      expect(res.body.name).toBe('API Super Brasa Fut');
      expect(res.body.status).toBe('active');
    });
  });

  describe('Error Handling & 404', () => {
    it('GET /api/v1/unknown-endpoint should return 404', async () => {
      const res = await request(app).get('/api/v1/unknown-endpoint');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('GET /api/v1/leagues/non-existent-league should return 404', async () => {
      const res = await request(app).get('/api/v1/leagues/non-existent-league');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });
});

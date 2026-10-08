import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';

// Estes testes garantem que os filtros documentados sobrevivem à validação Zod
// (que por padrão remove chaves desconhecidas) — antes, os atalhos `?league=`,
// `?team=` e os filtros de /news e /odds eram silenciosamente ignorados.
describe('Query filters survive validation (no dead filters)', () => {
  describe('GET /api/v1/matches aliases', () => {
    it('applies ?league=as alias of ?leagueId=', async () => {
      const viaAlias = await request(app).get('/api/v1/matches?league=bra-serie-a-2026&limit=100');
      const viaCanonical = await request(app).get('/api/v1/matches?leagueId=bra-serie-a-2026&limit=100');

      expect(viaAlias.status).toBe(200);
      expect(viaCanonical.status).toBe(200);
      expect(viaAlias.body.meta.total).toBe(4);
      expect(viaAlias.body.meta.total).toBe(viaCanonical.body.meta.total);
      viaAlias.body.data.forEach((match: any) => expect(match.leagueId).toBe('bra-serie-a-2026'));
    });

    it('applies ?team=as alias of ?teamId=', async () => {
      const viaAlias = await request(app).get('/api/v1/matches?team=flamengo&limit=100');
      const viaCanonical = await request(app).get('/api/v1/matches?teamId=flamengo&limit=100');

      expect(viaAlias.status).toBe(200);
      expect(viaCanonical.status).toBe(200);
      expect(viaAlias.body.meta.total).toBe(2);
      expect(viaAlias.body.meta.total).toBe(viaCanonical.body.meta.total);
    });
  });

  describe('GET /api/v1/news filters', () => {
    it('applies category filter', async () => {
      const res = await request(app).get('/api/v1/news?category=selecao&limit=100');
      expect(res.status).toBe(200);
      expect(res.body.meta.total).toBe(1);
      expect(res.body.data[0].category).toBe('selecao');
    });

    it('applies tag filter', async () => {
      const res = await request(app).get('/api/v1/news?tag=Est%C3%AAv%C3%A3o&limit=100');
      expect(res.status).toBe(200);
      expect(res.body.meta.total).toBe(1);
      expect(res.body.data[0].tags).toContain('Estêvão');
    });

    it('applies leagueId filter', async () => {
      const res = await request(app).get('/api/v1/news?leagueId=bra-serie-a-2026&limit=100');
      expect(res.status).toBe(200);
      expect(res.body.meta.total).toBe(3);
    });

    it('applies teamId filter', async () => {
      const res = await request(app).get('/api/v1/news?teamId=palmeiras&limit=100');
      expect(res.status).toBe(200);
      expect(res.body.meta.total).toBe(1);
    });

    it('applies search filter', async () => {
      const res = await request(app).get('/api/v1/news?search=Morumbis&limit=100');
      expect(res.status).toBe(200);
      expect(res.body.meta.total).toBe(1);
    });
  });

  describe('GET /api/v1/odds filters', () => {
    it('applies leagueId filter', async () => {
      const all = await request(app).get('/api/v1/odds?limit=100');
      const filtered = await request(app).get('/api/v1/odds?leagueId=bra-serie-a-2026&limit=100');

      expect(all.status).toBe(200);
      expect(filtered.status).toBe(200);
      expect(all.body.meta.total).toBe(2);
      expect(filtered.body.meta.total).toBe(1);
    });

    it('applies matchId filter', async () => {
      const res = await request(app).get('/api/v1/odds?matchId=match-pal-bot-2026&limit=100');
      expect(res.status).toBe(200);
      expect(res.body.meta.total).toBe(1);
      expect(res.body.data[0].matchId).toBe('match-pal-bot-2026');
    });
  });
});
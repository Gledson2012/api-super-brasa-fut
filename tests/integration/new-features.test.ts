import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { apiKeys } from '../../src/config/environment.js';

describe('Novos Recursos - Brackets, Lineups, Stats, Auto-Simulação, CSV e Webhooks', () => {
  describe('Chaveamento de Mata-Mata (Brackets)', () => {
    it('GET /api/v1/leagues/:id/bracket deve retornar árvore de mata-mata da Copa do Brasil', async () => {
      const res = await request(app).get('/api/v1/leagues/bra-copa-do-brasil-2026/bracket');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.leagueId).toBe('bra-copa-do-brasil-2026');
      expect(Array.isArray(res.body.data.rounds)).toBe(true);
      expect(res.body.data.rounds.length).toBeGreaterThan(0);

      const finalRound = res.body.data.rounds.find((r: any) => r.stage === 'final');
      expect(finalRound).toBeDefined();
      expect(finalRound.matches[0].homeTeam.shortName).toBe('Flamengo');
    });

    it('GET /api/v1/leagues/:id/bracket deve retornar 404 para liga sem chaveamento cadastrado', async () => {
      const res = await request(app).get('/api/v1/leagues/liga-inexistente/bracket');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('Escalações Táticas (Lineups)', () => {
    it('GET /api/v1/matches/:id/lineups deve retornar escalação titular, reservas e campinho tático', async () => {
      const res = await request(app).get('/api/v1/matches/match-pal-bot-2026/lineups');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.matchId).toBe('match-pal-bot-2026');
      expect(res.body.data.home.formation).toBe('4-2-3-1');
      expect(res.body.data.home.coach).toBe('Abel Ferreira');
      expect(res.body.data.home.startingXI.length).toBe(11);
      expect(res.body.data.home.startingXI[0].gridPosition).toBeDefined();
      expect(res.body.data.away.formation).toBe('4-3-3');
      expect(res.body.data.away.startingXI.length).toBe(11);
    });

    it('GET /api/v1/matches/:id/lineups deve retornar 404 para partida inexistente', async () => {
      const res = await request(app).get('/api/v1/matches/partida-fantasma/lineups');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Estatísticas Avançadas (Stats, xG e Momentum)', () => {
    it('GET /api/v1/matches/:id/stats deve retornar xG, momentum e dados de posse', async () => {
      const res = await request(app).get('/api/v1/matches/match-pal-bot-2026/stats');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.matchId).toBe('match-pal-bot-2026');
      expect(res.body.data.stats.home.expectedGoals).toBe(1.85);
      expect(res.body.data.stats.away.expectedGoals).toBe(1.12);
      expect(Array.isArray(res.body.data.momentum)).toBe(true);
      expect(res.body.data.momentum.length).toBeGreaterThan(0);
    });
  });

  describe('Confronto Direto Avançado (H2H com Tabus e Médias)', () => {
    it('GET /api/v1/matches/h2h deve incluir médias de gols, cartões, BTTS e Over 2.5', async () => {
      const res = await request(app).get('/api/v1/matches/h2h?team1Id=palmeiras&team2Id=botafogo');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.averages).toBeDefined();
      expect(typeof res.body.data.averages.goalsPerMatch).toBe('number');
      expect(res.body.data.bothTeamsScored).toBeDefined();
      expect(typeof res.body.data.bothTeamsScored.percentage).toBe('number');
      expect(res.body.data.over25).toBeDefined();
      expect(typeof res.body.data.over25.percentage).toBe('number');
    });
  });

  describe('Simulação Automática / Live Clock Contínuo (Demo)', () => {
    it('POST /matches/:id/simulate-auto e GET /simulate-status devem controlar simulação contínua', async () => {
      const startRes = await request(app)
        .post('/api/v1/matches/match-pal-bot-2026/simulate-auto')
        .set('x-api-key', apiKeys.pro)
        .send({ intervalMs: 1000, autoEvents: false });

      expect(startRes.status).toBe(200);
      expect(startRes.body.success).toBe(true);
      expect(startRes.body.data.running).toBe(true);

      const statusRes = await request(app)
        .get('/api/v1/matches/match-pal-bot-2026/simulate-status');

      expect(statusRes.status).toBe(200);
      expect(statusRes.body.data.running).toBe(true);

      const stopRes = await request(app)
        .post('/api/v1/matches/match-pal-bot-2026/simulate-stop')
        .set('x-api-key', apiKeys.pro);

      expect(stopRes.status).toBe(200);
      expect(stopRes.body.data.running).toBe(false);

      const finalStatus = await request(app)
        .get('/api/v1/matches/match-pal-bot-2026/simulate-status');
      expect(finalStatus.body.data.running).toBe(false);
    });
  });

  describe('Exportação de Dados em CSV', () => {
    it('GET /standings/:leagueId?format=csv deve retornar CSV de classificação formatado', async () => {
      const res = await request(app).get('/api/v1/standings/bra-serie-a-2026?format=csv');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.text).toContain('Posição,Time,Pontos,Jogos');
      expect(res.text).toContain('Flamengo');
    });

    it('GET /leagues/:id/standings?format=csv deve retornar CSV correspondente', async () => {
      const res = await request(app).get('/api/v1/leagues/bra-serie-a-2026/standings?format=csv');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.text).toContain('Posição,Time,Pontos');
    });

    it('GET /matches?format=csv deve retornar partidas em formato CSV', async () => {
      const res = await request(app).get('/api/v1/matches?format=csv&limit=5');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.text).toContain('ID,Data,Liga,Mandante,Visitante');
    });
  });

  describe('Webhooks - leagueId e Idempotency', () => {
    it('POST /webhooks deve aceitar filtro por leagueId', async () => {
      const res = await request(app)
        .post('/api/v1/webhooks')
        .set('x-api-key', apiKeys.pro)
        .send({
          url: 'https://exemplo-publico-seguro.com/webhook',
          events: ['GOAL'],
          leagueId: 'bra-serie-a-2026',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.leagueId).toBe('bra-serie-a-2026');

      // Limpar webhook criado
      await request(app)
        .delete(`/api/v1/webhooks/${res.body.data.id}`)
        .set('x-api-key', apiKeys.pro);
    });
  });
});

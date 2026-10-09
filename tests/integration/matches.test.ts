import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { apiKeys } from '../../src/config/environment.js';
import { todayInTimeZone } from '../../src/utils/date.js';

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

  it('GET /api/v1/matches?date=2026-09-25 should return matches scheduled for today', async () => {
    const res = await request(app).get('/api/v1/matches?date=2026-09-25');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    res.body.data.forEach((m: any) => {
      expect(m.kickoffTime.startsWith('2026-09-25')).toBe(true);
    });
  });

  it('GET /api/v1/matches?date=today should resolve dynamically to current day with matches', async () => {
    const res = await request(app).get('/api/v1/matches?date=today');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    if (res.body.data.length > 0) {
      res.body.data.forEach((m: any) => {
        const matchDate = new Date(m.kickoffTime).toISOString().slice(0, 10);
        const isToday = m.kickoffTime.startsWith(todayInTimeZone()) || matchDate === todayInTimeZone();
        expect(isToday).toBe(true);
      });
    }
  });

  it('GET /api/v1/matches?date=hoje should alias to today', async () => {
    const byAlias = await request(app).get('/api/v1/matches?date=hoje');
    expect(byAlias.status).toBe(200);
    expect(byAlias.body.success).toBe(true);

    const byToday = await request(app).get('/api/v1/matches?date=today');
    const ids = (list: any[]) => list.map((m: any) => m.id);
    expect(ids(byAlias.body.data)).toEqual(ids(byToday.body.data));
  });

  it('GET /api/v1/matches should prioritize LIVE and today matches in default ordering', async () => {
    const res = await request(app).get('/api/v1/matches?limit=10');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    // As primeiras partidas devem ser partidas ao vivo ou jogos agendados para hoje
    const firstMatch = res.body.data[0];
    expect(['LIVE', 'HALFTIME', 'UPCOMING']).toContain(firstMatch.status);
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
    const res = await request(app)
      .post('/api/v1/matches/match-pal-bot-2026/simulate-tick')
      .set('x-api-key', apiKeys.pro);
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

  it('POST /api/v1/matches/:id/simulate-event should add a goal event and update score', async () => {
    const res = await request(app)
      .post('/api/v1/matches/match-pal-bot-2026/simulate-event')
      .set('x-api-key', apiKeys.pro)
      .send({ type: 'GOAL', team: 'home', player: 'Raphael Veiga', minute: 75 });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.score.home).toBeGreaterThanOrEqual(3);
    const lastEvent = res.body.data.events[res.body.data.events.length - 1];
    expect(lastEvent.type).toBe('GOAL');
    expect(lastEvent.primaryPlayer).toBe('Raphael Veiga');
  });

  it('POST /api/v1/matches/reset should restore matches to initial seed state', async () => {
    const res = await request(app)
      .post('/api/v1/matches/reset')
      .set('x-api-key', apiKeys.pro);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.count).toBeGreaterThan(0);
  });

  it('POST /api/v1/matches/reset without a Pro key should be forbidden', async () => {
    const res = await request(app).post('/api/v1/matches/reset');
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN_TIER');
  });

  it('GET /api/v1/matches?search=Palmeiras should filter matches by team name substring', async () => {
    const res = await request(app).get('/api/v1/matches?search=Palmeiras');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    res.body.data.forEach((m: any) => {
      const matchText = `${m.homeTeam.name} ${m.awayTeam.name} ${m.leagueName}`.toLowerCase();
      expect(matchText).toContain('palmeiras');
    });
  });

  it('GET /api/v1/matches?date=tomorrow should filter matches by tomorrow date without validation error', async () => {
    const res = await request(app).get('/api/v1/matches?date=tomorrow');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});


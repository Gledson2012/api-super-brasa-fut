import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';

describe('Gender and Age Category Filters', () => {
  describe('Matches filters', () => {
    it('GET /api/v1/matches?gender=women should return only womens matches', async () => {
      const res = await request(app).get('/api/v1/matches?gender=women');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.meta.total).toBe(1);
      res.body.data.forEach((match: any) => expect(match.gender).toBe('women'));
    });

    it('GET /api/v1/matches?ageCategory=u17 should return only youth matches', async () => {
      const res = await request(app).get('/api/v1/matches?ageCategory=u17');
      expect(res.status).toBe(200);
      expect(res.body.meta.total).toBe(2);
      res.body.data.forEach((match: any) => expect(match.ageCategory).toBe('u17'));
    });

    it('GET /api/v1/matches?gender=all&ageCategory=all should not filter anything out', async () => {
      const all = await request(app).get('/api/v1/matches?limit=100');
      const filtered = await request(app).get('/api/v1/matches?gender=all&ageCategory=all&limit=100');
      expect(filtered.status).toBe(200);
      expect(filtered.body.meta.total).toBe(all.body.meta.total);
    });

    it('GET /api/v1/matches?gender=men&ageCategory=senior should return senior mens matches', async () => {
      const res = await request(app).get('/api/v1/matches?gender=men&ageCategory=senior&limit=100');
      expect(res.status).toBe(200);
      expect(res.body.meta.total).toBeGreaterThan(0);
      res.body.data.forEach((match: any) => {
        expect(match.gender).toBe('men');
        expect(match.ageCategory).toBe('senior');
      });
    });
  });

  describe('Teams filters', () => {
    it('GET /api/v1/teams?gender=women should return only womens teams', async () => {
      const res = await request(app).get('/api/v1/teams?gender=women&limit=100');
      expect(res.status).toBe(200);
      expect(res.body.meta.total).toBe(4);
      res.body.data.forEach((team: any) => expect(team.gender).toBe('women'));
    });

    it('GET /api/v1/teams?ageCategory=u17 should return the youth teams', async () => {
      const res = await request(app).get('/api/v1/teams?ageCategory=u17&limit=100');
      expect(res.status).toBe(200);
      expect(res.body.meta.total).toBe(20);
      res.body.data.forEach((team: any) => {
        expect(team.ageCategory).toBe('u17');
        expect(team.leagueId).toBe('bra-sub-17-2026');
      });
    });

    it('GET /api/v1/teams?ageCategory=all should ignore the filter', async () => {
      const all = await request(app).get('/api/v1/teams?limit=100');
      const filtered = await request(app).get('/api/v1/teams?ageCategory=all&limit=100');
      expect(filtered.body.meta.total).toBe(all.body.meta.total);
    });

    it('GET /api/v1/teams?gender=men&ageCategory=senior should return senior mens teams only', async () => {
      const res = await request(app).get('/api/v1/teams?gender=men&ageCategory=senior&limit=100');
      expect(res.status).toBe(200);
      res.body.data.forEach((team: any) => {
        expect(team.gender).toBe('men');
        expect(team.ageCategory).toBe('senior');
      });
    });
  });

  describe('Leagues filters', () => {
    it('GET /api/v1/leagues?gender=women should return only womens leagues', async () => {
      const res = await request(app).get('/api/v1/leagues?gender=women&limit=100');
      expect(res.status).toBe(200);
      expect(res.body.meta.total).toBeGreaterThanOrEqual(2);
      res.body.data.forEach((league: any) => expect(league.gender).toBe('women'));
    });

    it('GET /api/v1/leagues?ageCategory=u17 should return the youth league', async () => {
      const res = await request(app).get('/api/v1/leagues?ageCategory=u17');
      expect(res.status).toBe(200);
      expect(res.body.meta.total).toBe(1);
      expect(res.body.data[0].id).toBe('bra-sub-17-2026');
    });

    it('GET /api/v1/leagues?country=Brasil should return only brazilian leagues', async () => {
      const res = await request(app).get('/api/v1/leagues?country=Brasil&limit=100');
      expect(res.status).toBe(200);
      expect(res.body.meta.total).toBeGreaterThanOrEqual(4);
      res.body.data.forEach((league: any) => expect(league.country).toBe('Brasil'));
    });

    it('GET /api/v1/leagues?search=libertadores should find the Libertadores', async () => {
      const res = await request(app).get('/api/v1/leagues?search=libertadores');
      expect(res.status).toBe(200);
      expect(res.body.meta.total).toBe(1);
      expect(res.body.data[0].id).toBe('conmebol-libertadores-2026');
    });
  });
});

describe('Standings Consistency Tests', () => {
  it('GET /api/v1/leagues/bra-serie-b-2026/standings should include the finished Operário 1-0 Criciúma round', async () => {
    const res = await request(app).get('/api/v1/leagues/bra-serie-b-2026/standings');
    expect(res.status).toBe(200);

    const operario = res.body.data.groups[0].table.find((row: any) => row.team.id === 'operario-pr');
    expect(operario.played).toBe(28);
    expect(operario.won).toBe(12);
    expect(operario.lost).toBe(10);
    expect(operario.points).toBe(42);
    expect(operario.goalsFor).toBe(25);
    expect(operario.goalsAgainst).toBe(22);
    expect(operario.points).toBe(operario.won * 3 + operario.drawn);
    expect(operario.goalDifference).toBe(operario.goalsFor - operario.goalsAgainst);
  });

  it('GET /api/v1/leagues/fifa-wwc-u20-2026/standings should include the finished Brasil 3-1 EUA match', async () => {
    const res = await request(app).get('/api/v1/leagues/fifa-wwc-u20-2026/standings');
    expect(res.status).toBe(200);

    const table = res.body.data.groups[0].table;
    const brazil = table.find((row: any) => row.team.id === 'brazil-women-u20');
    const usa = table.find((row: any) => row.team.id === 'usa-women-u20');

    expect(brazil.played).toBe(4);
    expect(brazil.points).toBe(12);
    expect(brazil.goalsFor).toBe(17);
    expect(brazil.goalsAgainst).toBe(1);
    expect(usa.played).toBe(4);
    expect(usa.lost).toBe(2);
    expect(usa.goalsFor).toBe(10);
    expect(usa.goalsAgainst).toBe(6);
  });

  it('GET /api/v1/leagues/bra-sub-17-2026/standings should return a consistent 20 team table', async () => {
    const res = await request(app).get('/api/v1/leagues/bra-sub-17-2026/standings');
    expect(res.status).toBe(200);

    const table = res.body.data.groups[0].table;
    expect(table.length).toBe(20);

    let totalWon = 0;
    let totalDrawn = 0;
    let totalLost = 0;
    let totalGoalsFor = 0;
    let totalGoalsAgainst = 0;

    table.forEach((row: any, index: number) => {
      expect(row.position).toBe(index + 1);
      expect(row.played).toBe(row.won + row.drawn + row.lost);
      expect(row.points).toBe(row.won * 3 + row.drawn);
      expect(row.goalDifference).toBe(row.goalsFor - row.goalsAgainst);
      expect(row.pointsPercentage).toBeCloseTo((row.points / (row.played * 3)) * 100, 1);
      expect(row.form.length).toBe(5);

      if (index > 0) {
        expect(table[index - 1].points).toBeGreaterThanOrEqual(row.points);
      }

      totalWon += row.won;
      totalDrawn += row.drawn;
      totalLost += row.lost;
      totalGoalsFor += row.goalsFor;
      totalGoalsAgainst += row.goalsAgainst;
    });

    // Numa tabela real a soma de vitórias é igual à de derrotas e os gols marcados
    // por todos os times é igual ao total de gols sofridos.
    expect(totalWon).toBe(totalLost);
    expect(totalGoalsFor).toBe(totalGoalsAgainst);
    expect(totalDrawn % 2).toBe(0);
  });

  it('Sub-17 matches should reference the youth team entities instead of the senior clubs', async () => {
    const match = await request(app).get('/api/v1/matches/match-cor-juv-u17-2026');
    expect(match.status).toBe(200);
    expect(match.body.data.homeTeam.id).toBe('corinthians-u17');
    expect(match.body.data.awayTeam.id).toBe('juventude-u17');

    const homeTeam = await request(app).get('/api/v1/teams/corinthians-u17');
    expect(homeTeam.status).toBe(200);
    expect(homeTeam.body.data.ageCategory).toBe('u17');
    expect(homeTeam.body.data.leagueId).toBe('bra-sub-17-2026');

    const senior = await request(app).get('/api/v1/teams/corinthians');
    expect(senior.status).toBe(200);
    expect(senior.body.data.ageCategory).toBe('senior');
    expect(senior.body.data.leagueId).toBe('bra-serie-a-2026');
  });
});

describe('Standings Validation Endpoint', () => {
  it('GET /api/v1/standings/validate should report every standing as consistent', async () => {
    const res = await request(app).get('/api/v1/standings/validate');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.issues).toEqual([]);
    expect(res.body.data.valid).toBe(true);
    expect(res.body.data.checkedLeagues).toBe(4);
    expect(res.body.data.checkedEntries).toBe(46);
    expect(res.body.data.partialLeagues).toEqual(['bra-serie-b-2026', 'fifa-wwc-u20-2026']);
  });

  it('GET /api/v1/standings/validate should not warn: no league declares standings without a table', async () => {
    const res = await request(app).get('/api/v1/standings/validate');
    expect(res.status).toBe(200);
    expect(res.body.data.warnings).toEqual([]);
    // Um aviso não invalida as tabelas existentes.
    expect(res.body.data.valid).toBe(true);
  });

  it('every league with hasStandings=true should expose its standings table', async () => {
    const leagues = await request(app).get('/api/v1/leagues?limit=100');
    expect(leagues.status).toBe(200);

    const declaringStandings = leagues.body.data.filter((league: any) => league.hasStandings);
    expect(declaringStandings.length).toBe(4);

    for (const league of declaringStandings) {
      const standings = await request(app).get(`/api/v1/leagues/${league.id}/standings`);
      expect(standings.status).toBe(200);
      expect(standings.body.data.leagueId).toBe(league.id);
    }
  });

  it('GET /api/v1/leagues/bra-serie-a-2026/standings should have balanced aggregates', async () => {
    const res = await request(app).get('/api/v1/leagues/bra-serie-a-2026/standings');
    expect(res.status).toBe(200);

    const table = res.body.data.groups[0].table;
    const sum = (key: string): number => table.reduce((total: number, row: any) => total + row[key], 0);

    expect(sum('played') % 2).toBe(0);
    expect(sum('won')).toBe(sum('lost'));
    expect(sum('drawn') % 2).toBe(0);
    expect(sum('goalsFor')).toBe(sum('goalsAgainst'));
  });

  it('GET /api/v1/standings/validate should keep working alongside /:leagueId', async () => {
    const byLeague = await request(app).get('/api/v1/standings/bra-serie-b-2026');
    expect(byLeague.status).toBe(200);
    expect(Array.isArray(byLeague.body.data.groups[0].table)).toBe(true);
  });
});

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';

describe('Team Calendar API Integration Tests', () => {
  it('GET /api/v1/teams/flamengo/calendar should return team calendar and match record', async () => {
    const res = await request(app).get('/api/v1/teams/flamengo/calendar');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.team.name).toContain('Flamengo');
    expect(res.body.data.summary).toBeDefined();
    expect(typeof res.body.data.summary.totalMatches).toBe('number');
    expect(Array.isArray(res.body.data.recentResults)).toBe(true);
    expect(Array.isArray(res.body.data.upcomingFixtures)).toBe(true);
    expect(Array.isArray(res.body.data.allMatches)).toBe(true);
  });

  it('GET /api/v1/teams/invalid-id/calendar should return 404', async () => {
    const res = await request(app).get('/api/v1/teams/invalid-id/calendar');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

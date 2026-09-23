import { describe, it, expect } from 'vitest';
import { matchService } from '../../src/services/match.service.js';

describe('Match Service Unit Tests', () => {
  it('should list matches with pagination', async () => {
    const result = await matchService.getMatches({}, { page: 1, limit: 10 });
    expect(result.data.length).toBeGreaterThan(0);
    expect(result.pagination.total).toBeGreaterThan(0);
  });

  it('should find live matches', async () => {
    const liveMatches = await matchService.getLiveMatches();
    expect(Array.isArray(liveMatches)).toBe(true);
    liveMatches.forEach((m) => {
      expect(['LIVE', 'HALFTIME']).toContain(m.status);
    });
  });

  it('should calculate head to head between two teams', async () => {
    const h2h = await matchService.getHeadToHead('palmeiras', 'botafogo');
    expect(h2h.team1Id).toBe('palmeiras');
    expect(h2h.team2Id).toBe('botafogo');
    expect(typeof h2h.totalMatches).toBe('number');
  });

  it('should simulate minute progression in a live match', async () => {
    const updated = await matchService.simulateLiveTick('match-pal-bot-2026');
    expect(updated.id).toBe('match-pal-bot-2026');
    expect(updated.minute).toBeGreaterThanOrEqual(72);
  });
});

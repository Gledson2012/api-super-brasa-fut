import { describe, it, expect, afterEach, vi } from 'vitest';
import { flashscoreSyncService } from '../../src/services/flashscore-sync.service.js';
import { sofascoreSyncService } from '../../src/services/sofascore-sync.service.js';
import { normalizeSyncIntervalMinutes } from '../../src/controllers/sync.controller.js';

describe('Sync worker interval sanitization', () => {
  afterEach(() => {
    flashscoreSyncService.stopBackgroundSync();
    sofascoreSyncService.stopBackgroundSync();
    vi.restoreAllMocks();
  });

  describe('normalizeSyncIntervalMinutes', () => {
    it.each([
      [undefined, 5],
      [null, 5],
      [10, 10],
      ['10', 10],
      ['10.5', 10],
      ['abc', 5],
      [NaN, 5],
      [Infinity, 5],
      [0, 5],
      [-5, 5],
      [1.9, 1],
      [true, 5],
      [ {}, 5],
    ])('normalizes %o to %i minute(s)', (raw, expected) => {
      expect(normalizeSyncIntervalMinutes(raw)).toBe(expected);
    });
  });

  describe('background workers never schedule a sub-minute tick for invalid input', () => {
    it.each([NaN, Infinity, 0, -1, 1.6])('flashscore(%o) -> safe finite delay', (badValue) => {
      const intervalSpy = vi.spyOn(globalThis, 'setInterval');
      flashscoreSyncService.startBackgroundSync(badValue as unknown as number);

      const delay = intervalSpy.mock.calls.at(-1)?.[1];
      expect(delay).toBeTypeOf('number');
      expect(delay).not.toBeNaN();
      expect(delay as number).toBeGreaterThanOrEqual(60000);
    });

    it.each([NaN, Infinity, 0, -1, 1.6])('sofascore(%o) -> safe finite delay', (badValue) => {
      const intervalSpy = vi.spyOn(globalThis, 'setInterval');
      sofascoreSyncService.startBackgroundSync(badValue as unknown as number);

      const delay = intervalSpy.mock.calls.at(-1)?.[1];
      expect(delay).toBeTypeOf('number');
      expect(delay).not.toBeNaN();
      expect(delay as number).toBeGreaterThanOrEqual(60000);
    });
  });
});
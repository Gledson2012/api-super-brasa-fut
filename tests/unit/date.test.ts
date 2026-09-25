import { describe, it, expect } from 'vitest';
import { todayInTimeZone } from '../../src/utils/date.js';

describe('todayInTimeZone', () => {
  it('formats as YYYY-MM-DD', () => {
    expect(todayInTimeZone('America/Sao_Paulo')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('respects the requested timezone at a given instant', () => {
    // 2026-01-01T02:00:00Z => 2025-12-31 23:00 em São Paulo (UTC-3)
    const instant = new Date('2026-01-01T02:00:00.000Z');
    expect(todayInTimeZone('America/Sao_Paulo', instant)).toBe('2025-12-31');
    expect(todayInTimeZone('UTC', instant)).toBe('2026-01-01');
  });
});

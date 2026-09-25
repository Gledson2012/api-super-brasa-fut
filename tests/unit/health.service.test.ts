import { describe, it, expect } from 'vitest';
import { checkPersistenceHealth } from '../../src/services/health.service.js';

describe('checkPersistenceHealth', () => {
  it('reports ok for the in-memory backend (always reachable)', async () => {
    const health = await checkPersistenceHealth();

    expect(health.ok).toBe(true);
    expect(health.backend).toBe('memory');
    expect(typeof health.latencyMs).toBe('number');
    expect(health.error).toBeUndefined();
  });
});

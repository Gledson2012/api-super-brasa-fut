import { describe, it, expect } from 'vitest';
import { buildApiKeys } from '../../src/middlewares/auth.middleware.js';

const keys = { free: 'free-key', pro: 'pro-key', enterprise: 'enterprise-key' };
const limits = { free: 60, pro: 300, enterprise: 1000 };
const defaultKeys = { free: false, pro: false, enterprise: false };

describe('API key resolution (buildApiKeys)', () => {
  it('registers every plan outside production, even with the repository defaults', () => {
    const table = buildApiKeys('development', defaultKeys, keys, limits);

    expect(Object.keys(table)).toHaveLength(3);
    expect(table[keys.free].tier).toBe('free');
    expect(table[keys.pro].tier).toBe('pro');
    expect(table[keys.enterprise].tier).toBe('enterprise');
    expect(table[keys.enterprise].rateLimit).toBe(1000);
  });

  it('drops privileged default keys in production when API_KEY_* are not set', () => {
    const table = buildApiKeys('production', defaultKeys, keys, limits);

    expect(Object.keys(table)).toEqual([keys.free]);
    expect(table[keys.pro]).toBeUndefined();
    expect(table[keys.enterprise]).toBeUndefined();
  });

  it('registers privileged plans in production when the keys come from the environment', () => {
    const table = buildApiKeys('production', { free: false, pro: true, enterprise: true }, keys, limits);

    expect(table[keys.free].rateLimit).toBe(limits.free);
    expect(table[keys.pro].tier).toBe('pro');
    expect(table[keys.enterprise].tier).toBe('enterprise');
  });
});

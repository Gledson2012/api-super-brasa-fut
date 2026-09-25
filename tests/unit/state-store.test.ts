import { describe, it, expect } from 'vitest';
import { MemoryStateStore, createStateStore } from '../../src/repositories/state-store.js';

describe('MemoryStateStore', () => {
  it('stores, reads and deletes JSON values', async () => {
    const store = new MemoryStateStore();
    const value = [{ id: 'whk-1' }, { id: 'whk-2' }];

    expect(await store.get('missing')).toBeNull();
    await store.set('webhooks', value);
    expect(await store.get('webhooks')).toEqual(value);

    await store.del('webhooks');
    expect(await store.get('webhooks')).toBeNull();
  });

  it('uses the in-memory backend in the test environment', () => {
    expect(createStateStore().name).toBe('memory');
  });
});

import { describe, it, expect } from 'vitest';
import { withTimeout } from '../../src/utils/with-timeout.js';

describe('withTimeout', () => {
  it('resolves when the promise settles in time', async () => {
    await expect(withTimeout(Promise.resolve(42), 1000)).resolves.toBe(42);
  });

  it('rejects when the promise exceeds the timeout', async () => {
    const slow = new Promise((resolve) => setTimeout(resolve, 500));
    await expect(withTimeout(slow, 20, 'teste')).rejects.toThrow(/Timeout de 20ms excedido em teste/);
  });

  it('propagates the original rejection', async () => {
    await expect(withTimeout(Promise.reject(new Error('boom')), 1000)).rejects.toThrow('boom');
  });
});

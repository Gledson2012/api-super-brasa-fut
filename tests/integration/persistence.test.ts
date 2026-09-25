import { describe, it, expect, afterEach } from 'vitest';
import { db } from '../../src/repositories/db.js';
import { webhookService } from '../../src/services/webhook.service.js';
import type { StateStore } from '../../src/repositories/state-store.js';
import type { Match } from '../../src/models/match.model.js';
import type { WebhookSubscription } from '../../src/models/webhook.model.js';

/** Store em memória com nome não-`memory`, para exercitar o caminho de hidratação. */
class FakeStore implements StateStore {
  public readonly name = 'fake';
  private readonly data = new Map<string, unknown>();

  constructor(seed: Record<string, unknown> = {}) {
    for (const [key, value] of Object.entries(seed)) {
      this.data.set(key, value);
    }
  }

  public async get<T>(key: string): Promise<T | null> {
    return this.data.has(key) ? (this.data.get(key) as T) : null;
  }

  public async set<T>(key: string, value: T): Promise<void> {
    this.data.set(key, value);
  }

  public async del(key: string): Promise<void> {
    this.data.delete(key);
  }
}

describe('External state hydration', () => {
  afterEach(() => {
    db.reload();
    webhookService.clear();
  });

  it('hydrates matches from an external store, overriding the JSON seeds', async () => {
    const fakeMatches = [{ id: 'match-fake-1' }, { id: 'match-fake-2' }] as unknown as Match[];
    const store = new FakeStore({ 'super-brasa-fut:matches': fakeMatches });

    await db.hydrate(store);

    expect(db.matches).toHaveLength(2);
    expect(db.matches[0].id).toBe('match-fake-1');
  });

  it('hydrates webhook subscriptions from an external store', async () => {
    const subscriptions: WebhookSubscription[] = [
      {
        id: 'whk-fake',
        url: 'https://example.com/hook',
        events: ['GOAL'],
        createdAt: new Date().toISOString(),
        active: true,
      },
    ];
    const store = new FakeStore({ 'super-brasa-fut:webhooks': subscriptions });

    await webhookService.hydrate(store);

    expect(webhookService.list()).toHaveLength(1);
    expect(webhookService.getById('whk-fake').url).toBe('https://example.com/hook');
  });

  it('keeps the JSON seed baseline for entities absent from the store', async () => {
    const baselineTeams = db.teams.length;
    expect(baselineTeams).toBeGreaterThan(0);

    await db.hydrate(new FakeStore());

    expect(db.teams.length).toBe(baselineTeams);
    expect(db.matches.length).toBeGreaterThan(0);
  });
});

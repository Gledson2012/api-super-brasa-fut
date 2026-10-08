import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { webhookService } from '../../src/services/webhook.service.js';
import { webhookConfig } from '../../src/config/environment.js';

describe('Webhook delivery SSRF protection on HTTP redirects', () => {
  beforeEach(() => {
    delete process.env.WEBHOOK_ALLOW_PRIVATE_HOSTS;
    webhookService.clear();
  });

  afterEach(() => {
    delete process.env.WEBHOOK_ALLOW_PRIVATE_HOSTS;
    vi.unstubAllGlobals();
    webhookService.clear();
  });

  it('rejects a redirect to a blocked internal address (metadata/private IP) without contacting it', async () => {
    const mockFetch = vi.fn(async (url: string) => {
      return new Response(null, {
        status: 302,
        headers: { location: 'http://169.254.169.254/latest/meta-data/' },
      });
    });
    vi.stubGlobal('fetch', mockFetch);

    // URL pública válida no registro; o destaque malicioso só aparece no redirect.
    webhookService.subscribe({ url: 'http://1.1.1.1/hook', events: ['GOAL'] });

    await webhookService.notify('GOAL', { matchId: 'match-redirect-1' });

    const deliveries = webhookService.getDeliveries('anonymous');
    expect(deliveries).toHaveLength(1);
    expect(deliveries[0].success).toBe(false);
    expect(deliveries[0].error).toContain('privado');

    // O destino interno nunca foi contatado: apenas a URL inicial foi buscada.
    const calledUrls = mockFetch.mock.calls.map((call) => call[0]);
    expect(calledUrls.every((url) => !url.includes('169.254'))).toBe(true);
  });

  it('follows a safe redirect chain (private hosts allowed in tests) and succeeds', async () => {
    process.env.WEBHOOK_ALLOW_PRIVATE_HOSTS = 'true';

    const mockFetch = vi.fn(async (url: string) => {
      if (url === 'http://127.0.0.1:1234/hook') {
        return new Response(null, {
          status: 302,
          headers: { location: 'http://127.0.0.1:1235/final' },
        });
      }
      return new Response('{"ok":true}', { status: 200, headers: { 'Content-Type': 'application/json' } });
    });
    vi.stubGlobal('fetch', mockFetch);

    webhookService.subscribe({ url: 'http://127.0.0.1:1234/hook', events: ['GOAL'] });

    await webhookService.notify('GOAL', { matchId: 'match-redirect-2' });

    const deliveries = webhookService.getDeliveries('anonymous');
    expect(deliveries).toHaveLength(1);
    expect(deliveries[0].success).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch.mock.calls[1][0]).toBe('http://127.0.0.1:1235/final');
  });

  it('stops after the maximum number of redirect hops and marks the delivery as failed', async () => {
    process.env.WEBHOOK_ALLOW_PRIVATE_HOSTS = 'true';

    const loopUrl = 'http://127.0.0.1:9999/loop';
    const mockFetch = vi.fn(async () => {
      return new Response(null, { status: 302, headers: { location: loopUrl } });
    });
    vi.stubGlobal('fetch', mockFetch);

    webhookService.subscribe({ url: loopUrl, events: ['GOAL'] });

    await webhookService.notify('GOAL', { matchId: 'match-redirect-3' });

    const deliveries = webhookService.getDeliveries('anonymous');
    expect(deliveries[0].success).toBe(false);

    // 5 hops + a requisição inicial por tentativa (o redirect infinito é cortado).
    const hopsPerAttempt = 6;
    expect(mockFetch.mock.calls.length).toBe(webhookConfig.maxRetries * hopsPerAttempt);
  });
});
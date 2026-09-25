import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { webhookService } from '../../src/services/webhook.service.js';
import { verifyWebhookSignature } from '../../src/utils/webhook-security.js';

interface Delivery {
  headers: http.IncomingHttpHeaders;
  body: string;
}

let receiver: http.Server;
let port = 0;
let deliveries: Delivery[] = [];

async function waitForDelivery(timeoutMs = 3000): Promise<Delivery> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (deliveries.length > 0) return deliveries[0];
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  throw new Error('Nenhuma entrega de webhook recebida dentro do timeout.');
}

describe('Webhook delivery (end-to-end)', () => {
  beforeAll(async () => {
    // Habilita hosts locais apenas para este teste.
    process.env.WEBHOOK_ALLOW_PRIVATE_HOSTS = 'true';

    receiver = http.createServer((req, res) => {
      let body = '';
      req.on('data', (chunk) => (body += chunk));
      req.on('end', () => {
        deliveries.push({ headers: req.headers, body });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end('{"ok":true}');
      });
    });

    await new Promise<void>((resolve) => receiver.listen(0, '127.0.0.1', resolve));
    port = (receiver.address() as AddressInfo).port;
  });

  afterAll(async () => {
    delete process.env.WEBHOOK_ALLOW_PRIVATE_HOSTS;
    await new Promise<void>((resolve) => receiver.close(() => resolve()));
  });

  beforeEach(() => {
    deliveries = [];
    webhookService.clear();
  });

  it('delivers a GOAL event signed with HMAC-SHA256, verifiable with the subscriber secret', async () => {
    const secret = 'segredo-e2e';
    webhookService.subscribe({ url: `http://127.0.0.1:${port}/hook`, events: ['GOAL'], secret });

    await webhookService.notify('GOAL', { matchId: 'match-1', minute: 78 });
    const delivery = await waitForDelivery();

    const timestamp = delivery.headers['x-superbrasa-timestamp'] as string;
    const signature = delivery.headers['x-superbrasa-signature'] as string;

    expect(delivery.headers['x-superbrasa-event']).toBe('GOAL');
    expect(timestamp).toBeTruthy();
    expect(signature).toMatch(/^[a-f0-9]{64}$/);
    expect(verifyWebhookSignature(secret, delivery.body, timestamp, signature)).toBe(true);

    const parsed = JSON.parse(delivery.body);
    expect(parsed.event).toBe('GOAL');
    expect(parsed.data.matchId).toBe('match-1');
    expect(parsed.timestamp).toBe(timestamp);
  });

  it('does not send a signature header when the subscriber has no secret', async () => {
    webhookService.subscribe({ url: `http://127.0.0.1:${port}/hook`, events: ['MATCH_EVENT'] });

    await webhookService.notify('MATCH_EVENT', { matchId: 'match-2' });
    const delivery = await waitForDelivery();

    expect(delivery.headers['x-superbrasa-event']).toBe('MATCH_EVENT');
    expect(delivery.headers['x-superbrasa-signature']).toBeUndefined();
  });

  it('ignores subscribers that do not match the event type', async () => {
    webhookService.subscribe({ url: `http://127.0.0.1:${port}/hook`, events: ['GOAL'], secret: 'x' });

    await webhookService.notify('MATCH_STATUS_CHANGE', { matchId: 'match-3' });
    await new Promise((resolve) => setTimeout(resolve, 200));

    expect(deliveries).toHaveLength(0);
  });
});

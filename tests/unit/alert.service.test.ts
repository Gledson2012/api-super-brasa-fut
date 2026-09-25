import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { alertService } from '../../src/services/alert.service.js';
import type { PersistenceHealth } from '../../src/services/health.service.js';

interface ReceivedAlert {
  headers: http.IncomingHttpHeaders;
  body: any;
}

let receiver: http.Server;
let port = 0;
let received: ReceivedAlert[] = [];

const healthy: PersistenceHealth = { backend: 'upstash', ok: true, latencyMs: 12 };
const degraded: PersistenceHealth = { backend: 'upstash', ok: false, latencyMs: 5000, error: 'fetch failed' };

async function waitForCount(expected: number, timeoutMs = 2000): Promise<void> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (received.length >= expected) return;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  throw new Error(`Esperava ${expected} alerta(s), recebeu ${received.length}.`);
}

function alertUrl(): string {
  return `http://127.0.0.1:${port}/alerts`;
}

describe('AlertService', () => {
  beforeAll(async () => {
    receiver = http.createServer((req, res) => {
      let body = '';
      req.on('data', (chunk) => (body += chunk));
      req.on('end', () => {
        received.push({ headers: req.headers, body: JSON.parse(body || '{}') });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end('{"ok":true}');
      });
    });

    await new Promise<void>((resolve) => receiver.listen(0, '127.0.0.1', resolve));
    port = (receiver.address() as AddressInfo).port;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => receiver.close(() => resolve()));
  });

  beforeEach(() => {
    received = [];
    alertService.reset();
    delete process.env.ALERT_WEBHOOK_URL;
    delete process.env.ALERT_COOLDOWN_MS;
  });

  afterEach(() => {
    delete process.env.ALERT_WEBHOOK_URL;
    delete process.env.ALERT_COOLDOWN_MS;
  });

  it('does nothing when no alert webhook is configured', async () => {
    expect(alertService.enabled).toBe(false);
    expect(await alertService.reportReadiness(degraded)).toBeNull();
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(received).toHaveLength(0);
  });

  it('sends a degraded alert and throttles repeats within the cooldown', async () => {
    process.env.ALERT_WEBHOOK_URL = alertUrl();

    expect(await alertService.reportReadiness(degraded)).toBe('degraded');
    await waitForCount(1);

    expect(received[0].body.status).toBe('degraded');
    expect(received[0].body.backend).toBe('upstash');
    expect(received[0].body.text).toContain('DEGRADADO');

    // Segunda falha dentro do cooldown padrão (5 min) não reenvia.
    expect(await alertService.reportReadiness(degraded)).toBeNull();
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(received).toHaveLength(1);
  });

  it('sends a recovered alert after a failure', async () => {
    process.env.ALERT_WEBHOOK_URL = alertUrl();

    expect(await alertService.reportReadiness(degraded)).toBe('degraded');
    await waitForCount(1);

    expect(await alertService.reportReadiness(healthy)).toBe('recovered');
    await waitForCount(2);

    expect(received[1].body.status).toBe('recovered');
    expect(received[1].body.text).toContain('RECUPERADO');

    // Estado saudável sem falha prévia não gera novo alerta.
    expect(await alertService.reportReadiness(healthy)).toBeNull();
  });

  it('allows repeated alerts when the cooldown is zero', async () => {
    process.env.ALERT_WEBHOOK_URL = alertUrl();
    process.env.ALERT_COOLDOWN_MS = '0';

    expect(await alertService.reportReadiness(degraded)).toBe('degraded');
    expect(await alertService.reportReadiness(degraded)).toBe('degraded');
    await waitForCount(2);
    expect(received).toHaveLength(2);
  });
});

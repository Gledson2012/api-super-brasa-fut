import { describe, it, expect } from 'vitest';
import {
  assertSafeWebhookUrl,
  isPrivateIp,
  signWebhookPayload,
  verifyWebhookSignature,
} from '../../src/utils/webhook-security.js';
import { BadRequestError } from '../../src/utils/errors.js';

describe('webhook-security: SSRF guard', () => {
  it('accepts public http/https URLs', () => {
    expect(assertSafeWebhookUrl('https://example.com/hook').hostname).toBe('example.com');
    expect(assertSafeWebhookUrl('http://webhook.site/abc').protocol).toBe('http:');
  });

  it('rejects non-http(s) protocols and invalid URLs', () => {
    expect(() => assertSafeWebhookUrl('ftp://example.com')).toThrow(BadRequestError);
    expect(() => assertSafeWebhookUrl('url-invalida-sem-protocolo')).toThrow(BadRequestError);
    expect(() => assertSafeWebhookUrl('')).toThrow(BadRequestError);
  });

  it('rejects internal hosts and private IPs', () => {
    expect(() => assertSafeWebhookUrl('http://localhost:3000/hook')).toThrow(BadRequestError);
    expect(() => assertSafeWebhookUrl('http://127.0.0.1/hook')).toThrow(BadRequestError);
    expect(() => assertSafeWebhookUrl('http://169.254.169.254/latest/meta-data')).toThrow(BadRequestError);
    expect(() => assertSafeWebhookUrl('http://10.0.0.5/hook')).toThrow(BadRequestError);
    expect(() => assertSafeWebhookUrl('http://192.168.1.10/hook')).toThrow(BadRequestError);
    expect(() => assertSafeWebhookUrl('http://service.internal/hook')).toThrow(BadRequestError);
  });

  it('classifies private and public IPs', () => {
    expect(isPrivateIp('10.1.2.3')).toBe(true);
    expect(isPrivateIp('172.16.0.1')).toBe(true);
    expect(isPrivateIp('172.32.0.1')).toBe(false);
    expect(isPrivateIp('::1')).toBe(true);
    expect(isPrivateIp('8.8.8.8')).toBe(false);
  });
});

describe('webhook-security: HMAC signing', () => {
  it('signs deterministically and verifies the signature', () => {
    const body = JSON.stringify({ event: 'GOAL', data: { matchId: 'x' } });
    const ts = '2026-09-25T12:00:00.000Z';
    const sig = signWebhookPayload('segredo', body, ts);

    expect(sig).toMatch(/^[a-f0-9]{64}$/);
    expect(verifyWebhookSignature('segredo', body, ts, sig)).toBe(true);
    expect(verifyWebhookSignature('outro-segredo', body, ts, sig)).toBe(false);
    expect(verifyWebhookSignature('segredo', body, '2026-09-25T12:00:01.000Z', sig)).toBe(false);
    expect(verifyWebhookSignature('segredo', body, ts, 'assinatura-curta')).toBe(false);
  });
});

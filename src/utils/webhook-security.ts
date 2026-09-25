import { createHmac, timingSafeEqual } from 'node:crypto';
import { lookup } from 'node:dns/promises';
import net from 'node:net';
import { BadRequestError } from './errors.js';

const BLOCKED_HOSTNAMES = new Set(['localhost', 'metadata', 'metadata.google.internal']);

/**
 * Permite hosts privados/loopback apenas quando explicitamente habilitado.
 * Útil para desenvolvimento e testes locais de webhooks; nunca deve ser ativado
 * em produção. Lido em tempo de execução para facilitar a configuração.
 */
export function privateHostsAllowed(): boolean {
  return process.env.WEBHOOK_ALLOW_PRIVATE_HOSTS === 'true';
}

/** Retorna true para endereços de loopback, privados, link-local e de metadata. */
export function isPrivateIp(ip: string): boolean {
  const normalized = ip.trim().toLowerCase();

  if (net.isIPv4(normalized)) {
    const [a, b] = normalized.split('.').map(Number);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) || // CGNAT
      (a === 169 && b === 254) || // link-local / metadata
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168)
    );
  }

  if (net.isIPv6(normalized)) {
    if (normalized === '::' || normalized === '::1') return true;
    if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true; // ULA
    if (normalized.startsWith('fe80')) return true; // link-local
    if (normalized.startsWith('::ffff:')) return isPrivateIp(normalized.slice('::ffff:'.length));
    return false;
  }

  return false;
}

/**
 * Valida de forma síncrona a URL informada para webhooks: exige http(s) e bloqueia
 * hosts internos óbvios (literalmente IPs privados, localhost, .local/.internal).
 */
export function assertSafeWebhookUrl(rawUrl: unknown): URL {
  if (typeof rawUrl !== 'string' || rawUrl.trim().length === 0) {
    throw new BadRequestError('URL do webhook é obrigatória e deve iniciar com http:// ou https://');
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new BadRequestError('URL do webhook inválida. Informe uma URL http:// ou https:// válida.');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new BadRequestError('A URL do webhook deve usar o protocolo http:// ou https://');
  }

  if (privateHostsAllowed()) {
    return parsed;
  }

  const host = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, '');

  if (BLOCKED_HOSTNAMES.has(host) || host.endsWith('.local') || host.endsWith('.internal')) {
    throw new BadRequestError('A URL do webhook aponta para um host interno não permitido.');
  }

  if (net.isIP(host) && isPrivateIp(host)) {
    throw new BadRequestError('A URL do webhook aponta para um endereço IP privado ou reservado.');
  }

  return parsed;
}

/**
 * Resolve o DNS e garante que o host aponta apenas para endereços públicos.
 * Deve ser chamado imediatamente antes de realizar a requisição (proteção
 * contra DNS rebinding). Falhas de DNS são ignoradas para não bloquear o
 * disparo — o próprio fetch falhará naturalmente.
 */
export async function assertResolvesToPublicHost(rawUrl: string): Promise<void> {
  if (privateHostsAllowed()) {
    return;
  }

  const host = new URL(rawUrl).hostname.toLowerCase().replace(/^\[|\]$/g, '');

  if (net.isIP(host)) {
    return; // já validado literalmente por assertSafeWebhookUrl
  }

  try {
    const records = await lookup(host, { all: true });
    for (const record of records) {
      if (isPrivateIp(record.address)) {
        throw new BadRequestError('A URL do webhook resolve para um endereço interno não permitido.');
      }
    }
  } catch (error) {
    if (error instanceof BadRequestError) throw error;
    // Falha de resolução: deixa o fetch lidar com o erro.
  }
}

/** Assinatura HMAC-SHA256 (hex) de `timestamp.body` com o segredo do assinante. */
export function signWebhookPayload(secret: string, body: string, timestamp: string): string {
  return createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex');
}

/** Comparação em tempo constante de assinaturas hexadecimais. */
export function verifyWebhookSignature(secret: string, body: string, timestamp: string, signature: string): boolean {
  const expected = signWebhookPayload(secret, body, timestamp);
  const expectedBuffer = Buffer.from(expected, 'utf8');
  const providedBuffer = Buffer.from(signature || '', 'utf8');

  if (expectedBuffer.length !== providedBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, providedBuffer);
}

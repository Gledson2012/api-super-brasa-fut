import { withTimeout } from '../utils/with-timeout.js';
import type { PersistenceHealth } from './health.service.js';

export type ReadinessAlertKind = 'degraded' | 'recovered';

/**
 * Dispara alertas para um webhook configurado (Slack, Discord, UptimeRobot,
 * PagerDuty ou qualquer endpoint) quando a prontidão degrada ou se recupera.
 * A URL e o cooldown são lidos em tempo de execução para facilitar testes.
 */
export class AlertService {
  private lastAlertAt = 0;
  private wasDown = false;

  public get enabled(): boolean {
    return this.webhookUrl().length > 0;
  }

  private webhookUrl(): string {
    return process.env.ALERT_WEBHOOK_URL?.trim() || '';
  }

  private cooldownMs(): number {
    const parsed = parseInt(process.env.ALERT_COOLDOWN_MS || '', 10);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 300_000;
  }

  /** Reseta o estado interno (usado em testes). */
  public reset(): void {
    this.lastAlertAt = 0;
    this.wasDown = false;
  }

  /**
   * Reporta o resultado de um probe. Envia alerta de `degraded` (respeitando o
   * cooldown) na primeira falha da janela e `recovered` ao voltar a ficar ok.
   * Retorna o tipo de alerta enviado, ou null se nada foi disparado.
   */
  public async reportReadiness(health: PersistenceHealth): Promise<ReadinessAlertKind | null> {
    if (!this.enabled) return null;

    if (health.ok) {
      if (!this.wasDown) return null;
      this.wasDown = false;
      await this.send('recovered', health);
      return 'recovered';
    }

    this.wasDown = true;
    const now = Date.now();
    if (now - this.lastAlertAt < this.cooldownMs()) return null;
    this.lastAlertAt = now;
    await this.send('degraded', health);
    return 'degraded';
  }

  private async send(kind: ReadinessAlertKind, health: PersistenceHealth): Promise<void> {
    const isDegraded = kind === 'degraded';
    const summary = isDegraded
      ? `🔴 Super Brasa Fut DEGRADADO — persistência (${health.backend}) indisponível`
      : `🟢 Super Brasa Fut RECUPERADO — persistência (${health.backend}) operacional`;

    const payload = {
      // Campos amigáveis para Slack (`text`) e Discord (`content`).
      text: `${summary}${health.error ? `: ${health.error}` : ''}`,
      content: `${summary}${health.error ? `: ${health.error}` : ''}`,
      status: kind,
      service: 'api-super-brasa-fut',
      backend: health.backend,
      latencyMs: health.latencyMs,
      ...(health.error && { error: health.error }),
      timestamp: new Date().toISOString(),
    };

    try {
      const response = await fetch(this.webhookUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) {
        console.error(`Alerta de prontidão (${kind}) rejeitado pelo webhook: HTTP ${response.status}`);
      }
    } catch (err) {
      console.error(`Falha ao enviar alerta de prontidão (${kind}):`, err);
    }
  }
}

export const alertService = new AlertService();

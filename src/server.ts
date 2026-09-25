import { app } from './app.js';
import { config, warnIfDefaultApiKeysInUse } from './config/environment.js';
import { db } from './repositories/db.js';
import { webhookService } from './services/webhook.service.js';
import { checkPersistenceHealth } from './services/health.service.js';
import { alertService } from './services/alert.service.js';

/** Self-check periódico de prontidão (opcional; desativado por padrão). */
function startReadinessSelfCheck(): void {
  const intervalMs = parseInt(process.env.ALERT_CHECK_INTERVAL_MS || '', 10);
  if (!Number.isFinite(intervalMs) || intervalMs <= 0) return;

  const timer = setInterval(() => {
    checkPersistenceHealth()
      .then((health) => alertService.reportReadiness(health))
      .catch(() => undefined);
  }, intervalMs);
  timer.unref?.();
}

async function bootstrap(): Promise<void> {
  // Restaura estado persistido externamente (quando configurado).
  await db.hydrate();
  await webhookService.hydrate();

  warnIfDefaultApiKeysInUse();

  startReadinessSelfCheck();

  const server = app.listen(config.port, config.host, () => {
    console.log(`\n======================================================`);
    console.log(`⚽ ${config.appName} v${config.appVersion}`);
    console.log(`🚀 Servidor rodando em: http://${config.host}:${config.port}`);
    console.log(`📚 Documentação Swagger UI: http://${config.host}:${config.port}/docs`);
    console.log(`🔗 API Base: http://${config.host}:${config.port}${config.apiPrefix}`);
    console.log(`======================================================\n`);
  });

  process.on('SIGTERM', () => {
    console.log('SIGTERM recebido. Encerrando servidor graciosamente...');
    server.close(() => {
      console.log('Servidor finalizado.');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('SIGINT recebido. Encerrando servidor...');
    server.close(() => {
      console.log('Servidor finalizado.');
      process.exit(0);
    });
  });
}

bootstrap().catch((err) => {
  console.error('Falha ao inicializar o servidor:', err);
  process.exit(1);
});

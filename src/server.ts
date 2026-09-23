import { app } from './app.js';
import { config } from './config/environment.js';

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

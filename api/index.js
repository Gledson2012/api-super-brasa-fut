import { app } from '../dist/app.js';
import { db } from '../dist/repositories/db.js';
import { webhookService } from '../dist/services/webhook.service.js';
import { warnIfDefaultApiKeysInUse } from '../dist/config/environment.js';

// Em ambientes serverless cada cold start precisa restaurar o estado externo
// (webhooks e partidas simuladas) antes de atender requisições.
await db.hydrate();
await webhookService.hydrate();

warnIfDefaultApiKeysInUse();

export default app;

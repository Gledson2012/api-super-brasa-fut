import { Router } from 'express';
import { webhookController } from '../controllers/webhook.controller.js';
import { validateBody, validateParams } from '../middlewares/validate.middleware.js';
import { requireTier } from '../middlewares/auth.middleware.js';
import { createWebhookBodySchema, idParamSchema } from '../schemas/api.schemas.js';

export const webhookRoutes = Router();

// Webhooks são um recurso exclusivo dos planos Pro/Enterprise
webhookRoutes.use(requireTier('pro'));

// Entregas e retentativas (rotas estáticas antes de /:id)
webhookRoutes.get('/deliveries', webhookController.listDeliveries);
webhookRoutes.post('/deliveries/:id/redeliver', validateParams(idParamSchema), webhookController.redeliver);

webhookRoutes.post('/', validateBody(createWebhookBodySchema), webhookController.subscribe);
webhookRoutes.get('/', webhookController.list);
webhookRoutes.get('/:id', validateParams(idParamSchema), webhookController.getById);
webhookRoutes.get('/:id/deliveries', validateParams(idParamSchema), webhookController.getDeliveriesByWebhookId);
webhookRoutes.delete('/:id', validateParams(idParamSchema), webhookController.unsubscribe);

import { Router } from 'express';
import { webhookController } from '../controllers/webhook.controller.js';
import { validateBody, validateParams } from '../middlewares/validate.middleware.js';
import { requireTier } from '../middlewares/auth.middleware.js';
import { createWebhookBodySchema, idParamSchema } from '../schemas/api.schemas.js';

export const webhookRoutes = Router();

// Webhooks são um recurso exclusivo dos planos Pro/Enterprise
webhookRoutes.use(requireTier('pro'));

webhookRoutes.post('/', validateBody(createWebhookBodySchema), webhookController.subscribe);
webhookRoutes.get('/', webhookController.list);
webhookRoutes.get('/:id', validateParams(idParamSchema), webhookController.getById);
webhookRoutes.delete('/:id', validateParams(idParamSchema), webhookController.unsubscribe);

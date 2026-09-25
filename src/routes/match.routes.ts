import { Router } from 'express';
import { matchController } from '../controllers/match.controller.js';
import { oddsController } from '../controllers/odds.controller.js';
import { cacheControl } from '../middlewares/cache.middleware.js';
import { requireTier } from '../middlewares/auth.middleware.js';
import { validateBody, validateParams, validateQuery } from '../middlewares/validate.middleware.js';
import { idParamSchema, matchFilterQuerySchema, h2hQuerySchema, simulateEventBodySchema } from '../schemas/api.schemas.js';

export const matchRoutes = Router();

matchRoutes.get('/', cacheControl(15, 30), validateQuery(matchFilterQuerySchema), matchController.getAll);
matchRoutes.get('/live', matchController.getLive);
matchRoutes.get('/live/stream', matchController.streamLive);
matchRoutes.get('/h2h', cacheControl(60, 120), validateQuery(h2hQuerySchema), matchController.getHeadToHead);
matchRoutes.post('/reset', requireTier('pro'), matchController.resetMatches);
matchRoutes.get('/:id', cacheControl(15, 30), validateParams(idParamSchema), matchController.getById);
matchRoutes.get('/:id/odds', cacheControl(30, 60), validateParams(idParamSchema), oddsController.getByMatchId);
matchRoutes.post('/:id/simulate-tick', requireTier('pro'), validateParams(idParamSchema), matchController.simulateTick);
matchRoutes.post(
  '/:id/simulate-event',
  requireTier('pro'),
  validateParams(idParamSchema),
  validateBody(simulateEventBodySchema),
  matchController.simulateEvent
);

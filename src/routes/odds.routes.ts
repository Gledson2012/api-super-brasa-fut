import { Router } from 'express';
import { oddsController } from '../controllers/odds.controller.js';
import { cacheControl } from '../middlewares/cache.middleware.js';
import { validateParams, validateQuery } from '../middlewares/validate.middleware.js';
import { matchIdParamSchema, oddsFilterQuerySchema } from '../schemas/api.schemas.js';

export const oddsRoutes = Router();

oddsRoutes.get('/', cacheControl(30, 60), validateQuery(oddsFilterQuerySchema), oddsController.getAll);
oddsRoutes.get('/:matchId', cacheControl(30, 60), validateParams(matchIdParamSchema), oddsController.getByMatchId);

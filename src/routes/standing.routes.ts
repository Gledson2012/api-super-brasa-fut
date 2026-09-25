import { Router } from 'express';
import { standingController } from '../controllers/standing.controller.js';
import { cacheControl } from '../middlewares/cache.middleware.js';
import { validateParams } from '../middlewares/validate.middleware.js';
import { leagueIdParamSchema } from '../schemas/api.schemas.js';

export const standingRoutes = Router();

standingRoutes.get('/', cacheControl(30, 60), standingController.getAll);
// Precisa vir antes de '/:leagueId' para não ser capturada como id de liga.
standingRoutes.get('/validate', standingController.validate);
standingRoutes.get('/:leagueId', cacheControl(30, 60), validateParams(leagueIdParamSchema), standingController.getByLeagueId);

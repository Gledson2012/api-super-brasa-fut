import { Router } from 'express';
import { teamController } from '../controllers/team.controller.js';
import { cacheControl } from '../middlewares/cache.middleware.js';
import { validateParams, validateQuery } from '../middlewares/validate.middleware.js';
import { idParamSchema, teamFilterQuerySchema } from '../schemas/api.schemas.js';

export const teamRoutes = Router();

teamRoutes.get('/', cacheControl(60, 120), validateQuery(teamFilterQuerySchema), teamController.getAll);
teamRoutes.get('/:id', cacheControl(60, 120), validateParams(idParamSchema), teamController.getById);
teamRoutes.get('/:id/calendar', cacheControl(30, 60), validateParams(idParamSchema), teamController.getCalendar);
teamRoutes.get('/:id/matches', cacheControl(30, 60), validateParams(idParamSchema), teamController.getMatches);
teamRoutes.get('/:id/squad', cacheControl(60, 120), validateParams(idParamSchema), teamController.getSquad);
teamRoutes.get('/:id/players', cacheControl(60, 120), validateParams(idParamSchema), teamController.getSquad);

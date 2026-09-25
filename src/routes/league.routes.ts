import { Router } from 'express';
import { leagueController } from '../controllers/league.controller.js';
import { cacheControl } from '../middlewares/cache.middleware.js';
import { validateParams, validateQuery } from '../middlewares/validate.middleware.js';
import { idParamSchema, leagueFilterQuerySchema } from '../schemas/api.schemas.js';

export const leagueRoutes = Router();

leagueRoutes.get('/', cacheControl(60, 120), validateQuery(leagueFilterQuerySchema), leagueController.getAll);
leagueRoutes.get('/:id', cacheControl(60, 120), validateParams(idParamSchema), leagueController.getById);
leagueRoutes.get('/:id/standings', cacheControl(30, 60), validateParams(idParamSchema), leagueController.getStandings);
leagueRoutes.get('/:id/matches', cacheControl(30, 60), validateParams(idParamSchema), leagueController.getMatches);
leagueRoutes.get('/:id/teams', cacheControl(60, 120), validateParams(idParamSchema), leagueController.getTeams);
leagueRoutes.get('/:id/leaders', cacheControl(30, 60), validateParams(idParamSchema), leagueController.getLeaders);

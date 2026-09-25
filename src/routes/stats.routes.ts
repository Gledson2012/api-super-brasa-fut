import { Router } from 'express';
import { statsController } from '../controllers/stats.controller.js';
import { cacheControl } from '../middlewares/cache.middleware.js';
import { validateParams } from '../middlewares/validate.middleware.js';
import { leagueIdParamSchema } from '../schemas/api.schemas.js';

export const statsRoutes = Router();

statsRoutes.get('/leaders', cacheControl(60, 120), statsController.getAllLeaders);
statsRoutes.get('/leaders/:leagueId', cacheControl(60, 120), validateParams(leagueIdParamSchema), statsController.getLeagueLeaders);
statsRoutes.get('/top-scorers/:leagueId', cacheControl(60, 120), validateParams(leagueIdParamSchema), statsController.getTopScorers);
statsRoutes.get('/top-assists/:leagueId', cacheControl(60, 120), validateParams(leagueIdParamSchema), statsController.getTopAssists);
statsRoutes.get('/top-ratings/:leagueId', cacheControl(60, 120), validateParams(leagueIdParamSchema), statsController.getTopRatings);

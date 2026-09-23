import { Router } from 'express';
import { statsController } from '../controllers/stats.controller.js';
import { cacheControl } from '../middlewares/cache.middleware.js';

export const statsRoutes = Router();

statsRoutes.get('/leaders', cacheControl(60, 120), (req, res, next) => statsController.getAllLeaders(req, res, next));
statsRoutes.get('/leaders/:leagueId', cacheControl(60, 120), (req, res, next) => statsController.getLeagueLeaders(req, res, next));
statsRoutes.get('/top-scorers/:leagueId', cacheControl(60, 120), (req, res, next) => statsController.getTopScorers(req, res, next));
statsRoutes.get('/top-assists/:leagueId', cacheControl(60, 120), (req, res, next) => statsController.getTopAssists(req, res, next));
statsRoutes.get('/top-ratings/:leagueId', cacheControl(60, 120), (req, res, next) => statsController.getTopRatings(req, res, next));


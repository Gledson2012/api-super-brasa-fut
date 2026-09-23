import { Router } from 'express';
import { leagueController } from '../controllers/league.controller.js';
import { cacheControl } from '../middlewares/cache.middleware.js';

export const leagueRoutes = Router();

leagueRoutes.get('/', cacheControl(60, 120), (req, res, next) => leagueController.getAll(req, res, next));
leagueRoutes.get('/:id', cacheControl(60, 120), (req, res, next) => leagueController.getById(req, res, next));
leagueRoutes.get('/:id/standings', cacheControl(30, 60), (req, res, next) => leagueController.getStandings(req, res, next));
leagueRoutes.get('/:id/matches', cacheControl(30, 60), (req, res, next) => leagueController.getMatches(req, res, next));
leagueRoutes.get('/:id/teams', cacheControl(60, 120), (req, res, next) => leagueController.getTeams(req, res, next));
leagueRoutes.get('/:id/leaders', cacheControl(30, 60), (req, res, next) => leagueController.getLeaders(req, res, next));


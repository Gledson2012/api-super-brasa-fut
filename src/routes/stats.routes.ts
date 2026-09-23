import { Router } from 'express';
import { statsController } from '../controllers/stats.controller.js';

export const statsRoutes = Router();

statsRoutes.get('/leaders', (req, res, next) => statsController.getAllLeaders(req, res, next));
statsRoutes.get('/leaders/:leagueId', (req, res, next) => statsController.getLeagueLeaders(req, res, next));
statsRoutes.get('/top-scorers/:leagueId', (req, res, next) => statsController.getTopScorers(req, res, next));
statsRoutes.get('/top-assists/:leagueId', (req, res, next) => statsController.getTopAssists(req, res, next));
statsRoutes.get('/top-ratings/:leagueId', (req, res, next) => statsController.getTopRatings(req, res, next));

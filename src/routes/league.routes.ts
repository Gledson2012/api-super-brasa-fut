import { Router } from 'express';
import { leagueController } from '../controllers/league.controller.js';

export const leagueRoutes = Router();

leagueRoutes.get('/', (req, res, next) => leagueController.getAll(req, res, next));
leagueRoutes.get('/:id', (req, res, next) => leagueController.getById(req, res, next));
leagueRoutes.get('/:id/standings', (req, res, next) => leagueController.getStandings(req, res, next));
leagueRoutes.get('/:id/matches', (req, res, next) => leagueController.getMatches(req, res, next));
leagueRoutes.get('/:id/teams', (req, res, next) => leagueController.getTeams(req, res, next));
leagueRoutes.get('/:id/leaders', (req, res, next) => leagueController.getLeaders(req, res, next));

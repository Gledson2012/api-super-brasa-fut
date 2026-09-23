import { Router } from 'express';
import { standingController } from '../controllers/standing.controller.js';

export const standingRoutes = Router();

standingRoutes.get('/', (req, res, next) => standingController.getAll(req, res, next));
standingRoutes.get('/:leagueId', (req, res, next) => standingController.getByLeagueId(req, res, next));

import { Router } from 'express';
import { standingController } from '../controllers/standing.controller.js';
import { cacheControl } from '../middlewares/cache.middleware.js';

export const standingRoutes = Router();

standingRoutes.get('/', cacheControl(30, 60), (req, res, next) => standingController.getAll(req, res, next));
standingRoutes.get('/:leagueId', cacheControl(30, 60), (req, res, next) => standingController.getByLeagueId(req, res, next));


import { Router } from 'express';
import { oddsController } from '../controllers/odds.controller.js';
import { cacheControl } from '../middlewares/cache.middleware.js';

export const oddsRoutes = Router();

oddsRoutes.get('/', cacheControl(30, 60), (req, res, next) => oddsController.getAll(req, res, next));
oddsRoutes.get('/:matchId', cacheControl(30, 60), (req, res, next) => oddsController.getByMatchId(req, res, next));


import { Router } from 'express';
import { matchController } from '../controllers/match.controller.js';
import { oddsController } from '../controllers/odds.controller.js';
import { cacheControl } from '../middlewares/cache.middleware.js';

export const matchRoutes = Router();

matchRoutes.get('/', cacheControl(15, 30), (req, res, next) => matchController.getAll(req, res, next));
matchRoutes.get('/live', (req, res, next) => matchController.getLive(req, res, next));
matchRoutes.get('/live/stream', (req, res) => matchController.streamLive(req, res));
matchRoutes.get('/h2h', cacheControl(60, 120), (req, res, next) => matchController.getHeadToHead(req, res, next));
matchRoutes.get('/:id', cacheControl(15, 30), (req, res, next) => matchController.getById(req, res, next));
matchRoutes.get('/:id/odds', cacheControl(30, 60), (req, res, next) => oddsController.getByMatchId(req, res, next));
matchRoutes.post('/:id/simulate-tick', (req, res, next) => matchController.simulateTick(req, res, next));



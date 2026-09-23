import { Router } from 'express';
import { matchController } from '../controllers/match.controller.js';
import { oddsController } from '../controllers/odds.controller.js';

export const matchRoutes = Router();

matchRoutes.get('/', (req, res, next) => matchController.getAll(req, res, next));
matchRoutes.get('/live', (req, res, next) => matchController.getLive(req, res, next));
matchRoutes.get('/h2h', (req, res, next) => matchController.getHeadToHead(req, res, next));
matchRoutes.get('/:id', (req, res, next) => matchController.getById(req, res, next));
matchRoutes.get('/:id/odds', (req, res, next) => oddsController.getByMatchId(req, res, next));
matchRoutes.post('/:id/simulate-tick', (req, res, next) => matchController.simulateTick(req, res, next));


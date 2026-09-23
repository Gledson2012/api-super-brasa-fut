import { Router } from 'express';
import { oddsController } from '../controllers/odds.controller.js';

export const oddsRoutes = Router();

oddsRoutes.get('/', (req, res, next) => oddsController.getAll(req, res, next));
oddsRoutes.get('/:matchId', (req, res, next) => oddsController.getByMatchId(req, res, next));

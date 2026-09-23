import { Router } from 'express';
import { playerController } from '../controllers/player.controller.js';
import { cacheControl } from '../middlewares/cache.middleware.js';

export const playerRoutes = Router();

playerRoutes.get('/', cacheControl(60, 120), (req, res, next) => playerController.getAll(req, res, next));
playerRoutes.get('/compare', cacheControl(60, 120), (req, res, next) => playerController.compare(req, res, next));
playerRoutes.get('/:id', cacheControl(60, 120), (req, res, next) => playerController.getById(req, res, next));


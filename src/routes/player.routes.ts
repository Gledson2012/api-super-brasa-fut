import { Router } from 'express';
import { playerController } from '../controllers/player.controller.js';

export const playerRoutes = Router();

playerRoutes.get('/', (req, res, next) => playerController.getAll(req, res, next));
playerRoutes.get('/:id', (req, res, next) => playerController.getById(req, res, next));

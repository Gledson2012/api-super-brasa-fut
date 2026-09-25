import { Router } from 'express';
import { playerController } from '../controllers/player.controller.js';
import { cacheControl } from '../middlewares/cache.middleware.js';
import { validateParams, validateQuery } from '../middlewares/validate.middleware.js';
import { idParamSchema, playerFilterQuerySchema } from '../schemas/api.schemas.js';

export const playerRoutes = Router();

playerRoutes.get('/', cacheControl(60, 120), validateQuery(playerFilterQuerySchema), playerController.getAll);
playerRoutes.get('/compare', cacheControl(60, 120), playerController.compare);
playerRoutes.get('/:id', cacheControl(60, 120), validateParams(idParamSchema), playerController.getById);

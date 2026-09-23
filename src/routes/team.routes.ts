import { Router } from 'express';
import { teamController } from '../controllers/team.controller.js';
import { cacheControl } from '../middlewares/cache.middleware.js';

export const teamRoutes = Router();

teamRoutes.get('/', cacheControl(60, 120), (req, res, next) => teamController.getAll(req, res, next));
teamRoutes.get('/:id', cacheControl(60, 120), (req, res, next) => teamController.getById(req, res, next));
teamRoutes.get('/:id/calendar', cacheControl(30, 60), (req, res, next) => teamController.getCalendar(req, res, next));
teamRoutes.get('/:id/matches', cacheControl(30, 60), (req, res, next) => teamController.getMatches(req, res, next));
teamRoutes.get('/:id/squad', cacheControl(60, 120), (req, res, next) => teamController.getSquad(req, res, next));
teamRoutes.get('/:id/players', cacheControl(60, 120), (req, res, next) => teamController.getSquad(req, res, next));


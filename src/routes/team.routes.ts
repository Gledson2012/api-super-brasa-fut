import { Router } from 'express';
import { teamController } from '../controllers/team.controller.js';

export const teamRoutes = Router();

teamRoutes.get('/', (req, res, next) => teamController.getAll(req, res, next));
teamRoutes.get('/:id', (req, res, next) => teamController.getById(req, res, next));
teamRoutes.get('/:id/matches', (req, res, next) => teamController.getMatches(req, res, next));
teamRoutes.get('/:id/squad', (req, res, next) => teamController.getSquad(req, res, next));
teamRoutes.get('/:id/players', (req, res, next) => teamController.getSquad(req, res, next));

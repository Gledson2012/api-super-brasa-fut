import { Router } from 'express';
import { newsController } from '../controllers/news.controller.js';

export const newsRoutes = Router();

newsRoutes.get('/', (req, res, next) => newsController.getAll(req, res, next));
newsRoutes.get('/:id', (req, res, next) => newsController.getById(req, res, next));

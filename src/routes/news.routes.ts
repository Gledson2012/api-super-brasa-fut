import { Router } from 'express';
import { newsController } from '../controllers/news.controller.js';
import { cacheControl } from '../middlewares/cache.middleware.js';

export const newsRoutes = Router();

newsRoutes.get('/', cacheControl(60, 120), (req, res, next) => newsController.getAll(req, res, next));
newsRoutes.get('/:id', cacheControl(60, 120), (req, res, next) => newsController.getById(req, res, next));


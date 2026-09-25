import { Router } from 'express';
import { newsController } from '../controllers/news.controller.js';
import { cacheControl } from '../middlewares/cache.middleware.js';
import { validateParams, validateQuery } from '../middlewares/validate.middleware.js';
import { idParamSchema, paginationQuerySchema } from '../schemas/api.schemas.js';

export const newsRoutes = Router();

newsRoutes.get('/', cacheControl(60, 120), validateQuery(paginationQuerySchema), newsController.getAll);
newsRoutes.get('/:id', cacheControl(60, 120), validateParams(idParamSchema), newsController.getById);

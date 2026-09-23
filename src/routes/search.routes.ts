import { Router } from 'express';
import { searchController } from '../controllers/search.controller.js';
import { cacheControl } from '../middlewares/cache.middleware.js';

export const searchRoutes = Router();

// GET /api/v1/search?q=flamengo&type=teams&limit=10
searchRoutes.get('/', cacheControl(30, 60), (req, res, next) => searchController.search(req, res, next));

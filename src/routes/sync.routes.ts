import { Router } from 'express';
import { syncController } from '../controllers/sync.controller.js';
import { requireTier } from '../middlewares/auth.middleware.js';

export const syncRoutes = Router();

syncRoutes.get('/status', syncController.getStatus);
syncRoutes.post('/flashscore', requireTier('pro'), syncController.triggerSync);
syncRoutes.post('/start', requireTier('pro'), syncController.startWorker);
syncRoutes.post('/stop', requireTier('pro'), syncController.stopWorker);

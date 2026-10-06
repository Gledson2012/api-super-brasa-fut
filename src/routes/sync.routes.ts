import { Router } from 'express';
import { syncController } from '../controllers/sync.controller.js';
import { requireTier } from '../middlewares/auth.middleware.js';

export const syncRoutes = Router();

// Flashscore endpoints
syncRoutes.get('/status', syncController.getStatus);
syncRoutes.post('/flashscore', requireTier('pro'), syncController.triggerSync);
syncRoutes.post('/start', requireTier('pro'), syncController.startWorker);
syncRoutes.post('/stop', requireTier('pro'), syncController.stopWorker);

// Sofascore endpoints
syncRoutes.get('/sofascore/status', syncController.getSofascoreStatus);
syncRoutes.get('/sofascore/transfers', syncController.getSofascoreTransfers);
syncRoutes.get('/sofascore/ratings', syncController.getSofascoreRatings);
syncRoutes.post('/sofascore', requireTier('pro'), syncController.triggerSofascoreSync);
syncRoutes.post('/sofascore/paste', requireTier('pro'), syncController.pasteSofascore);
syncRoutes.post('/sofascore/start', requireTier('pro'), syncController.startSofascoreWorker);
syncRoutes.post('/sofascore/stop', requireTier('pro'), syncController.stopSofascoreWorker);


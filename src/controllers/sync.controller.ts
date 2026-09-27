import { Request, Response } from 'express';
import { flashscoreSyncService } from '../services/flashscore-sync.service.js';
import { successResponse } from '../utils/response.js';
import { asyncHandler } from '../utils/async-handler.js';
import { todayInTimeZone, tomorrowInTimeZone, yesterdayInTimeZone } from '../utils/date.js';

export class SyncController {
  public getStatus = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const status = flashscoreSyncService.getStatus();
    res.json(successResponse(status));
  });

  public triggerSync = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const dateParam = (req.query.date as string) || (req.body.date as string) || 'today';
    const mode = (req.query.mode as string) || (req.body.mode as string);

    if (mode === 'all') {
      const allResults = await flashscoreSyncService.syncAll();
      res.json(successResponse(allResults));
      return;
    }

    if (mode === 'live' || dateParam === 'live') {
      const result = await flashscoreSyncService.syncMatches('?s=2', todayInTimeZone());
      res.json(successResponse(result));
      return;
    }

    let queryPath = '';
    let targetDate = todayInTimeZone();

    if (dateParam === 'tomorrow' || dateParam === 'amanha' || dateParam === '1') {
      queryPath = '?d=1';
      targetDate = tomorrowInTimeZone();
    } else if (dateParam === 'yesterday' || dateParam === 'ontem' || dateParam === '-1') {
      queryPath = '?d=-1';
      targetDate = yesterdayInTimeZone();
    } else if (dateParam && dateParam !== 'today' && dateParam !== 'hoje' && dateParam !== '0') {
      targetDate = dateParam;
    }

    const result = await flashscoreSyncService.syncMatches(queryPath, targetDate);
    res.json(successResponse(result));
  });

  public startWorker = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const intervalMinutes = req.body.intervalMinutes ? parseInt(req.body.intervalMinutes, 10) : 5;
    flashscoreSyncService.startBackgroundSync(intervalMinutes);
    res.json(
      successResponse({
        message: `Flashscore Sync Worker iniciado com sucesso. Intervalo: ${intervalMinutes} minutos.`,
        status: flashscoreSyncService.getStatus(),
      })
    );
  });

  public stopWorker = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    flashscoreSyncService.stopBackgroundSync();
    res.json(
      successResponse({
        message: 'Flashscore Sync Worker pausado com sucesso.',
        status: flashscoreSyncService.getStatus(),
      })
    );
  });
}

export const syncController = new SyncController();

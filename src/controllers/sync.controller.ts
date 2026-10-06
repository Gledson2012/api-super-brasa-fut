import { Request, Response } from 'express';
import { flashscoreSyncService } from '../services/flashscore-sync.service.js';
import { sofascoreSyncService } from '../services/sofascore-sync.service.js';
import { successResponse } from '../utils/response.js';
import { asyncHandler } from '../utils/async-handler.js';
import { todayInTimeZone, tomorrowInTimeZone, yesterdayInTimeZone } from '../utils/date.js';

export class SyncController {
  public getStatus = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const status = flashscoreSyncService.getStatus();
    res.json(successResponse(status));
  });

  public getSofascoreStatus = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const status = sofascoreSyncService.getStatus();
    res.json(successResponse(status));
  });

  public getSofascoreTransfers = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const transfers = sofascoreSyncService.getTransfers();
    res.json(successResponse(transfers));
  });

  public getSofascoreRatings = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const ratings = sofascoreSyncService.getTopRatings();
    res.json(successResponse(ratings));
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

  public triggerSofascoreSync = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const content = req.body?.text || req.body?.content || (typeof req.body === 'string' ? req.body : undefined);
    const dateParam = (req.query.date as string) || (req.body?.date as string) || todayInTimeZone();
    const result = await sofascoreSyncService.syncMatches(content, dateParam);
    res.json(successResponse(result, 'Sincronização Sofascore concluída com sucesso.'));
  });

  public pasteSofascore = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const content = req.body?.text || req.body?.content || (typeof req.body === 'string' ? req.body : '');
    const dateParam = (req.query.date as string) || (req.body?.date as string) || todayInTimeZone();
    const result = await sofascoreSyncService.syncFromText(content, dateParam);
    res.json(successResponse(result, 'Conteúdo do Sofascore processado e sincronizado com sucesso.'));
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

  public startSofascoreWorker = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const intervalMinutes = req.body.intervalMinutes ? parseInt(req.body.intervalMinutes, 10) : 5;
    sofascoreSyncService.startBackgroundSync(intervalMinutes);
    res.json(
      successResponse({
        message: `Sofascore Sync Worker iniciado com sucesso. Intervalo: ${intervalMinutes} minutos.`,
        status: sofascoreSyncService.getStatus(),
      })
    );
  });

  public stopSofascoreWorker = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    sofascoreSyncService.stopBackgroundSync();
    res.json(
      successResponse({
        message: 'Sofascore Sync Worker pausado com sucesso.',
        status: sofascoreSyncService.getStatus(),
      })
    );
  });
}

export const syncController = new SyncController();


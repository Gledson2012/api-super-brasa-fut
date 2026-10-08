import { Request, Response } from 'express';
import { flashscoreSyncService } from '../services/flashscore-sync.service.js';
import { sofascoreSyncService } from '../services/sofascore-sync.service.js';
import { successResponse } from '../utils/response.js';
import { asyncHandler } from '../utils/async-handler.js';
import { todayInTimeZone, tomorrowInTimeZone, yesterdayInTimeZone } from '../utils/date.js';

const DEFAULT_SYNC_INTERVAL_MINUTES = 5;

/**
 * Normaliza o intervalo (em minutos) recebido de clientes para os workers de
 * sincronização em background. Garante um inteiro >= 1 ou o default (5),
 * impedindo que valores não numéricos (ex.: "abc"), NaN/Infinity ou <= 0 virem
 * um `setInterval` de ~1ms que inundaria os sites externos alvo.
 */
export function normalizeSyncIntervalMinutes(raw: unknown): number {
  if (typeof raw !== 'number' && typeof raw !== 'string') return DEFAULT_SYNC_INTERVAL_MINUTES;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 1
    ? Math.max(1, Math.floor(parsed))
    : DEFAULT_SYNC_INTERVAL_MINUTES;
}

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
    const intervalMinutes = normalizeSyncIntervalMinutes(req.body?.intervalMinutes);
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
    const intervalMinutes = normalizeSyncIntervalMinutes(req.body?.intervalMinutes);
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


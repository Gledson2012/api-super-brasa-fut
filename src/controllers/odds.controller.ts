import { Request, Response } from 'express';
import { oddsService } from '../services/odds.service.js';
import { successResponse, sendPaginatedResponse } from '../utils/response.js';
import { asyncHandler } from '../utils/async-handler.js';

export class OddsController {
  public getAll = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { page, limit, leagueId, matchId } = req.query;
    const result = await oddsService.getOdds(
      {
        leagueId: leagueId as string,
        matchId: matchId as string,
      },
      { page: page as any, limit: limit as any }
    );
    sendPaginatedResponse(res, result);
  });

  public getByMatchId = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const matchId = (req.params.matchId || req.params.id) as string;
    const odds = await oddsService.getOddsByMatchId(matchId);
    res.json(successResponse(odds));
  });
}

export const oddsController = new OddsController();

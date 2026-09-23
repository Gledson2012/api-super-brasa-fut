import { Request, Response, NextFunction } from 'express';
import { oddsService } from '../services/odds.service.js';
import { successResponse, sendPaginatedResponse } from '../utils/response.js';

export class OddsController {
  public async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit, leagueId, matchId } = req.query;
      const result = await oddsService.getOdds(
        {
          leagueId: leagueId as string,
          matchId: matchId as string,
        },
        { page: page as any, limit: limit as any }
      );
      sendPaginatedResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  public async getByMatchId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const matchId = (req.params.matchId || req.params.id) as string;
      const odds = await oddsService.getOddsByMatchId(matchId);
      res.json(successResponse(odds));
    } catch (error) {
      next(error);
    }
  }
}

export const oddsController = new OddsController();


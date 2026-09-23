import { Request, Response, NextFunction } from 'express';
import { standingService } from '../services/standing.service.js';
import { successResponse } from '../utils/response.js';

export class StandingController {
  public async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit, leagueId, season, country } = req.query;
      const result = await standingService.getStandings(
        {
          leagueId: leagueId as string,
          season: season as string,
          country: country as string,
        },
        { page: page as any, limit: limit as any }
      );
      res.json(successResponse(result.data));
    } catch (error) {
      next(error);
    }
  }

  public async getByLeagueId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { leagueId } = req.params;
      const standing = await standingService.getStandingByLeagueId(leagueId);
      res.json(successResponse(standing));
    } catch (error) {
      next(error);
    }
  }
}

export const standingController = new StandingController();

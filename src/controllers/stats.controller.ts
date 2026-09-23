import { Request, Response, NextFunction } from 'express';
import { statsService } from '../services/stats.service.js';
import { successResponse } from '../utils/response.js';

export class StatsController {
  public async getAllLeaders(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const leaders = await statsService.getAllLeaders();
      res.json(successResponse(leaders));
    } catch (error) {
      next(error);
    }
  }

  public async getLeagueLeaders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { leagueId } = req.params;
      const leaders = await statsService.getLeagueLeaders(leagueId);
      res.json(successResponse(leaders));
    } catch (error) {
      next(error);
    }
  }

  public async getTopScorers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { leagueId } = req.params;
      const scorers = await statsService.getTopScorers(leagueId);
      res.json(successResponse(scorers));
    } catch (error) {
      next(error);
    }
  }

  public async getTopAssists(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { leagueId } = req.params;
      const assists = await statsService.getTopAssists(leagueId);
      res.json(successResponse(assists));
    } catch (error) {
      next(error);
    }
  }

  public async getTopRatings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { leagueId } = req.params;
      const ratings = await statsService.getTopRatings(leagueId);
      res.json(successResponse(ratings));
    } catch (error) {
      next(error);
    }
  }
}

export const statsController = new StatsController();

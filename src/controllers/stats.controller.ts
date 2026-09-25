import { Request, Response } from 'express';
import { statsService } from '../services/stats.service.js';
import { successResponse } from '../utils/response.js';
import { asyncHandler } from '../utils/async-handler.js';

export class StatsController {
  public getAllLeaders = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const leaders = await statsService.getAllLeaders();
    res.json(successResponse(leaders));
  });

  public getLeagueLeaders = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { leagueId } = req.params;
    const leaders = await statsService.getLeagueLeaders(leagueId);
    res.json(successResponse(leaders));
  });

  public getTopScorers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { leagueId } = req.params;
    const scorers = await statsService.getTopScorers(leagueId);
    res.json(successResponse(scorers));
  });

  public getTopAssists = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { leagueId } = req.params;
    const assists = await statsService.getTopAssists(leagueId);
    res.json(successResponse(assists));
  });

  public getTopRatings = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { leagueId } = req.params;
    const ratings = await statsService.getTopRatings(leagueId);
    res.json(successResponse(ratings));
  });
}

export const statsController = new StatsController();

import { Request, Response } from 'express';
import { standingService } from '../services/standing.service.js';
import { successResponse } from '../utils/response.js';
import { asyncHandler } from '../utils/async-handler.js';
import { standingToCsv } from '../utils/csv.js';

export class StandingController {
  public getAll = asyncHandler(async (req: Request, res: Response): Promise<void> => {
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
  });

  public validate = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const report = await standingService.validateStandings();
    res.json(successResponse(report));
  });

  public getByLeagueId = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { leagueId } = req.params;
    const standing = await standingService.getStandingByLeagueId(leagueId);

    if (req.query.format === 'csv') {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="classificacao-${leagueId}.csv"`);
      res.send(standingToCsv(standing));
      return;
    }

    res.json(successResponse(standing));
  });
}

export const standingController = new StandingController();

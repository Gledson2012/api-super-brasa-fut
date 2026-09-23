import { Request, Response, NextFunction } from 'express';
import { leagueService } from '../services/league.service.js';
import { successResponse, sendPaginatedResponse } from '../utils/response.js';

export class LeagueController {
  public async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit, country, tier, gender, ageCategory, isLive, isCup, search } = req.query;
      const result = await leagueService.getLeagues(
        {
          country: country as string,
          tier: tier as any,
          gender: gender as any,
          ageCategory: ageCategory as any,
          isLive: isLive !== undefined ? isLive === 'true' : undefined,
          isCup: isCup !== undefined ? isCup === 'true' : undefined,
          search: search as string,
        },
        { page: page as any, limit: limit as any }
      );
      sendPaginatedResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  public async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const league = await leagueService.getLeagueById(id);
      res.json(successResponse(league));
    } catch (error) {
      next(error);
    }
  }

  public async getStandings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const standings = await leagueService.getLeagueStandings(id);
      res.json(successResponse(standings));
    } catch (error) {
      next(error);
    }
  }

  public async getMatches(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { page, limit, status, round, date } = req.query;
      const matches = await leagueService.getLeagueMatches(
        id,
        {
          status: status as any,
          round: round ? parseInt(round as string, 10) : undefined,
          date: date as string,
        },
        { page: page as any, limit: limit as any }
      );
      res.json(successResponse(matches.data));
    } catch (error) {
      next(error);
    }
  }

  public async getTeams(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const teams = await leagueService.getLeagueTeams(id);
      res.json(successResponse(teams));
    } catch (error) {
      next(error);
    }
  }

  public async getLeaders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const leaders = await leagueService.getLeagueLeaders(id);
      res.json(successResponse(leaders));
    } catch (error) {
      next(error);
    }
  }
}

export const leagueController = new LeagueController();

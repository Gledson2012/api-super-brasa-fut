import { Request, Response, NextFunction } from 'express';
import { teamService } from '../services/team.service.js';
import { successResponse, sendPaginatedResponse } from '../utils/response.js';

export class TeamController {
  public async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit, leagueId, country, gender, ageCategory, search } = req.query;
      const result = await teamService.getTeams(
        {
          leagueId: leagueId as string,
          country: country as string,
          gender: gender as any,
          ageCategory: ageCategory as any,
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
      const team = await teamService.getTeamById(id);
      res.json(successResponse(team));
    } catch (error) {
      next(error);
    }
  }

  public async getMatches(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { page, limit, status, date } = req.query;
      const matches = await teamService.getTeamMatches(
        id,
        {
          status: status as any,
          date: date as string,
        },
        { page: page as any, limit: limit as any }
      );
      res.json(successResponse(matches.data));
    } catch (error) {
      next(error);
    }
  }

  public async getSquad(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const squad = await teamService.getTeamSquad(id);
      res.json(successResponse(squad));
    } catch (error) {
      next(error);
    }
  }
}

export const teamController = new TeamController();

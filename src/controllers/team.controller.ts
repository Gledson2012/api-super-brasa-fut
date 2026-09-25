import { Request, Response } from 'express';
import { teamService } from '../services/team.service.js';
import { successResponse, sendPaginatedResponse } from '../utils/response.js';
import { asyncHandler } from '../utils/async-handler.js';

export class TeamController {
  public getAll = asyncHandler(async (req: Request, res: Response): Promise<void> => {
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
  });

  public getById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const team = await teamService.getTeamById(id);
    res.json(successResponse(team));
  });

  public getMatches = asyncHandler(async (req: Request, res: Response): Promise<void> => {
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
  });

  public getSquad = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const squad = await teamService.getTeamSquad(id);
    res.json(successResponse(squad));
  });

  public getCalendar = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const calendar = await teamService.getTeamCalendar(id);
    res.json(successResponse(calendar));
  });
}

export const teamController = new TeamController();

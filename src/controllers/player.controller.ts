import { Request, Response, NextFunction } from 'express';
import { playerService } from '../services/player.service.js';
import { successResponse, sendPaginatedResponse } from '../utils/response.js';

export class PlayerController {
  public async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit, teamId, nationality, position, search, leagueId } = req.query;
      const result = await playerService.getPlayers(
        {
          teamId: teamId as string,
          nationality: nationality as string,
          position: position as any,
          search: search as string,
          leagueId: leagueId as string,
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
      const player = await playerService.getPlayerById(id);
      res.json(successResponse(player));
    } catch (error) {
      next(error);
    }
  }
}

export const playerController = new PlayerController();

import { Request, Response, NextFunction } from 'express';
import { matchService } from '../services/match.service.js';
import { successResponse, sendPaginatedResponse } from '../utils/response.js';

export class MatchController {
  public async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit, leagueId, status, date, teamId, round, gender, ageCategory } = req.query;
      const result = await matchService.getMatches(
        {
          leagueId: leagueId as string,
          status: status as any,
          date: date as string,
          teamId: teamId as string,
          round: round ? parseInt(round as string, 10) : undefined,
          gender: gender as any,
          ageCategory: ageCategory as any,
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
      const match = await matchService.getMatchById(id);
      res.json(successResponse(match));
    } catch (error) {
      next(error);
    }
  }

  public async getLive(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const liveMatches = await matchService.getLiveMatches();
      res.json(successResponse(liveMatches));
    } catch (error) {
      next(error);
    }
  }

  public async getHeadToHead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { team1Id, team2Id } = req.query;
      const h2h = await matchService.getHeadToHead(team1Id as string, team2Id as string);
      res.json(successResponse(h2h));
    } catch (error) {
      next(error);
    }
  }

  public async simulateTick(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const updatedMatch = await matchService.simulateLiveTick(id);
      res.json(successResponse(updatedMatch, 'Simulação de minuto de jogo atualizada com sucesso.'));
    } catch (error) {
      next(error);
    }
  }
}

export const matchController = new MatchController();

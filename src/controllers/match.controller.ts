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

  public async streamLive(req: Request, res: Response): Promise<void> {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    if (typeof (res as any).flushHeaders === 'function') {
      (res as any).flushHeaders();
    }

    res.write(
      `event: connected\ndata: ${JSON.stringify({
        message: 'Super Brasa Fut Live Match Stream conectado com sucesso.',
        timestamp: new Date().toISOString(),
      })}\n\n`
    );

    try {
      const initialMatches = await matchService.getLiveMatches();
      res.write(`event: matches\ndata: ${JSON.stringify(initialMatches)}\n\n`);
    } catch {
      // ignore initial fetch error
    }

    const interval = setInterval(async () => {
      try {
        const liveMatches = await matchService.getLiveMatches();
        res.write(`event: matches\ndata: ${JSON.stringify(liveMatches)}\n\n`);
      } catch {
        res.write(`event: ping\ndata: ${JSON.stringify({ timestamp: new Date().toISOString() })}\n\n`);
      }
    }, 3000);

    req.on('close', () => {
      clearInterval(interval);
      res.end();
    });
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

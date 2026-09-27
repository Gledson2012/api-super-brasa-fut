import { Request, Response } from 'express';
import { matchService } from '../services/match.service.js';
import { lineupService } from '../services/lineup.service.js';
import { successResponse, sendPaginatedResponse } from '../utils/response.js';
import { asyncHandler } from '../utils/async-handler.js';
import { activeSseConnections } from '../services/metrics.service.js';
import { matchesToCsv } from '../utils/csv.js';

export class MatchController {
  public getAll = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { page, limit, leagueId, status, date, teamId, round, gender, ageCategory, format } = req.query;
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

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="partidas.csv"');
      res.send(matchesToCsv(result.data));
      return;
    }

    sendPaginatedResponse(res, result);
  });

  public getById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const match = await matchService.getMatchById(id);
    res.json(successResponse(match));
  });

  public getLive = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const liveMatches = await matchService.getLiveMatches();
    res.json(successResponse(liveMatches));
  });

  public streamLive = (req: Request, res: Response): void => {
    activeSseConnections.inc();
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

    matchService
      .getLiveMatches()
      .then((initialMatches) => {
        if (!res.writableEnded) {
          res.write(`event: matches\ndata: ${JSON.stringify(initialMatches)}\n\n`);
        }
      })
      .catch(() => {});

    let isClosed = false;
    const interval = setInterval(async () => {
      if (isClosed || res.writableEnded) {
        clearInterval(interval);
        return;
      }

      try {
        const liveMatches = await matchService.getLiveMatches();
        if (!res.writableEnded) {
          res.write(`event: matches\ndata: ${JSON.stringify(liveMatches)}\n\n`);
        }
      } catch {
        if (!res.writableEnded) {
          res.write(`event: ping\ndata: ${JSON.stringify({ timestamp: new Date().toISOString() })}\n\n`);
        }
      }
    }, 3000);

    const cleanup = () => {
      if (isClosed) return;
      isClosed = true;
      activeSseConnections.dec();
      clearInterval(interval);
      if (!res.writableEnded) {
        res.end();
      }
    };

    req.on('close', cleanup);
    req.on('end', cleanup);
    req.on('error', cleanup);
    res.on('close', cleanup);
    res.on('finish', cleanup);
    res.on('error', cleanup);
  };

  public getHeadToHead = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { team1Id, team2Id } = req.query;
    const h2h = await matchService.getHeadToHead(team1Id as string, team2Id as string);
    res.json(successResponse(h2h));
  });

  public getLineups = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const lineups = await lineupService.getLineupsByMatchId(id);
    res.json(successResponse(lineups));
  });

  public getStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const match = await matchService.getMatchById(id);
    res.json(
      successResponse({
        matchId: match.id,
        matchSlug: match.slug,
        status: match.status,
        minute: match.minute,
        score: match.score,
        stats: match.stats,
        momentum: match.momentum,
      })
    );
  });

  public simulateTick = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const updatedMatch = await matchService.simulateLiveTick(id);
    res.json(successResponse(updatedMatch, 'Simulação de minuto de jogo atualizada com sucesso.'));
  });

  public simulateEvent = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { type, team, player, minute } = req.body || {};
    const updatedMatch = await matchService.simulateLiveEvent(id, { type, team, player, minute });
    res.json(successResponse(updatedMatch, 'Evento de partida simulado com sucesso.'));
  });

  public simulateAuto = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const result = await matchService.startAutoSimulation(id, req.body);
    res.json(successResponse(result, result.message));
  });

  public simulateStop = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const result = matchService.stopAutoSimulation(id);
    res.json(successResponse(result, result.message));
  });

  public simulateStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const status = matchService.getAutoSimulationStatus(id);
    res.json(successResponse(status));
  });

  public resetMatches = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const result = await matchService.resetAllMatches();
    res.json(successResponse(result, result.message));
  });
}

export const matchController = new MatchController();


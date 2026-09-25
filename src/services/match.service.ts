import { matchRepository } from '../repositories/match.repository.js';
import { db } from '../repositories/db.js';
import { Match, MatchFilterQuery, MatchEvent, MatchStatus } from '../models/match.model.js';
import { PaginatedResult, PaginationQuery } from '../models/common.js';
import { paginate } from '../utils/pagination.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';
import { webhookService } from './webhook.service.js';

export class MatchService {
  public async getMatches(
    filters: MatchFilterQuery,
    pagination: PaginationQuery
  ): Promise<PaginatedResult<Match>> {
    const matches = await matchRepository.findAll(filters);
    return paginate(matches, pagination.page, pagination.limit);
  }

  public async getMatchById(id: string): Promise<Match> {
    const match = await matchRepository.findById(id);
    if (!match) {
      throw new NotFoundError(`Partida com ID ou slug '${id}' não encontrada.`);
    }
    return match;
  }

  public async getLiveMatches(): Promise<Match[]> {
    return matchRepository.findLive();
  }

  public async getHeadToHead(team1Id: string, team2Id: string) {
    if (!team1Id || !team2Id) {
      throw new BadRequestError('Os parâmetros team1Id e team2Id são obrigatórios para o confronto direto.');
    }

    const matches = await matchRepository.findHeadToHead(team1Id, team2Id);

    let team1Wins = 0;
    let team2Wins = 0;
    let draws = 0;
    let team1Goals = 0;
    let team2Goals = 0;

    matches.forEach((m) => {
      if (m.score.home === null || m.score.away === null) return;

      const isTeam1Home = m.homeTeam.id === team1Id;
      const t1Score = isTeam1Home ? m.score.home : m.score.away;
      const t2Score = isTeam1Home ? m.score.away : m.score.home;

      team1Goals += t1Score;
      team2Goals += t2Score;

      if (t1Score > t2Score) team1Wins++;
      else if (t2Score > t1Score) team2Wins++;
      else draws++;
    });

    return {
      team1Id,
      team2Id,
      totalMatches: matches.length,
      team1Wins,
      team2Wins,
      draws,
      team1Goals,
      team2Goals,
      matches,
    };
  }

  public async simulateLiveTick(id: string): Promise<Match> {
    const match = await this.getMatchById(id);

    if (match.status === 'FINISHED') {
      return match;
    }

    const currentMinute = match.minute || 0;
    let nextMinute = currentMinute + 5;
    let nextStatus: MatchStatus = match.status;
    const events: MatchEvent[] = [...(match.events || [])];
    const score = { ...match.score };

    if (nextMinute >= 90) {
      nextMinute = 90;
      nextStatus = 'FINISHED';
    } else if (nextMinute === 45 && match.status === 'LIVE') {
      nextStatus = 'HALFTIME';
    } else {
      nextStatus = 'LIVE';
    }

    // Dynamic stats update: slightly increment passes, shots and possession fluctuations
    let stats = match.stats ? { ...match.stats } : undefined;
    if (stats) {
      stats = {
        home: {
          ...stats.home,
          totalPasses: stats.home.totalPasses + 4,
          accuratePasses: stats.home.accuratePasses + 3,
        },
        away: {
          ...stats.away,
          totalPasses: stats.away.totalPasses + 4,
          accuratePasses: stats.away.accuratePasses + 3,
        },
      };
    }

    const updated = await matchRepository.update(match.id, {
      minute: nextMinute,
      status: nextStatus,
      score,
      events,
      stats,
    });

    // Notifica assinantes quando o status muda (LIVE -> HALFTIME, -> FINISHED,
    // retomada do intervalo e afins).
    if (updated && updated.status !== match.status) {
      webhookService
        .notify('MATCH_STATUS_CHANGE', {
          matchId: updated.id,
          matchSlug: updated.slug,
          status: updated.status,
          previousStatus: match.status,
          minute: updated.minute,
          score: updated.score,
        })
        .catch(() => {});
    }

    return updated || match;
  }

  public async simulateLiveEvent(
    id: string,
    options?: {
      type?: 'GOAL' | 'YELLOW_CARD' | 'RED_CARD' | 'SUBSTITUTION';
      team?: 'home' | 'away';
      player?: string;
      minute?: number;
    }
  ): Promise<Match> {
    const match = await this.getMatchById(id);
    const events: MatchEvent[] = [...(match.events || [])];
    const score = { ...match.score };
    const currentMinute = options?.minute || (match.minute ? Math.min(match.minute + 2, 90) : 55);

    const targetTeamKey = options?.team || 'home';
    const targetTeam = targetTeamKey === 'home' ? match.homeTeam : match.awayTeam;

    const eventType = options?.type || 'GOAL';
    let detail = '';

    if (eventType === 'GOAL') {
      if (targetTeamKey === 'home') {
        score.home = (score.home || 0) + 1;
      } else {
        score.away = (score.away || 0) + 1;
      }
      detail = 'Gol marcado com precisão!';
    } else if (eventType === 'YELLOW_CARD') {
      detail = 'Falta tática no meio de campo';
    } else if (eventType === 'RED_CARD') {
      detail = 'Entrada dura e cartão vermelho direto';
    } else if (eventType === 'SUBSTITUTION') {
      detail = 'Substituição tática de jogo';
    }

    const newEvent: MatchEvent = {
      id: `evt-sim-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: eventType,
      minute: currentMinute,
      teamId: targetTeam.id,
      teamName: targetTeam.name,
      primaryPlayer: options?.player || (eventType === 'GOAL' ? `${targetTeam.shortName} Craque` : 'Jogador'),
      detail,
      scoreAfter: eventType === 'GOAL' ? { home: score.home || 0, away: score.away || 0 } : undefined,
    };

    events.push(newEvent);

    const updated = await matchRepository.update(match.id, {
      score,
      events,
      status: match.status === 'UPCOMING' ? 'LIVE' : match.status,
      minute: currentMinute,
    });

    // Notificar assinantes de webhook
    webhookService.notify(eventType === 'GOAL' ? 'GOAL' : 'MATCH_EVENT', {
      matchId: match.id,
      matchSlug: match.slug,
      event: newEvent,
      score,
      minute: currentMinute,
    }).catch(() => {});

    return updated || match;
  }

  public async resetAllMatches(): Promise<{ message: string; count: number }> {
    await db.resetAll();
    return {
      message: 'Todas as partidas foram restauradas para o estado inicial com sucesso.',
      count: db.matches.length,
    };
  }
}

export const matchService = new MatchService();


import { matchRepository } from '../repositories/match.repository.js';
import { Match, MatchFilterQuery, MatchEvent, MatchStatus } from '../models/match.model.js';
import { PaginatedResult, PaginationQuery } from '../models/common.js';
import { paginate } from '../utils/pagination.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';

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

    const updated = await matchRepository.update(match.id, {
      minute: nextMinute,
      status: nextStatus,
      score,
      events,
    });

    return updated || match;
  }
}

export const matchService = new MatchService();

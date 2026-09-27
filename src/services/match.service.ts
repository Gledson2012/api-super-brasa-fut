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
    let team1CleanSheets = 0;
    let team2CleanSheets = 0;
    let bttsCount = 0;
    let over25Count = 0;
    let totalCards = 0;

    const playedMatches = matches.filter((m) => m.score.home !== null && m.score.away !== null);

    playedMatches.forEach((m) => {
      const isTeam1Home = m.homeTeam.id === team1Id;
      const t1Score = isTeam1Home ? m.score.home! : m.score.away!;
      const t2Score = isTeam1Home ? m.score.away! : m.score.home!;

      team1Goals += t1Score;
      team2Goals += t2Score;

      if (t1Score > t2Score) team1Wins++;
      else if (t2Score > t1Score) team2Wins++;
      else draws++;

      if (t2Score === 0) team1CleanSheets++;
      if (t1Score === 0) team2CleanSheets++;

      if (t1Score > 0 && t2Score > 0) bttsCount++;
      if (t1Score + t2Score > 2) over25Count++;

      if (m.events) {
        m.events.forEach((e) => {
          if (e.type === 'YELLOW_CARD' || e.type === 'RED_CARD') totalCards++;
        });
      }
    });

    const playedCount = playedMatches.length;
    const goalsPerMatch = playedCount > 0 ? Number(((team1Goals + team2Goals) / playedCount).toFixed(2)) : 0;
    const cardsPerMatch = playedCount > 0 ? Number((totalCards / playedCount).toFixed(2)) : 0;
    const bttsPercentage = playedCount > 0 ? Math.round((bttsCount / playedCount) * 100) : 0;
    const over25Percentage = playedCount > 0 ? Math.round((over25Count / playedCount) * 100) : 0;

    // Sequência invicta mais recente (ordem cronológica decrescente)
    const sortedPlayed = [...playedMatches].sort(
      (a, b) => new Date(b.kickoffTime).getTime() - new Date(a.kickoffTime).getTime()
    );

    let streakTeamId: string | null = null;
    let streakGames = 0;

    for (const m of sortedPlayed) {
      const isTeam1Home = m.homeTeam.id === team1Id;
      const t1Score = isTeam1Home ? m.score.home! : m.score.away!;
      const t2Score = isTeam1Home ? m.score.away! : m.score.home!;

      if (t1Score > t2Score) {
        if (streakTeamId === null) streakTeamId = team1Id;
        if (streakTeamId === team1Id) streakGames++;
        else break;
      } else if (t2Score > t1Score) {
        if (streakTeamId === null) streakTeamId = team2Id;
        if (streakTeamId === team2Id) streakGames++;
        else break;
      } else {
        if (streakTeamId !== null) streakGames++;
        else break;
      }
    }

    const streak = streakTeamId
      ? {
          teamId: streakTeamId,
          games: streakGames,
          description: `Time '${streakTeamId}' está invicto há ${streakGames} confronto(s) direto(s).`,
        }
      : undefined;

    return {
      team1Id,
      team2Id,
      totalMatches: matches.length,
      team1Wins,
      team2Wins,
      draws,
      team1Goals,
      team2Goals,
      averages: {
        goalsPerMatch,
        cardsPerMatch,
      },
      bothTeamsScored: {
        count: bttsCount,
        percentage: bttsPercentage,
      },
      over25: {
        count: over25Count,
        percentage: over25Percentage,
      },
      cleanSheets: {
        team1: team1CleanSheets,
        team2: team2CleanSheets,
      },
      streak,
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
          leagueId: match.leagueId,
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
      leagueId: match.leagueId,
      event: newEvent,
      score,
      minute: currentMinute,
    }).catch(() => {});

    return updated || match;
  }

  private autoSimulations: Map<string, { timer: NodeJS.Timeout | null; running: boolean; intervalMs: number; startedAt: string }> = new Map();

  public async startAutoSimulation(
    id: string,
    options?: { intervalMs?: number; speedMinutes?: number; autoEvents?: boolean }
  ) {
    const match = await this.getMatchById(id);
    if (match.status === 'FINISHED') {
      throw new BadRequestError('Esta partida já está finalizada. Use POST /matches/reset para reiniciar o estado.');
    }

    this.stopAutoSimulation(id);

    const intervalMs = Math.max(500, Math.min(options?.intervalMs || 2500, 30000));
    const autoEvents = options?.autoEvents ?? true;

    const session = {
      timer: null as NodeJS.Timeout | null,
      running: true,
      intervalMs,
      startedAt: new Date().toISOString(),
    };

    session.timer = setInterval(async () => {
      try {
        const current = await this.getMatchById(id);
        if (current.status === 'FINISHED' || !session.running) {
          this.stopAutoSimulation(id);
          return;
        }

        const updated = await this.simulateLiveTick(id);

        if (autoEvents && updated.status === 'LIVE' && Math.random() < 0.35) {
          const rand = Math.random();
          const team = rand < 0.5 ? 'home' : 'away';
          let eventType: 'GOAL' | 'YELLOW_CARD' | 'SUBSTITUTION' = 'YELLOW_CARD';
          if (rand < 0.12) {
            eventType = 'GOAL';
          } else if (rand < 0.25) {
            eventType = 'SUBSTITUTION';
          }
          await this.simulateLiveEvent(id, { type: eventType, team, minute: updated.minute });
        }

        if (updated.status === 'FINISHED') {
          this.stopAutoSimulation(id);
        }
      } catch (err) {
        console.error(`Erro na simulação contínua da partida ${id}:`, err);
        this.stopAutoSimulation(id);
      }
    }, intervalMs);

    session.timer.unref?.();
    this.autoSimulations.set(id, session);

    return {
      message: `Simulação automática iniciada para a partida '${id}'.`,
      matchId: id,
      intervalMs,
      autoEvents,
      running: true,
    };
  }

  public stopAutoSimulation(id: string) {
    const session = this.autoSimulations.get(id);
    if (session) {
      session.running = false;
      if (session.timer) {
        clearInterval(session.timer);
        session.timer = null;
      }
      this.autoSimulations.delete(id);
      return { message: `Simulação automática da partida '${id}' finalizada.`, matchId: id, running: false };
    }
    return { message: `Nenhuma simulação automática ativa para a partida '${id}'.`, matchId: id, running: false };
  }

  public getAutoSimulationStatus(id: string) {
    const session = this.autoSimulations.get(id);
    return {
      matchId: id,
      running: session ? session.running : false,
      intervalMs: session?.intervalMs,
      startedAt: session?.startedAt,
    };
  }

  public stopAllAutoSimulations(): void {
    for (const [, session] of this.autoSimulations.entries()) {
      session.running = false;
      if (session.timer) {
        clearInterval(session.timer);
      }
    }
    this.autoSimulations.clear();
  }

  public async resetAllMatches(): Promise<{ message: string; count: number }> {
    this.stopAllAutoSimulations();
    await db.resetAll();
    return {
      message: 'Todas as partidas foram restauradas para o estado inicial com sucesso.',
      count: db.matches.length,
    };
  }
}

export const matchService = new MatchService();


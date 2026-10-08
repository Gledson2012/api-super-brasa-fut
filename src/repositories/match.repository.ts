import { Match, MatchFilterQuery } from '../models/match.model.js';
import { db } from './db.js';
import { todayInTimeZone, tomorrowInTimeZone, yesterdayInTimeZone } from '../utils/date.js';
import { config } from '../config/environment.js';
import { flashscoreSyncService } from '../services/flashscore-sync.service.js';

function getMatchLocalDate(kickoffTime: string): string | null {
  try {
    const d = new Date(kickoffTime);
    if (!isNaN(d.getTime())) {
      return todayInTimeZone(undefined, d);
    }
  } catch {}
  return null;
}

export class MatchRepository {
  public async findAll(filters: MatchFilterQuery = {}): Promise<Match[]> {
    const todayStr = todayInTimeZone();

    // 1. Sincronização sob demanda:
    // Se a consulta for para jogos de hoje e não houver nenhum em memória,
    // aciona a sincronização do Flashscore imediatamente.
    const isTodayQuery =
      filters.date === 'today' ||
      filters.date === 'hoje' ||
      filters.date === todayStr;

    if (config.env !== 'test' && process.env.FLASHSCORE_SYNC_ENABLED !== 'false') {
      if (isTodayQuery) {
        const hasToday = db.matches.some((m) => {
          const lDate = getMatchLocalDate(m.kickoffTime);
          return m.kickoffTime.startsWith(todayStr) || lDate === todayStr;
        });
        if (!hasToday) {
          try {
            await flashscoreSyncService.syncMatches('', todayStr);
          } catch (err: any) {
            console.warn('Falha na sincronização sob demanda dos jogos de hoje:', err.message);
          }
        }
      } else if (filters.liveOnly || filters.status === 'LIVE') {
        const hasLive = db.matches.some((m) => m.status === 'LIVE' || m.status === 'HALFTIME');
        if (!hasLive) {
          try {
            await flashscoreSyncService.syncMatches('?s=2', todayStr);
          } catch (err: any) {
            console.warn('Falha na sincronização sob demanda dos jogos ao vivo:', err.message);
          }
        }
      }
    }

    let result = [...db.matches];

    if (filters.leagueId) {
      result = result.filter((m) => m.leagueId === filters.leagueId);
    }

    if (filters.status) {
      result = result.filter((m) => m.status === filters.status);
    }

    if (filters.date) {
      let targetDate = filters.date;
      if (filters.date === 'today' || filters.date === 'hoje') {
        targetDate = todayStr;
      } else if (filters.date === 'tomorrow' || filters.date === 'amanha' || filters.date === 'amanhã') {
        targetDate = tomorrowInTimeZone();
      } else if (filters.date === 'yesterday' || filters.date === 'ontem') {
        targetDate = yesterdayInTimeZone();
      }

      result = result.filter((m) => {
        const matchLocalDate = getMatchLocalDate(m.kickoffTime);
        return m.kickoffTime.startsWith(targetDate) || matchLocalDate === targetDate;
      });
    }

    if (filters.teamId) {
      result = result.filter((m) => m.homeTeam.id === filters.teamId || m.awayTeam.id === filters.teamId);
    }

    if (filters.round) {
      result = result.filter((m) => String(m.round || m.leagueRound) === String(filters.round));
    }

    if (filters.gender && filters.gender !== 'all') {
      result = result.filter((m) => m.gender === filters.gender);
    }

    if (filters.ageCategory && filters.ageCategory !== 'all') {
      result = result.filter((m) => m.ageCategory === filters.ageCategory);
    }

    if (filters.liveOnly) {
      result = result.filter((m) => m.status === 'LIVE' || m.status === 'HALFTIME');
    }

    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(
        (m) =>
          m.homeTeam.name.toLowerCase().includes(q) ||
          m.awayTeam.name.toLowerCase().includes(q) ||
          m.leagueName.toLowerCase().includes(q) ||
          (m.homeTeam.shortName && m.homeTeam.shortName.toLowerCase().includes(q)) ||
          (m.awayTeam.shortName && m.awayTeam.shortName.toLowerCase().includes(q)) ||
          (m.homeTeam.code && m.homeTeam.code.toLowerCase().includes(q)) ||
          (m.awayTeam.code && m.awayTeam.code.toLowerCase().includes(q))
      );
    }

    // Ordenação
    if (filters.sort) {
      const order = filters.order === 'desc' ? -1 : 1;
      result.sort((a, b) => {
        if (filters.sort === 'kickoffTime' || filters.sort === 'date') {
          return (new Date(a.kickoffTime).getTime() - new Date(b.kickoffTime).getTime()) * order;
        }
        if (filters.sort === 'status') {
          return a.status.localeCompare(b.status) * order;
        }
        return 0;
      });
    } else {
      // Ordenação inteligente padrão para priorizar relevância temporal e partidas ao vivo:
      // 1. Partidas LIVE / HALFTIME no topo (mais recentes no tempo)
      // 2. Partidas de HOJE (UPCOMING / SCHEDULED ordenadas por horário de início)
      // 3. Partidas de HOJE (FINISHED ordenadas por horário de término)
      // 4. Partidas futuras (UPCOMING mais próximas primeiro)
      // 5. Partidas passadas (FINISHED mais recentes primeiro)
      result.sort((a, b) => {
        const getScore = (m: Match): number => {
          if (m.status === 'LIVE' || m.status === 'HALFTIME') return 1;
          const localDate = getMatchLocalDate(m.kickoffTime) || m.kickoffTime.slice(0, 10);
          if (localDate === todayStr) {
            return m.status === 'FINISHED' ? 3 : 2;
          }
          if (localDate > todayStr) return 4;
          return 5;
        };

        const scoreA = getScore(a);
        const scoreB = getScore(b);
        if (scoreA !== scoreB) {
          return scoreA - scoreB;
        }

        const timeA = new Date(a.kickoffTime).getTime();
        const timeB = new Date(b.kickoffTime).getTime();

        if (scoreA === 1) {
          return (b.minute || 0) - (a.minute || 0);
        }
        if (scoreA === 2 || scoreA === 4) {
          return timeA - timeB;
        }
        return timeB - timeA;
      });
    }

    return result;
  }

  public async findById(id: string): Promise<Match | null> {
    const match = db.matches.find((m) => m.id === id || m.slug === id);
    return match || null;
  }

  public async findLive(): Promise<Match[]> {
    let live = db.matches.filter((m) => m.status === 'LIVE' || m.status === 'HALFTIME');
    if (live.length === 0 && config.env !== 'test' && process.env.FLASHSCORE_SYNC_ENABLED !== 'false') {
      try {
        await flashscoreSyncService.syncMatches('?s=2', todayInTimeZone());
        live = db.matches.filter((m) => m.status === 'LIVE' || m.status === 'HALFTIME');
      } catch (err: any) {
        console.warn('Falha na sincronização de jogos ao vivo:', err.message);
      }
    }
    return live;
  }

  public async findHeadToHead(team1Id: string, team2Id: string): Promise<Match[]> {
    return db.matches.filter(
      (m) =>
        (m.homeTeam.id === team1Id && m.awayTeam.id === team2Id) ||
        (m.homeTeam.id === team2Id && m.awayTeam.id === team1Id)
    );
  }

  public async update(id: string, updates: Partial<Match>): Promise<Match | null> {
    const index = db.matches.findIndex((m) => m.id === id);
    if (index === -1) return null;

    db.matches[index] = {
      ...db.matches[index],
      ...updates,
    };
    db.persist('matches');
    return db.matches[index];
  }
}

export const matchRepository = new MatchRepository();

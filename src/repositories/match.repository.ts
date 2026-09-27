import { Match, MatchFilterQuery } from '../models/match.model.js';
import { db } from './db.js';
import { todayInTimeZone, tomorrowInTimeZone, yesterdayInTimeZone } from '../utils/date.js';

export class MatchRepository {
  public async findAll(filters: MatchFilterQuery = {}): Promise<Match[]> {
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
        targetDate = todayInTimeZone();
      } else if (filters.date === 'tomorrow' || filters.date === 'amanha' || filters.date === 'amanhã') {
        targetDate = tomorrowInTimeZone();
      } else if (filters.date === 'yesterday' || filters.date === 'ontem') {
        targetDate = yesterdayInTimeZone();
      }

      result = result.filter((m) => {
        const matchLocalDate = todayInTimeZone(undefined, new Date(m.kickoffTime));
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

    return result;
  }

  public async findById(id: string): Promise<Match | null> {
    const match = db.matches.find((m) => m.id === id || m.slug === id);
    return match || null;
  }

  public async findLive(): Promise<Match[]> {
    return db.matches.filter((m) => m.status === 'LIVE' || m.status === 'HALFTIME');
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

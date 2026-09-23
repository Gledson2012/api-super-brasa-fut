import { Match, MatchFilterQuery } from '../models/match.model.js';
import { db } from './db.js';

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
      result = result.filter((m) => m.kickoffTime.startsWith(filters.date!));
    }

    if (filters.teamId) {
      result = result.filter((m) => m.homeTeam.id === filters.teamId || m.awayTeam.id === filters.teamId);
    }

    if (filters.round) {
      result = result.filter((m) => String(m.round || m.leagueRound) === String(filters.round));
    }

    if (filters.gender) {
      result = result.filter((m) => m.gender === filters.gender);
    }

    if (filters.ageCategory) {
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
    return db.matches[index];
  }
}

export const matchRepository = new MatchRepository();

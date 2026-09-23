import { LeagueStanding, StandingFilterQuery } from '../models/standing.model.js';
import { db } from './db.js';

export class StandingRepository {
  public async findAll(filters: StandingFilterQuery = {}): Promise<LeagueStanding[]> {
    let result = [...db.standings];

    if (filters.leagueId) {
      result = result.filter((s) => s.leagueId === filters.leagueId || s.id === filters.leagueId);
    }

    if (filters.season) {
      result = result.filter((s) => s.season === filters.season);
    }

    if (filters.country) {
      const country = filters.country.toLowerCase();
      result = result.filter((s) => s.country.toLowerCase().includes(country));
    }

    return result;
  }

  public async findByLeagueId(leagueId: string): Promise<LeagueStanding | null> {
    const standing = db.standings.find((s) => s.leagueId === leagueId || s.id === leagueId);
    return standing || null;
  }

  public async findById(id: string): Promise<LeagueStanding | null> {
    const standing = db.standings.find((s) => s.id === id || s.leagueId === id);
    return standing || null;
  }
}

export const standingRepository = new StandingRepository();

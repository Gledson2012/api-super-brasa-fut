import { MatchOddsDetail } from '../models/odds.model.js';
import { db } from './db.js';

export class OddsRepository {
  public async findAll(filters: { leagueId?: string; matchId?: string } = {}): Promise<MatchOddsDetail[]> {
    let result = [...db.odds];

    if (filters.leagueId) {
      result = result.filter((o) => o.leagueId === filters.leagueId);
    }

    if (filters.matchId) {
      result = result.filter((o) => o.matchId === filters.matchId || o.matchSlug === filters.matchId);
    }

    return result;
  }

  public async findByMatchId(matchId: string): Promise<MatchOddsDetail | null> {
    const odd = db.odds.find((o) => o.matchId === matchId || o.matchSlug === matchId);
    return odd || null;
  }
}

export const oddsRepository = new OddsRepository();

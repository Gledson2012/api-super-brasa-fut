import { LeagueBracket } from '../models/bracket.model.js';
import { db } from './db.js';

export class BracketRepository {
  public async findAll(): Promise<LeagueBracket[]> {
    return [...db.brackets];
  }

  public async findByLeagueId(leagueId: string): Promise<LeagueBracket | null> {
    const bracket = db.brackets.find(
      (b) => b.leagueId === leagueId || b.id === leagueId
    );
    return bracket || null;
  }
}

export const bracketRepository = new BracketRepository();

import { MatchLineups } from '../models/lineup.model.js';
import { db } from './db.js';

export class LineupRepository {
  public async findByMatchId(matchId: string): Promise<MatchLineups | null> {
    const lineups = db.lineups.find((l) => l.matchId === matchId);
    return lineups || null;
  }
}

export const lineupRepository = new LineupRepository();

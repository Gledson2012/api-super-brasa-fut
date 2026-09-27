import { lineupRepository } from '../repositories/lineup.repository.js';
import { matchRepository } from '../repositories/match.repository.js';
import { MatchLineups } from '../models/lineup.model.js';
import { NotFoundError } from '../utils/errors.js';

export class LineupService {
  public async getLineupsByMatchId(matchId: string): Promise<MatchLineups> {
    const match = await matchRepository.findById(matchId);
    if (!match) {
      throw new NotFoundError(`Partida com ID '${matchId}' não encontrada.`);
    }

    const lineups = await lineupRepository.findByMatchId(match.id);
    if (!lineups) {
      throw new NotFoundError(`Escalações para a partida '${matchId}' ainda não foram divulgadas.`);
    }

    return lineups;
  }
}

export const lineupService = new LineupService();

import { bracketRepository } from '../repositories/bracket.repository.js';
import { LeagueBracket } from '../models/bracket.model.js';
import { NotFoundError } from '../utils/errors.js';

export class BracketService {
  public async getAllBrackets(): Promise<LeagueBracket[]> {
    return bracketRepository.findAll();
  }

  public async getBracketByLeagueId(leagueId: string): Promise<LeagueBracket> {
    const bracket = await bracketRepository.findByLeagueId(leagueId);
    if (!bracket) {
      throw new NotFoundError(`Chaveamento para a competição '${leagueId}' não encontrado.`);
    }
    return bracket;
  }
}

export const bracketService = new BracketService();

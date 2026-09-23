import { oddsRepository } from '../repositories/odds.repository.js';
import { MatchOddsDetail } from '../models/odds.model.js';
import { PaginatedResult, PaginationQuery } from '../models/common.js';
import { paginate } from '../utils/pagination.js';
import { NotFoundError } from '../utils/errors.js';

export class OddsService {
  public async getOdds(
    filters: { leagueId?: string; matchId?: string },
    pagination: PaginationQuery
  ): Promise<PaginatedResult<MatchOddsDetail>> {
    const odds = await oddsRepository.findAll(filters);
    return paginate(odds, pagination.page, pagination.limit);
  }

  public async getOddsByMatchId(matchId: string): Promise<MatchOddsDetail> {
    const odds = await oddsRepository.findByMatchId(matchId);
    if (!odds) {
      throw new NotFoundError(`Odds para a partida '${matchId}' não encontradas.`);
    }
    return odds;
  }
}

export const oddsService = new OddsService();

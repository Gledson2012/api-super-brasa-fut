import { standingRepository } from '../repositories/standing.repository.js';
import { LeagueStanding, StandingFilterQuery } from '../models/standing.model.js';
import { PaginatedResult, PaginationQuery } from '../models/common.js';
import { paginate } from '../utils/pagination.js';
import { NotFoundError } from '../utils/errors.js';

export class StandingService {
  public async getStandings(
    filters: StandingFilterQuery,
    pagination: PaginationQuery
  ): Promise<PaginatedResult<LeagueStanding>> {
    const standings = await standingRepository.findAll(filters);
    return paginate(standings, pagination.page, pagination.limit);
  }

  public async getStandingByLeagueId(leagueId: string): Promise<LeagueStanding> {
    const standing = await standingRepository.findByLeagueId(leagueId);
    if (!standing) {
      throw new NotFoundError(`Classificação da liga '${leagueId}' não encontrada.`);
    }
    return standing;
  }
}

export const standingService = new StandingService();

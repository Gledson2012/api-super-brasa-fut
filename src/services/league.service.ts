import { leagueRepository } from '../repositories/league.repository.js';
import { standingRepository } from '../repositories/standing.repository.js';
import { matchRepository } from '../repositories/match.repository.js';
import { teamRepository } from '../repositories/team.repository.js';
import { statsRepository } from '../repositories/stats.repository.js';
import { League, LeagueFilterQuery } from '../models/league.model.js';
import { PaginatedResult, PaginationQuery } from '../models/common.js';
import { paginate } from '../utils/pagination.js';
import { NotFoundError } from '../utils/errors.js';

export class LeagueService {
  public async getLeagues(
    filters: LeagueFilterQuery,
    pagination: PaginationQuery
  ): Promise<PaginatedResult<League>> {
    const leagues = await leagueRepository.findAll(filters);
    return paginate(leagues, pagination.page, pagination.limit);
  }

  public async getLeagueById(id: string): Promise<League> {
    const league = await leagueRepository.findById(id);
    if (!league) {
      throw new NotFoundError(`Liga com ID ou slug '${id}' não encontrada.`);
    }
    return league;
  }

  public async getLeagueStandings(leagueId: string) {
    await this.getLeagueById(leagueId); // ensure league exists
    const standings = await standingRepository.findByLeagueId(leagueId);
    if (!standings) {
      throw new NotFoundError(`Classificação não disponível para a liga '${leagueId}'.`);
    }
    return standings;
  }

  public async getLeagueMatches(
    leagueId: string,
    filters: { status?: any; round?: number; date?: string },
    pagination: PaginationQuery
  ) {
    await this.getLeagueById(leagueId); // ensure league exists
    const matches = await matchRepository.findAll({ ...filters, leagueId });
    return paginate(matches, pagination.page, pagination.limit);
  }

  public async getLeagueTeams(leagueId: string) {
    await this.getLeagueById(leagueId); // ensure league exists
    return teamRepository.findAll({ leagueId });
  }

  public async getLeagueLeaders(leagueId: string) {
    await this.getLeagueById(leagueId); // ensure league exists
    const leaders = await statsRepository.findLeadersByLeague(leagueId);
    if (!leaders) {
      throw new NotFoundError(`Estatísticas de líderes não disponíveis para a liga '${leagueId}'.`);
    }
    return leaders;
  }
}

export const leagueService = new LeagueService();

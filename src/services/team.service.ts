import { teamRepository } from '../repositories/team.repository.js';
import { matchRepository } from '../repositories/match.repository.js';
import { playerRepository } from '../repositories/player.repository.js';
import { Team, TeamFilterQuery } from '../models/team.model.js';
import { PaginatedResult, PaginationQuery } from '../models/common.js';
import { paginate } from '../utils/pagination.js';
import { NotFoundError } from '../utils/errors.js';

export class TeamService {
  public async getTeams(
    filters: TeamFilterQuery,
    pagination: PaginationQuery
  ): Promise<PaginatedResult<Team>> {
    const teams = await teamRepository.findAll(filters);
    return paginate(teams, pagination.page, pagination.limit);
  }

  public async getTeamById(id: string): Promise<Team> {
    const team = await teamRepository.findById(id);
    if (!team) {
      throw new NotFoundError(`Time com ID ou slug '${id}' não encontrado.`);
    }
    return team;
  }

  public async getTeamMatches(
    teamId: string,
    filters: { status?: any; date?: string },
    pagination: PaginationQuery
  ) {
    await this.getTeamById(teamId); // ensure team exists
    const matches = await matchRepository.findAll({ ...filters, teamId });
    return paginate(matches, pagination.page, pagination.limit);
  }

  public async getTeamSquad(teamId: string) {
    await this.getTeamById(teamId); // ensure team exists
    return playerRepository.findByTeam(teamId);
  }
}

export const teamService = new TeamService();

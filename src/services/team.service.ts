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

  public async getTeamCalendar(teamId: string) {
    const team = await this.getTeamById(teamId);
    const matches = await matchRepository.findAll({ teamId: team.id });

    // Sort chronologically
    const sorted = [...matches].sort(
      (a, b) => new Date(a.kickoffTime).getTime() - new Date(b.kickoffTime).getTime()
    );

    const pastMatches = sorted.filter((m) => m.status === 'FINISHED');
    const upcomingMatches = sorted.filter(
      (m) => m.status === 'UPCOMING' || m.status === 'LIVE' || m.status === 'HALFTIME'
    );

    let wins = 0;
    let draws = 0;
    let losses = 0;
    let goalsScored = 0;
    let goalsConceded = 0;

    for (const match of pastMatches) {
      if (match.score.home !== null && match.score.away !== null) {
        const isHome = match.homeTeam.id === team.id;
        const myScore = isHome ? match.score.home : match.score.away;
        const oppScore = isHome ? match.score.away : match.score.home;

        goalsScored += myScore;
        goalsConceded += oppScore;

        if (myScore > oppScore) wins++;
        else if (myScore === oppScore) draws++;
        else losses++;
      }
    }

    return {
      team: {
        id: team.id,
        name: team.name,
        shortName: team.shortName,
        code: team.code,
        logoUrl: team.logoUrl,
        stadium: team.stadium,
      },
      summary: {
        totalMatches: sorted.length,
        played: pastMatches.length,
        upcoming: upcomingMatches.length,
        record: {
          wins,
          draws,
          losses,
          goalsScored,
          goalsConceded,
          goalDifference: goalsScored - goalsConceded,
        },
      },
      recentResults: [...pastMatches].reverse(),
      upcomingFixtures: upcomingMatches,
      allMatches: sorted,
    };
  }
}

export const teamService = new TeamService();

import { playerRepository } from '../repositories/player.repository.js';
import { Player, PlayerFilterQuery, PlayerComparisonSummary } from '../models/player.model.js';
import { PaginatedResult, PaginationQuery } from '../models/common.js';
import { paginate } from '../utils/pagination.js';
import { NotFoundError } from '../utils/errors.js';

export class PlayerService {
  public async getPlayers(
    filters: PlayerFilterQuery,
    pagination: PaginationQuery
  ): Promise<PaginatedResult<Player>> {
    const players = await playerRepository.findAll(filters);
    return paginate(players, pagination.page, pagination.limit);
  }

  public async getPlayerById(id: string): Promise<Player> {
    const player = await playerRepository.findById(id);
    if (!player) {
      throw new NotFoundError(`Jogador com ID ou slug '${id}' não encontrado.`);
    }
    return player;
  }

  public async comparePlayers(id1: string, id2: string): Promise<PlayerComparisonSummary> {
    const player1 = await this.getPlayerById(id1);
    const player2 = await this.getPlayerById(id2);

    const summarize = (p: Player) => {
      const totals = p.stats.reduce(
        (acc, s) => {
          acc.goals += s.goals || 0;
          acc.assists += s.assists || 0;
          acc.appearances += s.appearances || 0;
          acc.minutesPlayed += s.minutesPlayed || 0;
          acc.yellowCards += s.yellowCards || 0;
          acc.redCards += s.redCards || 0;
          if (typeof s.sofascoreRating === 'number') {
            acc.ratings.push(s.sofascoreRating);
          }
          return acc;
        },
        {
          goals: 0,
          assists: 0,
          appearances: 0,
          minutesPlayed: 0,
          yellowCards: 0,
          redCards: 0,
          ratings: [] as number[],
        }
      );

      const avgRating =
        totals.ratings.length > 0
          ? Number((totals.ratings.reduce((a, b) => a + b, 0) / totals.ratings.length).toFixed(2))
          : undefined;

      const goalsPerMatch = totals.appearances > 0
        ? Number((totals.goals / totals.appearances).toFixed(2))
        : 0;
      const assistsPerMatch = totals.appearances > 0
        ? Number((totals.assists / totals.appearances).toFixed(2))
        : 0;
      const minutesPerGoal = totals.goals > 0
        ? Math.round(totals.minutesPlayed / totals.goals)
        : null;

      return {
        id: p.id,
        name: p.name,
        team: p.currentTeam.name,
        position: p.position,
        age: p.age,
        marketValueEur: p.marketValueEur,
        goals: totals.goals,
        assists: totals.assists,
        appearances: totals.appearances,
        minutesPlayed: totals.minutesPlayed,
        yellowCards: totals.yellowCards,
        redCards: totals.redCards,
        averageRating: avgRating,
        goalsPerMatch,
        assistsPerMatch,
        minutesPerGoal,
      };
    };

    const s1 = summarize(player1);
    const s2 = summarize(player2);

    const compareMetrics = (v1: number | undefined, v2: number | undefined): 'player1' | 'player2' | 'tie' => {
      const val1 = v1 || 0;
      const val2 = v2 || 0;
      if (val1 > val2) return 'player1';
      if (val2 > val1) return 'player2';
      return 'tie';
    };

    return {
      player1: s1,
      player2: s2,
      metricsComparison: {
        moreGoals: compareMetrics(s1.goals, s2.goals),
        moreAssists: compareMetrics(s1.assists, s2.assists),
        higherRating: compareMetrics(s1.averageRating, s2.averageRating),
        higherMarketValue: compareMetrics(s1.marketValueEur, s2.marketValueEur),
      },
      fullDetails: {
        player1,
        player2,
      },
    };
  }
}

export const playerService = new PlayerService();


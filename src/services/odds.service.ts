import { oddsRepository } from '../repositories/odds.repository.js';
import { MatchOddsDetail } from '../models/odds.model.js';
import { PaginatedResult, PaginationQuery } from '../models/common.js';
import { paginate } from '../utils/pagination.js';
import { NotFoundError } from '../utils/errors.js';

function calculateImpliedProbabilities(averageOdds: { homeWin: number; draw: number; awayWin: number }) {
  if (!averageOdds.homeWin || !averageOdds.draw || !averageOdds.awayWin) return undefined;
  const invHome = 1 / averageOdds.homeWin;
  const invDraw = 1 / averageOdds.draw;
  const invAway = 1 / averageOdds.awayWin;
  const total = invHome + invDraw + invAway;
  if (total <= 0) return undefined;
  return {
    homeWinPercent: Number(((invHome / total) * 100).toFixed(1)),
    drawPercent: Number(((invDraw / total) * 100).toFixed(1)),
    awayWinPercent: Number(((invAway / total) * 100).toFixed(1)),
  };
}

export class OddsService {
  public async getOdds(
    filters: { leagueId?: string; matchId?: string },
    pagination: PaginationQuery
  ): Promise<PaginatedResult<MatchOddsDetail>> {
    const rawOdds = await oddsRepository.findAll(filters);
    const odds = rawOdds.map((o) => ({
      ...o,
      impliedProbabilities: o.impliedProbabilities || calculateImpliedProbabilities(o.averageOdds),
    }));
    return paginate(odds, pagination.page, pagination.limit);
  }

  public async getOddsByMatchId(matchId: string): Promise<MatchOddsDetail> {
    const odds = await oddsRepository.findByMatchId(matchId);
    if (!odds) {
      throw new NotFoundError(`Odds para a partida '${matchId}' não encontradas.`);
    }
    return {
      ...odds,
      impliedProbabilities: odds.impliedProbabilities || calculateImpliedProbabilities(odds.averageOdds),
    };
  }
}

export const oddsService = new OddsService();

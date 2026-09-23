import { statsRepository } from '../repositories/stats.repository.js';
import { StatsLeaders, TopScorerEntry, TopAssistEntry, TopRatingEntry } from '../models/player.model.js';
import { NotFoundError } from '../utils/errors.js';

export class StatsService {
  public async getAllLeaders(): Promise<StatsLeaders[]> {
    return statsRepository.findAllLeaders();
  }

  public async getLeagueLeaders(leagueId: string): Promise<StatsLeaders> {
    const leaders = await statsRepository.findLeadersByLeague(leagueId);
    if (!leaders) {
      throw new NotFoundError(`Estatísticas para a liga '${leagueId}' não encontradas.`);
    }
    return leaders;
  }

  public async getTopScorers(leagueId: string): Promise<TopScorerEntry[]> {
    const scorers = await statsRepository.findTopScorers(leagueId);
    if (!scorers.length) {
      throw new NotFoundError(`Artilharia não encontrada para a liga '${leagueId}'.`);
    }
    return scorers;
  }

  public async getTopAssists(leagueId: string): Promise<TopAssistEntry[]> {
    const assists = await statsRepository.findTopAssists(leagueId);
    if (!assists.length) {
      throw new NotFoundError(`Líderes de assistências não encontrados para a liga '${leagueId}'.`);
    }
    return assists;
  }

  public async getTopRatings(leagueId: string): Promise<TopRatingEntry[]> {
    const ratings = await statsRepository.findTopRatings(leagueId);
    if (!ratings.length) {
      throw new NotFoundError(`Melhores avaliações não encontradas para a liga '${leagueId}'.`);
    }
    return ratings;
  }
}

export const statsService = new StatsService();

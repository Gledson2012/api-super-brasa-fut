import { StatsLeaders, TopScorerEntry, TopAssistEntry, TopRatingEntry } from '../models/player.model.js';
import { db } from './db.js';

export class StatsRepository {
  public async findAllLeaders(): Promise<StatsLeaders[]> {
    return db.statsLeaders;
  }

  public async findLeadersByLeague(leagueId: string): Promise<StatsLeaders | null> {
    const leaders = db.statsLeaders.find((s) => s.leagueId === leagueId);
    return leaders || null;
  }

  public async findTopScorers(leagueId: string): Promise<TopScorerEntry[]> {
    const leaders = await this.findLeadersByLeague(leagueId);
    return leaders ? leaders.topScorers : [];
  }

  public async findTopAssists(leagueId: string): Promise<TopAssistEntry[]> {
    const leaders = await this.findLeadersByLeague(leagueId);
    return leaders ? leaders.topAssists : [];
  }

  public async findTopRatings(leagueId: string): Promise<TopRatingEntry[]> {
    const leaders = await this.findLeadersByLeague(leagueId);
    return leaders ? leaders.topRatings : [];
  }
}

export const statsRepository = new StatsRepository();

import { League } from './league.model.js';
import { Team } from './team.model.js';
import { Player } from './player.model.js';
import { Match } from './match.model.js';
import { NewsArticle } from './news.model.js';

export type SearchEntityType = 'all' | 'leagues' | 'teams' | 'players' | 'matches' | 'news';

export interface SearchResults {
  query: string;
  totalResults: number;
  results: {
    leagues: League[];
    teams: Team[];
    players: Player[];
    matches: Match[];
    news: NewsArticle[];
  };
}

export interface SearchQueryParams {
  q?: string;
  type?: SearchEntityType;
  limit?: number;
}

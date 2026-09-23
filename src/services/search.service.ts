import { db } from '../repositories/db.js';
import { SearchResults, SearchEntityType } from '../models/search.model.js';

export class SearchService {
  public async search(query: string, type: SearchEntityType = 'all', limit = 10): Promise<SearchResults> {
    const q = (query || '').trim().toLowerCase();
    const parsedLimit = Math.max(1, Math.min(limit, 50));

    if (!q) {
      return {
        query: '',
        totalResults: 0,
        results: {
          leagues: [],
          teams: [],
          players: [],
          matches: [],
          news: [],
        },
      };
    }

    const leagues = (type === 'all' || type === 'leagues')
      ? db.leagues
          .filter(
            (l) =>
              l.name.toLowerCase().includes(q) ||
              l.originalName?.toLowerCase().includes(q) ||
              l.slug.toLowerCase().includes(q) ||
              l.country.toLowerCase().includes(q) ||
              l.countryCode.toLowerCase() === q
          )
          .slice(0, parsedLimit)
      : [];

    const teams = (type === 'all' || type === 'teams')
      ? db.teams
          .filter(
            (t) =>
              t.name.toLowerCase().includes(q) ||
              t.shortName.toLowerCase().includes(q) ||
              t.code.toLowerCase() === q ||
              t.slug.toLowerCase().includes(q) ||
              t.country.toLowerCase().includes(q) ||
              t.stadium?.city?.toLowerCase().includes(q) ||
              t.coach?.toLowerCase().includes(q)
          )
          .slice(0, parsedLimit)
      : [];

    const players = (type === 'all' || type === 'players')
      ? db.players
          .filter(
            (p) =>
              p.name.toLowerCase().includes(q) ||
              p.fullName.toLowerCase().includes(q) ||
              p.nickname?.toLowerCase().includes(q) ||
              p.slug.toLowerCase().includes(q) ||
              p.nationality.toLowerCase().includes(q) ||
              p.currentTeam.name.toLowerCase().includes(q) ||
              p.currentTeam.shortName.toLowerCase().includes(q) ||
              p.position.toLowerCase().includes(q)
          )
          .slice(0, parsedLimit)
      : [];

    const matches = (type === 'all' || type === 'matches')
      ? db.matches
          .filter(
            (m) =>
              m.homeTeam.name.toLowerCase().includes(q) ||
              m.homeTeam.shortName.toLowerCase().includes(q) ||
              m.awayTeam.name.toLowerCase().includes(q) ||
              m.awayTeam.shortName.toLowerCase().includes(q) ||
              m.leagueName.toLowerCase().includes(q) ||
              m.stadium?.toLowerCase().includes(q) ||
              m.city?.toLowerCase().includes(q)
          )
          .slice(0, parsedLimit)
      : [];

    const news = (type === 'all' || type === 'news')
      ? db.news
          .filter(
            (n) =>
              n.title.toLowerCase().includes(q) ||
              n.summary.toLowerCase().includes(q) ||
              n.category.toLowerCase().includes(q) ||
              n.tags.some((tag) => tag.toLowerCase().includes(q)) ||
              n.author?.toLowerCase().includes(q)
          )
          .slice(0, parsedLimit)
      : [];

    const totalResults =
      leagues.length + teams.length + players.length + matches.length + news.length;

    return {
      query,
      totalResults,
      results: {
        leagues,
        teams,
        players,
        matches,
        news,
      },
    };
  }
}

export const searchService = new SearchService();

import { db } from '../repositories/db.js';
import { SearchResults, SearchEntityType } from '../models/search.model.js';

function matchesText(text: string | undefined | null, query: string): boolean {
  return typeof text === 'string' && text.toLowerCase().includes(query);
}

function exactMatch(text: string | undefined | null, query: string): boolean {
  return typeof text === 'string' && text.toLowerCase() === query;
}

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
              matchesText(l.name, q) ||
              matchesText(l.originalName, q) ||
              matchesText(l.slug, q) ||
              matchesText(l.country, q) ||
              exactMatch(l.countryCode, q)
          )
          .slice(0, parsedLimit)
      : [];

    const teams = (type === 'all' || type === 'teams')
      ? db.teams
          .filter(
            (t) =>
              matchesText(t.name, q) ||
              matchesText(t.shortName, q) ||
              exactMatch(t.code, q) ||
              matchesText(t.slug, q) ||
              matchesText(t.country, q) ||
              matchesText(t.stadium?.city, q) ||
              matchesText(t.coach, q)
          )
          .slice(0, parsedLimit)
      : [];

    const players = (type === 'all' || type === 'players')
      ? db.players
          .filter(
            (p) =>
              matchesText(p.name, q) ||
              matchesText(p.fullName, q) ||
              matchesText(p.nickname, q) ||
              matchesText(p.slug, q) ||
              matchesText(p.nationality, q) ||
              matchesText(p.currentTeam?.name, q) ||
              matchesText(p.currentTeam?.shortName, q) ||
              matchesText(p.position, q)
          )
          .slice(0, parsedLimit)
      : [];

    const matches = (type === 'all' || type === 'matches')
      ? db.matches
          .filter(
            (m) =>
              matchesText(m.homeTeam?.name, q) ||
              matchesText(m.homeTeam?.shortName, q) ||
              matchesText(m.awayTeam?.name, q) ||
              matchesText(m.awayTeam?.shortName, q) ||
              matchesText(m.leagueName, q) ||
              matchesText(m.stadium, q) ||
              matchesText(m.city, q)
          )
          .slice(0, parsedLimit)
      : [];

    const news = (type === 'all' || type === 'news')
      ? db.news
          .filter(
            (n) =>
              matchesText(n.title, q) ||
              matchesText(n.summary, q) ||
              matchesText(n.category, q) ||
              (Array.isArray(n.tags) && n.tags.some((tag) => matchesText(tag, q))) ||
              matchesText(n.author, q)
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

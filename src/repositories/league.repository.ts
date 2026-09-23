import { League, LeagueFilterQuery } from '../models/league.model.js';
import { db } from './db.js';

export class LeagueRepository {
  public async findAll(filters: LeagueFilterQuery = {}): Promise<League[]> {
    let result = [...db.leagues];

    if (filters.country) {
      const countryQuery = filters.country.toLowerCase();
      result = result.filter((l) => l.country.toLowerCase().includes(countryQuery));
    }

    if (filters.tier) {
      result = result.filter((l) => l.tier === filters.tier);
    }

    if (filters.gender) {
      result = result.filter((l) => l.gender === filters.gender);
    }

    if (filters.ageCategory) {
      result = result.filter((l) => l.ageCategory === filters.ageCategory);
    }

    if (filters.isLive !== undefined) {
      const isLive = String(filters.isLive) === 'true';
      result = result.filter((l) => l.isLive === isLive || (isLive && l.hasLiveScores));
    }

    if (filters.isCup !== undefined) {
      const isCup = String(filters.isCup) === 'true';
      result = result.filter((l) => l.isCup === isCup || (isCup && l.tier === 'cup'));
    }

    if (filters.search) {
      const search = filters.search.toLowerCase();
      result = result.filter(
        (l) =>
          l.name.toLowerCase().includes(search) ||
          l.slug.toLowerCase().includes(search) ||
          l.country.toLowerCase().includes(search)
      );
    }

    return result;
  }

  public async findById(id: string): Promise<League | null> {
    const league = db.leagues.find((l) => l.id === id || l.slug === id);
    return league || null;
  }

  public async findBySlug(slug: string): Promise<League | null> {
    const league = db.leagues.find((l) => l.slug === slug);
    return league || null;
  }
}

export const leagueRepository = new LeagueRepository();

import { Team, TeamFilterQuery } from '../models/team.model.js';
import { db } from './db.js';

export class TeamRepository {
  public async findAll(filters: TeamFilterQuery = {}): Promise<Team[]> {
    let result = [...db.teams];

    if (filters.leagueId) {
      result = result.filter((t) => t.leagueId === filters.leagueId);
    }

    if (filters.country) {
      const country = filters.country.toLowerCase();
      result = result.filter((t) => t.country.toLowerCase().includes(country));
    }

    if (filters.gender) {
      result = result.filter((t) => t.gender === filters.gender);
    }

    if (filters.ageCategory) {
      result = result.filter((t) => t.ageCategory === filters.ageCategory);
    }

    if (filters.search) {
      const search = filters.search.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(search) ||
          t.shortName.toLowerCase().includes(search) ||
          t.code.toLowerCase().includes(search) ||
          t.slug.toLowerCase().includes(search)
      );
    }

    return result;
  }

  public async findById(id: string): Promise<Team | null> {
    const team = db.teams.find((t) => t.id === id || t.slug === id || t.code.toLowerCase() === id.toLowerCase());
    return team || null;
  }

  public async findBySlug(slug: string): Promise<Team | null> {
    const team = db.teams.find((t) => t.slug === slug);
    return team || null;
  }
}

export const teamRepository = new TeamRepository();

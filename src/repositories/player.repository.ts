import { Player, PlayerFilterQuery } from '../models/player.model.js';
import { db } from './db.js';

export class PlayerRepository {
  public async findAll(filters: PlayerFilterQuery = {}): Promise<Player[]> {
    let result = [...db.players];

    if (filters.teamId) {
      result = result.filter((p) => p.currentTeam.id === filters.teamId);
    }

    if (filters.nationality) {
      const nationality = filters.nationality.toLowerCase();
      result = result.filter((p) => p.nationality.toLowerCase().includes(nationality));
    }

    if (filters.position) {
      result = result.filter((p) => p.position === filters.position);
    }

    if (filters.leagueId) {
      result = result.filter((p) => p.stats.some((s) => s.leagueId === filters.leagueId));
    }

    if (filters.search) {
      const search = filters.search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(search) ||
          p.fullName.toLowerCase().includes(search) ||
          (p.nickname && p.nickname.toLowerCase().includes(search)) ||
          p.currentTeam.name.toLowerCase().includes(search)
      );
    }

    return result;
  }

  public async findById(id: string): Promise<Player | null> {
    const player = db.players.find((p) => p.id === id || p.slug === id);
    return player || null;
  }

  public async findBySlug(slug: string): Promise<Player | null> {
    const player = db.players.find((p) => p.slug === slug);
    return player || null;
  }

  public async findByTeam(teamId: string): Promise<Player[]> {
    return db.players.filter((p) => p.currentTeam.id === teamId);
  }
}

export const playerRepository = new PlayerRepository();

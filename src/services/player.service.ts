import { playerRepository } from '../repositories/player.repository.js';
import { Player, PlayerFilterQuery } from '../models/player.model.js';
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
}

export const playerService = new PlayerService();

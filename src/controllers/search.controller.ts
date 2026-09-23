import { Request, Response, NextFunction } from 'express';
import { searchService } from '../services/search.service.js';
import { SearchEntityType } from '../models/search.model.js';
import { successResponse, errorResponse } from '../utils/response.js';

export class SearchController {
  public async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { q, type, limit } = req.query;

      if (!q || typeof q !== 'string' || q.trim() === '') {
        res.status(400).json(
          errorResponse('O parâmetro de busca "q" é obrigatório.', 'MISSING_PARAM')
        );
        return;
      }

      const validTypes: SearchEntityType[] = ['all', 'leagues', 'teams', 'players', 'matches', 'news'];
      const searchType = (type && validTypes.includes(type as SearchEntityType))
        ? (type as SearchEntityType)
        : 'all';

      const parsedLimit = limit ? parseInt(limit as string, 10) : 10;
      const results = await searchService.search(q, searchType, isNaN(parsedLimit) ? 10 : parsedLimit);

      res.json(successResponse(results));
    } catch (error) {
      next(error);
    }
  }
}

export const searchController = new SearchController();

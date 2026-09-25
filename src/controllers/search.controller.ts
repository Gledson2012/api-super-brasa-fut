import { Request, Response } from 'express';
import { searchService } from '../services/search.service.js';
import { SearchEntityType } from '../models/search.model.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { asyncHandler } from '../utils/async-handler.js';

export class SearchController {
  public search = asyncHandler(async (req: Request, res: Response): Promise<void> => {
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
  });
}

export const searchController = new SearchController();

import { Request, Response } from 'express';
import { newsService } from '../services/news.service.js';
import { successResponse, sendPaginatedResponse } from '../utils/response.js';
import { asyncHandler } from '../utils/async-handler.js';

export class NewsController {
  public getAll = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { page, limit, category, tag, leagueId, teamId, search } = req.query;
    const result = await newsService.getNews(
      {
        category: category as string,
        tag: tag as string,
        leagueId: leagueId as string,
        teamId: teamId as string,
        search: search as string,
      },
      { page: page as any, limit: limit as any }
    );
    sendPaginatedResponse(res, result);
  });

  public getById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const news = await newsService.getNewsById(id);
    res.json(successResponse(news));
  });
}

export const newsController = new NewsController();

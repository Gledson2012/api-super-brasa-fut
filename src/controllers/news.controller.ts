import { Request, Response, NextFunction } from 'express';
import { newsService } from '../services/news.service.js';
import { successResponse, sendPaginatedResponse } from '../utils/response.js';

export class NewsController {
  public async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
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
    } catch (error) {
      next(error);
    }
  }

  public async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const news = await newsService.getNewsById(id);
      res.json(successResponse(news));
    } catch (error) {
      next(error);
    }
  }
}

export const newsController = new NewsController();

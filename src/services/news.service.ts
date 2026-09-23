import { newsRepository } from '../repositories/news.repository.js';
import { NewsArticle, NewsFilterQuery } from '../models/news.model.js';
import { PaginatedResult, PaginationQuery } from '../models/common.js';
import { paginate } from '../utils/pagination.js';
import { NotFoundError } from '../utils/errors.js';

export class NewsService {
  public async getNews(
    filters: NewsFilterQuery,
    pagination: PaginationQuery
  ): Promise<PaginatedResult<NewsArticle>> {
    const news = await newsRepository.findAll(filters);
    return paginate(news, pagination.page, pagination.limit);
  }

  public async getNewsById(id: string): Promise<NewsArticle> {
    const article = await newsRepository.findById(id);
    if (!article) {
      throw new NotFoundError(`Artigo de notícia com ID ou slug '${id}' não encontrado.`);
    }
    return article;
  }
}

export const newsService = new NewsService();

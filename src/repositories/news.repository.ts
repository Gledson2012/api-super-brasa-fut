import { NewsArticle, NewsFilterQuery } from '../models/news.model.js';
import { db } from './db.js';

export class NewsRepository {
  public async findAll(filters: NewsFilterQuery = {}): Promise<NewsArticle[]> {
    let result = [...db.news];

    if (filters.category) {
      result = result.filter((n) => n.category === filters.category);
    }

    if (filters.tag) {
      const tagLower = filters.tag.toLowerCase();
      result = result.filter((n) => n.tags.some((t) => t.toLowerCase() === tagLower));
    }

    if (filters.leagueId) {
      result = result.filter((n) => n.relatedLeagueId === filters.leagueId);
    }

    if (filters.teamId) {
      result = result.filter((n) => n.relatedTeamIds?.includes(filters.teamId!));
    }

    if (filters.search) {
      const search = filters.search.toLowerCase();
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(search) ||
          n.summary.toLowerCase().includes(search) ||
          n.content.toLowerCase().includes(search) ||
          n.tags.some((t) => t.toLowerCase().includes(search))
      );
    }

    // Sort by newest publication date first
    result.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    return result;
  }

  public async findById(id: string): Promise<NewsArticle | null> {
    const article = db.news.find((n) => n.id === id || n.slug === id);
    return article || null;
  }

  public async findBySlug(slug: string): Promise<NewsArticle | null> {
    const article = db.news.find((n) => n.slug === slug);
    return article || null;
  }
}

export const newsRepository = new NewsRepository();

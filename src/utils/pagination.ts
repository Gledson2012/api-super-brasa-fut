import { PaginatedResult } from '../models/common.js';
import { config } from '../config/environment.js';

export function paginate<T>(
  items: T[],
  pageParam?: number | string,
  limitParam?: number | string
): PaginatedResult<T> {
  const page = Math.max(1, parseInt(String(pageParam || 1), 10) || 1);
  let limit = Math.max(1, parseInt(String(limitParam || config.defaultLimit), 10) || config.defaultLimit);

  if (limit > config.maxLimit) {
    limit = config.maxLimit;
  }

  const total = items.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const startIndex = (page - 1) * limit;
  const endIndex = Math.min(startIndex + limit, total);
  const data = items.slice(startIndex, endIndex);

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}

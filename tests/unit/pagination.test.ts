import { describe, it, expect } from 'vitest';
import { paginate } from '../../src/utils/pagination.js';

describe('Pagination Utility', () => {
  const sampleItems = Array.from({ length: 45 }, (_, i) => ({ id: i + 1, name: `Item ${i + 1}` }));

  it('should paginate items with default page and limit', () => {
    const result = paginate(sampleItems);
    expect(result.data.length).toBe(20);
    expect(result.pagination.total).toBe(45);
    expect(result.pagination.page).toBe(1);
    expect(result.pagination.limit).toBe(20);
    expect(result.pagination.totalPages).toBe(3);
    expect(result.pagination.hasNextPage).toBe(true);
    expect(result.pagination.hasPrevPage).toBe(false);
  });

  it('should return correct subset for page 2 with custom limit', () => {
    const result = paginate(sampleItems, 2, 10);
    expect(result.data.length).toBe(10);
    expect(result.data[0].id).toBe(11);
    expect(result.pagination.page).toBe(2);
    expect(result.pagination.totalPages).toBe(5);
    expect(result.pagination.hasNextPage).toBe(true);
    expect(result.pagination.hasPrevPage).toBe(true);
  });

  it('should handle last page correctly', () => {
    const result = paginate(sampleItems, 5, 10);
    expect(result.data.length).toBe(5);
    expect(result.pagination.hasNextPage).toBe(false);
    expect(result.pagination.hasPrevPage).toBe(true);
  });
});

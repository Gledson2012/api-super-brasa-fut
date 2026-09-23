import { Response } from 'express';
import { ApiResponse, ApiErrorResponse, PaginatedResult } from '../models/common.js';

export function successResponse<T>(data: T, message?: string, meta?: Record<string, unknown>): ApiResponse<T> {
  return {
    success: true,
    data,
    ...(message && { message }),
    ...(meta && { meta }),
    timestamp: new Date().toISOString(),
  };
}

export function sendPaginatedResponse<T>(
  res: Response,
  result: PaginatedResult<T>,
  statusCode = 200
): Response {
  return res.status(statusCode).json({
    success: true,
    data: result.data,
    meta: result.pagination,
    timestamp: new Date().toISOString(),
  });
}

export function errorResponse(
  message: string,
  code = 'ERROR',
  details?: unknown
): ApiErrorResponse {
  return {
    success: false,
    error: {
      code,
      message,
      ...(details !== undefined && { details }),
    },
    timestamp: new Date().toISOString(),
  };
}

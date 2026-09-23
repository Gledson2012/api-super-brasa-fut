import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors.js';
import { errorResponse } from '../utils/response.js';
import { config } from '../config/environment.js';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    const code =
      err.statusCode === 404
        ? 'NOT_FOUND'
        : err.statusCode === 400
        ? 'BAD_REQUEST'
        : err.statusCode === 401
        ? 'UNAUTHORIZED'
        : err.statusCode === 403
        ? 'FORBIDDEN'
        : err.statusCode === 409
        ? 'CONFLICT'
        : `STATUS_${err.statusCode}`;
    res.status(err.statusCode).json(errorResponse(err.message, code, err.details));
    return;
  }

  // Handle uncaught or system errors
  const isDev = config.env === 'development';
  const message = isDev ? err.message : 'Internal server error';
  const details = isDev ? err.stack : undefined;

  res.status(500).json(errorResponse(message, 'INTERNAL_SERVER_ERROR', details));
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json(
    errorResponse(`Rota ${req.method} ${req.originalUrl} não encontrada no servidor.`, 'NOT_FOUND')
  );
}

import { Request, Response, NextFunction } from 'express';

export function cacheControl(maxAgeSeconds = 60, staleWhileRevalidate = 120) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.method === 'GET') {
      res.setHeader(
        'Cache-Control',
        `public, max-age=${maxAgeSeconds}, s-maxage=${maxAgeSeconds}, stale-while-revalidate=${staleWhileRevalidate}`
      );
    }
    next();
  };
}

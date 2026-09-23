import { describe, it, expect } from 'vitest';
import http from 'http';
import { app } from '../../src/app.js';

describe('SSE Live Stream Integration Tests', () => {
  it('GET /api/v1/matches/live/stream should set text/event-stream content type and connection keep-alive', () => {
    return new Promise<void>((resolve, reject) => {
      const server = http.createServer(app);
      server.listen(0, () => {
        const address = server.address();
        if (!address || typeof address === 'string') {
          server.close();
          return reject(new Error('Failed to get server address'));
        }

        const port = address.port;
        const req = http.get(`http://localhost:${port}/api/v1/matches/live/stream`, (res) => {
          try {
            expect(res.statusCode).toBe(200);
            expect(res.headers['content-type']).toContain('text/event-stream');
            expect(res.headers['cache-control']).toContain('no-cache');
            expect(res.headers['connection']).toBe('keep-alive');

            let receivedData = '';
            res.on('data', (chunk) => {
              receivedData += chunk.toString();
              if (receivedData.includes('event: connected') || receivedData.includes('event: matches')) {
                req.destroy();
                server.close(() => resolve());
              }
            });
          } catch (err) {
            req.destroy();
            server.close(() => reject(err));
          }
        });

        req.on('error', (err) => {
          // If destroyed purposely, don't fail
          if ((err as any).code === 'ECONNRESET') {
            return;
          }
          server.close();
          reject(err);
        });
      });
    });
  });
});

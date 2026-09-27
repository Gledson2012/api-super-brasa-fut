import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { flashscoreSyncService } from '../../src/services/flashscore-sync.service.js';
import { apiKeys } from '../../src/config/environment.js';

describe('Flashscore Sync Service & Endpoints', () => {
  describe('GET /api/v1/sync/status', () => {
    it('should return 200 with sync status and metadata', async () => {
      const res = await request(app).get('/api/v1/sync/status');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('isRunning');
      expect(res.body.data).toHaveProperty('totalSyncedMatches');
      expect(res.body.data).toHaveProperty('backgroundIntervalMinutes');
    });
  });

  describe('POST /api/v1/sync/flashscore authorization', () => {
    it('should reject request without authentication with 401', async () => {
      const res = await request(app).post('/api/v1/sync/flashscore');
      expect([401, 403]).toContain(res.status);
    });

    it('should reject request with free api key with 403', async () => {
      const res = await request(app)
        .post('/api/v1/sync/flashscore')
        .set('x-api-key', apiKeys.free);
      expect(res.status).toBe(403);
    });
  });

  describe('flashscoreSyncService HTML parser', () => {
    it('should correctly parse HTML chunks into structured match objects', () => {
      const sampleHtml = `
        <div id="score-data">
          <h4>BRASIL: Brasileirão Série B <a href="/classificacao/test/">Classificações</a></h4>
          <span>11:00</span>Criciúma - Avaí <a href="/jogo/test1234/" class="fin">3-0</a><br />
          <span class="live">Intervalo</span>CRB - Cuiabá <a href="/jogo/live5678/" class="live">1-0</a><br />
          <span>18:30</span>Fortaleza - Athletic Club <a href="/jogo/sched999/" class="sched">&nbsp;-&nbsp;</a><br />
        </div>
      `;

      const matches = flashscoreSyncService.parseHtml(sampleHtml);
      expect(matches.length).toBe(3);

      const [finished, live, upcoming] = matches;

      expect(finished.fsId).toBe('test1234');
      expect(finished.homeTeamName).toBe('Criciúma');
      expect(finished.awayTeamName).toBe('Avaí');
      expect(finished.status).toBe('FINISHED');
      expect(finished.homeScore).toBe(3);
      expect(finished.awayScore).toBe(0);

      expect(live.fsId).toBe('live5678');
      expect(live.homeTeamName).toBe('CRB');
      expect(live.awayTeamName).toBe('Cuiabá');
      expect(live.status).toBe('LIVE');
      expect(live.period).toBe('HT');
      expect(live.homeScore).toBe(1);
      expect(live.awayScore).toBe(0);

      expect(upcoming.fsId).toBe('sched999');
      expect(upcoming.homeTeamName).toBe('Fortaleza');
      expect(upcoming.awayTeamName).toBe('Athletic Club');
      expect(upcoming.status).toBe('UPCOMING');
    });
  });

  describe('POST /api/v1/sync/flashscore execution with mocked fetch', () => {
    it('should execute sync when authorized with pro key', async () => {
      const sampleHtml = `
        <div id="score-data">
          <h4>BRASIL: Brasileirão Série B</h4>
          <span>19:30</span>América-MG - Juventude <a href="/jogo/syncTest1/" class="sched">&nbsp;-&nbsp;</a><br />
        </div>
      `;

      const fetchSpy = vi.spyOn(flashscoreSyncService, 'fetchFlashscoreHtml').mockResolvedValue(sampleHtml);

      const res = await request(app)
        .post('/api/v1/sync/flashscore')
        .set('x-api-key', apiKeys.pro)
        .send({ date: 'tomorrow' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalParsed).toBe(1);

      fetchSpy.mockRestore();
    });
  });

  describe('Worker start and stop controls', () => {
    it('should start and stop the background worker via API', async () => {
      const startRes = await request(app)
        .post('/api/v1/sync/start')
        .set('x-api-key', apiKeys.pro)
        .send({ intervalMinutes: 10 });

      expect(startRes.status).toBe(200);
      expect(startRes.body.data.message).toContain('10 minutos');

      const stopRes = await request(app)
        .post('/api/v1/sync/stop')
        .set('x-api-key', apiKeys.pro);

      expect(stopRes.status).toBe(200);
      expect(stopRes.body.data.message).toContain('pausado');
    });
  });
});

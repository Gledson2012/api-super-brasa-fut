import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { sofascoreSyncService } from '../../src/services/sofascore-sync.service.js';
import { apiKeys } from '../../src/config/environment.js';

const SAMPLE_SOFASCORE_PASTE = `
[![UEFA Nations League](https://img.sofascore.com/api/v1/unique-tournament/10783/image)](https://www.sofascore.com/pt/football/tournament/europe/uefa-nations-league/10783#id:89945)

[UEFA Nations League](https://www.sofascore.com/pt/football/tournament/europe/uefa-nations-league/10783#id:89945)

[![Europe](https://img.sofascore.com/api/v1/category/1465/image)Europa](https://www.sofascore.com/pt/football/europe)

UEFA Nations League, League A, Gr. 1

[14:45\\
\\
FT\\
\\
![France](https://img.sofascore.com/api/v1/team/4481/image/small)\\
\\
França\\
\\
![Belgium](https://img.sofascore.com/api/v1/team/4717/image/small)\\
\\
Bélgica\\
\\
4\\
\\
1](https://www.sofascore.com/pt/football/match/belgium-france/GObsrUb#id:15534027) [14:45\\
\\
FT\\
\\
![Italy](https://img.sofascore.com/api/v1/team/4707/image/small)\\
\\
Itália\\
\\
![Türkiye](https://img.sofascore.com/api/v1/team/4700/image/small)\\
\\
Turquia\\
\\
3\\
\\
1](https://www.sofascore.com/pt/football/match/italy-turkiye/aUbshUb#id:15534050)

CONCACAF Nations League, League A, Grupo B

[20:00\\
\\
90+'\\
\\
![Guatemala](https://img.sofascore.com/api/v1/team/5163/image/small)\\
\\
Guatemala\\
\\
![Suriname](https://img.sofascore.com/api/v1/team/21822/image/small)\\
\\
Suriname\\
\\
1\\
\\
0](https://www.sofascore.com/pt/football/match/suriname-guatemala/ndcsxLi#id:16654828) [22:00\\
\\
-\\
\\
![Honduras](https://img.sofascore.com/api/v1/team/4827/image/small)\\
\\
Honduras\\
\\
![Jamaica](https://img.sofascore.com/api/v1/team/4769/image/small)\\
\\
Jamaica](https://www.sofascore.com/pt/football/match/honduras-jamaica/uVbsCWb#id:16654827)

[02:30\\
\\
AP\\
\\
![Ecuador](https://img.sofascore.com/api/v1/team/4757/image/small)\\
\\
Equador\\
\\
![Panama](https://img.sofascore.com/api/v1/team/5164/image/small)\\
\\
Panamá\\
\\
1(6)\\
\\
1(7)](https://www.sofascore.com/pt/football/match/panama-ecuador/hVbsodc#id:17251685)

Transferências destacadas

[![Enzo Fernández](https://img.sofascore.com/api/v1/player/974505/image)](https://www.sofascore.com/pt/football/player/enzo-fernandez/974505)

[Enzo Fernández](https://www.sofascore.com/pt/football/player/enzo-fernandez/974505)

[CHE![Chelsea](https://img.sofascore.com/api/v1/team/38/image)](https://www.sofascore.com/pt/football/team/chelsea/38 "Chelsea") [![Manchester City](https://img.sofascore.com/api/v1/team/17/image)MCI](https://www.sofascore.com/pt/football/team/manchester-city/17 "Manchester City")

145M €

[![Bradley Barcola](https://img.sofascore.com/api/v1/player/996952/image)](https://www.sofascore.com/pt/football/player/barcola-bradley/996952)

[Bradley Barcola](https://www.sofascore.com/pt/football/player/barcola-bradley/996952)

[PSG![Paris Saint-Germain](https://img.sofascore.com/api/v1/team/1644/image)](https://www.sofascore.com/pt/football/team/paris-saint-germain/1644 "Paris Saint-Germain") [![Liverpool FC](https://img.sofascore.com/api/v1/team/44/image)LIV](https://www.sofascore.com/pt/football/team/liverpool/44 "Liverpool FC")

125M €

Dois desempenhos

1

![Michael Olise](https://img.sofascore.com/api/v1/player/978838/image)![France](https://img.sofascore.com/api/v1/team/4481/image)

Michael OliseMeio-campista

2

![France](https://img.sofascore.com/api/v1/team/4481/image)

4 - 1

![Belgium](https://img.sofascore.com/api/v1/team/4717/image)

10
`;

describe('Sofascore Sync & Scraper Tests', () => {
  describe('sofascoreSyncService parser', () => {
    it('should accurately parse matches, scores, status, penalties, transfers and player ratings', () => {
      const parsed = sofascoreSyncService.parseSofascore(SAMPLE_SOFASCORE_PASTE);

      expect(parsed.matches.length).toBeGreaterThanOrEqual(4);

      // Match 1: França 4 - 1 Bélgica
      const franceMatch = parsed.matches.find((m) => m.sofascoreId === '15534027');
      expect(franceMatch).toBeDefined();
      expect(franceMatch?.homeTeam.name).toBe('France');
      expect(franceMatch?.awayTeam.name).toBe('Belgium');
      expect(franceMatch?.status).toBe('FINISHED');
      expect(franceMatch?.score?.home).toBe(4);
      expect(franceMatch?.score?.away).toBe(1);

      // Match 2: Guatemala 1 - 0 Suriname (Live 90+')
      const guatemalaMatch = parsed.matches.find((m) => m.sofascoreId === '16654828');
      expect(guatemalaMatch).toBeDefined();
      expect(guatemalaMatch?.homeTeam.name).toBe('Guatemala');
      expect(guatemalaMatch?.awayTeam.name).toBe('Suriname');
      expect(guatemalaMatch?.status).toBe('LIVE');
      expect(guatemalaMatch?.score?.home).toBe(1);
      expect(guatemalaMatch?.score?.away).toBe(0);

      // Match 3: Honduras vs Jamaica (Upcoming)
      const hondurasMatch = parsed.matches.find((m) => m.sofascoreId === '16654827');
      expect(hondurasMatch).toBeDefined();
      expect(hondurasMatch?.status).toBe('UPCOMING');
      expect(hondurasMatch?.score?.home).toBeNull();
      expect(hondurasMatch?.score?.away).toBeNull();

      // Match 4: Equador 1(6) - 1(7) Panamá (Penalties)
      const ecuadorMatch = parsed.matches.find((m) => m.sofascoreId === '17251685');
      expect(ecuadorMatch).toBeDefined();
      expect(ecuadorMatch?.score?.home).toBe(1);
      expect(ecuadorMatch?.score?.away).toBe(1);
      expect(ecuadorMatch?.score?.penalties?.home).toBe(6);
      expect(ecuadorMatch?.score?.penalties?.away).toBe(7);

      // Transfers
      expect(parsed.transfers.length).toBeGreaterThanOrEqual(2);
      expect(parsed.transfers[0].playerName).toBe('Enzo Fernández');
      expect(parsed.transfers[0].fromTeam).toBe('Chelsea');
      expect(parsed.transfers[0].toTeam).toBe('Manchester City');
      expect(parsed.transfers[0].transferFee).toBe('145M €');

      // Top Ratings
      expect(parsed.topRatings.length).toBeGreaterThanOrEqual(1);
      expect(parsed.topRatings[0].playerName).toBe('Michael Olise');
      expect(parsed.topRatings[0].rating).toBe(10);
    });
  });

  describe('Sofascore API Endpoints', () => {
    it('GET /api/v1/sync/sofascore/status should return 200 with status', async () => {
      const res = await request(app).get('/api/v1/sync/sofascore/status');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('isRunning');
      expect(res.body.data).toHaveProperty('totalSyncedMatches');
    });

    it('POST /api/v1/sync/sofascore/paste should ingest Sofascore markdown text', async () => {
      const res = await request(app)
        .post('/api/v1/sync/sofascore/paste')
        .set('x-api-key', apiKeys.pro)
        .send({ text: SAMPLE_SOFASCORE_PASTE });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.source).toBe('sofascore');
      expect(res.body.data.totalParsed).toBeGreaterThanOrEqual(4);
      expect(res.body.data.transfersCount).toBeGreaterThanOrEqual(2);
      expect(res.body.data.ratingsCount).toBeGreaterThanOrEqual(1);
    });

    it('GET /api/v1/sync/sofascore/transfers should return parsed transfer list', async () => {
      const res = await request(app).get('/api/v1/sync/sofascore/transfers');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
      expect(res.body.data[0].playerName).toBe('Enzo Fernández');
    });

    it('GET /api/v1/sync/sofascore/ratings should return top player ratings', async () => {
      const res = await request(app).get('/api/v1/sync/sofascore/ratings');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].playerName).toBe('Michael Olise');
      expect(res.body.data[0].rating).toBe(10);
    });

    it('GET /api/v1/matches/:id should retrieve ingested Sofascore match', async () => {
      const res = await request(app).get('/api/v1/matches/match-sofa-15534027');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.score.home).toBe(4);
      expect(res.body.data.score.away).toBe(1);
      expect(res.body.data.sofascoreId).toBe('15534027');
    });

    it('POST /api/v1/sync/sofascore without Pro key should return 403', async () => {
      const res = await request(app).post('/api/v1/sync/sofascore').send({ text: 'sample' });
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });
});

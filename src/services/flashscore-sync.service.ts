import { db } from '../repositories/db.js';
import { Match, MatchStatus } from '../models/match.model.js';
import { Team } from '../models/team.model.js';
import { League } from '../models/league.model.js';
import { FlashscoreParsedMatch, FlashscoreSyncResult, FlashscoreSyncStatus } from '../models/sync.model.js';
import { todayInTimeZone, tomorrowInTimeZone, yesterdayInTimeZone } from '../utils/date.js';
import { slugify } from '../utils/slug.js';
import { webhookService } from './webhook.service.js';
import { config } from '../config/environment.js';

const KNOWN_LEAGUES_MAP: Record<string, string> = {
  'brasileirao serie a': 'bra-serie-a-2026',
  'brasileirao serie b': 'bra-serie-b-2026',
  'copa do brasil': 'bra-copa-do-brasil-2026',
  'brasileirao sub-17': 'bra-sub-17-2026',
  'laliga': 'esp-laliga-2026',
  'premier league': 'eng-premier-league-2026',
  'serie a': 'ita-serie-a-2026',
  'bundesliga': 'ger-bundesliga-2026',
  'copa libertadores': 'conmebol-libertadores-2026',
  'copa sul-americana': 'conmebol-sudamericana-2026',
  'copa chile': 'chi-copa-chile-2026',
  'primeira a': 'col-primera-a-2026',
  'copa do mundo feminina sub-20': 'fifa-wwc-u20-2026',
  'eliminatorias copa do mundo': 'conmebol-wc-qualifiers-2026',
};

export class FlashscoreSyncService {
  private static instance: FlashscoreSyncService;
  private syncTimer: NodeJS.Timeout | null = null;
  private isSyncing = false;

  private status: FlashscoreSyncStatus = {
    lastSyncAt: null,
    lastSuccessAt: null,
    lastDurationMs: 0,
    totalSyncedMatches: 0,
    isRunning: false,
    backgroundIntervalMinutes: 5,
    lastError: null,
  };

  public static getInstance(): FlashscoreSyncService {
    if (!FlashscoreSyncService.instance) {
      FlashscoreSyncService.instance = new FlashscoreSyncService();
    }
    return FlashscoreSyncService.instance;
  }

  public getStatus(): FlashscoreSyncStatus {
    return {
      ...this.status,
      isRunning: this.syncTimer !== null || this.isSyncing,
      totalSyncedMatches: db.matches.filter((m) => m.flashscoreUrl || m.id.startsWith('match-fs-')).length,
    };
  }

  /**
   * Baixa a página HTML do Flashscore mobile.
   */
  public async fetchFlashscoreHtml(queryPath: string = ''): Promise<string> {
    const url = `https://m.flashscore.com.br/${queryPath}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'no-cache',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      throw new Error(`Falha na requisição ao Flashscore (${url}): HTTP ${response.status} ${response.statusText}`);
    }

    return await response.text();
  }

  /**
   * Analisador de HTML da estrutura do Flashscore mobile.
   */
  public parseHtml(html: string): FlashscoreParsedMatch[] {
    const scoreDataIdx = html.indexOf('id="score-data"');
    if (scoreDataIdx === -1) return [];
    const scoreData = html.slice(scoreDataIdx);

    const h4Regex = /<h4>([\s\S]*?)<\/h4>([\s\S]*?)(?=<h4>|<\/div>|$)/g;
    let sectionMatch: RegExpExecArray | null;
    const parsedMatches: FlashscoreParsedMatch[] = [];

    while ((sectionMatch = h4Regex.exec(scoreData)) !== null) {
      const rawHeader = sectionMatch[1].replace(/<[^>]+>/g, '').trim();
      const headerClean = rawHeader.replace(/Classificaç[õo]es/i, '').trim();
      const parts = headerClean.split(':');
      const country = parts[0]?.trim() || 'Mundo';
      const leagueName = parts.slice(1).join(':').trim() || headerClean;

      const body = sectionMatch[2];
      const matchLines = body.split(/<br\s*\/?>/i);

      for (const line of matchLines) {
        if (!line.includes('/jogo/')) continue;

        const linkMatch = line.match(/href="\/jogo\/([a-zA-Z0-9]+)\/?(?:\?[^"]*)?"(?:\s+class="([^"]+)")?/);
        if (!linkMatch) continue;
        const fsId = linkMatch[1];
        const linkClass = linkMatch[2] || '';

        const spanMatch = line.match(/<span(?: class="([^"]+)")?>([\s\S]*?)<\/span>/);
        const spanClass = spanMatch ? spanMatch[1] || '' : '';
        const spanText = spanMatch ? spanMatch[2].replace(/<[^>]+>/g, '').trim() : '';

        const scoreMatch = line.match(/>([^<]+)<\/a>/);
        const scoreText = scoreMatch ? scoreMatch[1].replace(/&nbsp;/g, '').trim() : '';

        let teamText = line
          .replace(/<span[\s\S]*?<\/span>/g, '')
          .replace(/<a[\s\S]*$/, '')
          .replace(/<img[^>]*>/g, '')
          .replace(/<[^>]+>/g, '')
          .trim();

        let teamParts = teamText.split(/\s+-\s+/);
        if (teamParts.length < 2) {
          teamParts = teamText.split(/\s*-\s*/);
        }
        if (teamParts.length < 2) continue;
        const homeTeamName = teamParts[0].trim();
        const awayTeamName = teamParts.slice(1).join(' - ').trim();

        let status: MatchStatus = 'UPCOMING';
        let minute: number | undefined;
        let period: '1H' | 'HT' | '2H' | 'ET' | 'P' | 'FT' | undefined;
        let homeScore: number | undefined;
        let awayScore: number | undefined;

        if (linkClass === 'live' || spanClass.includes('live')) {
          status = 'LIVE';
          if (spanText.includes('Intervalo')) {
            period = 'HT';
            minute = 45;
          } else if (spanText.includes("'")) {
            minute = parseInt(spanText.replace("'", ''), 10) || 45;
            period = minute > 45 ? '2H' : '1H';
          }
        } else if (linkClass === 'sched' || (scoreText.includes('-') && (scoreText === '-' || scoreText === ''))) {
          status = 'UPCOMING';
        } else if (linkClass === 'fin' || (scoreText.includes('-') && !scoreText.includes('&nbsp;'))) {
          status = 'FINISHED';
          minute = 90;
          period = 'FT';
        }

        if (scoreText.includes('-') && scoreText !== '-' && !scoreText.includes('&nbsp;')) {
          const rawScores = scoreText.split('-');
          const h = parseInt(rawScores[0].trim().replace(/\D/g, ''), 10);
          const a = parseInt(rawScores[1].trim().replace(/\D/g, ''), 10);
          if (!isNaN(h) && !isNaN(a)) {
            homeScore = h;
            awayScore = a;
          }
        }

        parsedMatches.push({
          fsId,
          country,
          leagueName,
          homeTeamName,
          awayTeamName,
          status,
          minute,
          period,
          homeScore,
          awayScore,
          timeStr: spanText.match(/\d{2}:\d{2}/) ? spanText : undefined,
          flashscoreUrl: `https://www.flashscore.com.br/jogo/${fsId}/`,
        });
      }
    }

    return parsedMatches;
  }

  /**
   * Localiza ou cria a liga correspondente.
   */
  private resolveLeague(country: string, leagueName: string): string {
    const normalizedName = slugify(leagueName);

    for (const [key, id] of Object.entries(KNOWN_LEAGUES_MAP)) {
      if (normalizedName.includes(key) || key.includes(normalizedName)) {
        const found = db.leagues.find((l) => l.id === id);
        if (found) return found.id;
      }
    }

    // Procura por nome exato ou país existente
    const match = db.leagues.find(
      (l) => slugify(l.name).includes(normalizedName) || slugify(l.originalName || '').includes(normalizedName)
    );
    if (match) return match.id;

    // Cria nova liga dinamica
    const leagueId = `fs-${slugify(country)}-${slugify(leagueName)}-2026`;
    const existing = db.leagues.find((l) => l.id === leagueId);
    if (existing) return existing.id;

    const newLeague: League = {
      id: leagueId,
      slug: slugify(`${country}-${leagueName}`),
      name: `${leagueName} (${country})`,
      originalName: leagueName,
      country,
      countryCode: country.slice(0, 3).toUpperCase(),
      flagUrl: 'https://static.flashscore.com/res/image/data/default-flag.png',
      logoUrl: 'https://static.flashscore.com/res/image/data/default-league.png',
      tier: 'other',
      gender: leagueName.toLowerCase().includes('femin') ? 'women' : 'men',
      ageCategory:
        leagueName.toLowerCase().includes('sub-') || leagueName.toLowerCase().includes('u20') ? 'u17' : 'senior',
      season: '2026',
      hasStandings: false,
      hasLiveScores: true,
      totalTeams: 20,
      currentRound: 'Fase Regular',
      source: 'flashscore',
    };

    db.leagues.push(newLeague);
    return newLeague.id;
  }

  /**
   * Localiza ou cria a equipe correspondente.
   */
  private resolveTeam(teamName: string, country: string, leagueId: string): Team {
    const slugName = slugify(teamName);
    const existing = db.teams.find(
      (t) =>
        t.id === slugName ||
        slugify(t.name) === slugName ||
        slugify(t.shortName || '') === slugName ||
        slugify(t.name).includes(slugName) ||
        slugName.includes(slugify(t.shortName || ''))
    );

    if (existing) {
      return existing;
    }

    const teamId = slugName || `team-${Date.now()}`;
    const code =
      teamName
        .replace(/[^a-zA-Z]/g, '')
        .slice(0, 3)
        .toUpperCase() || 'TIM';

    const newTeam: Team = {
      id: teamId,
      slug: teamId,
      name: teamName,
      shortName: teamName,
      code,
      gender: 'men',
      ageCategory: 'senior',
      country,
      countryCode: country.slice(0, 3).toUpperCase(),
      leagueId,
      leagueName: leagueId,
      logoUrl: `https://static.flashscore.com/res/image/data/${teamId}.png`,
      stadium: {
        name: `Estádio Municipal de ${teamName}`,
        city: teamName,
        capacity: 15000,
      },
      founded: 1950,
      coach: 'Comissão Técnica',
      marketValueEur: 5000000,
      stats: {
        matchesPlayed: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsScored: 0,
        goalsConceded: 0,
        cleanSheets: 0,
      },
    };

    db.teams.push(newTeam);
    return newTeam;
  }

  /**
   * Calcula a data ISO UTC estimada a partir da data de referência e horário local (BRT).
   */
  private calculateKickoffTime(targetDateStr: string, timeStr?: string): string {
    if (!timeStr || !timeStr.includes(':')) {
      return `${targetDateStr}T19:00:00Z`;
    }
    const [h, m] = timeStr.split(':').map((s) => parseInt(s, 10));
    // BRT = UTC-3. Horário UTC = BRT + 3h.
    const utcH = (h + 3) % 24;
    const utcDateStr = h + 3 >= 24 ? tomorrowInTimeZone('UTC', new Date(`${targetDateStr}T00:00:00Z`)) : targetDateStr;
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${utcDateStr}T${pad(utcH)}:${pad(m)}:00Z`;
  }

  /**
   * Sincroniza partidas a partir de uma data ou offset do Flashscore.
   */
  public async syncMatches(
    queryPath: string = '',
    targetDateStr: string = todayInTimeZone()
  ): Promise<FlashscoreSyncResult> {
    const startTime = Date.now();
    this.status.isRunning = true;

    const result: FlashscoreSyncResult = {
      date: targetDateStr,
      totalParsed: 0,
      newMatches: 0,
      updatedMatches: 0,
      newTeams: 0,
      newLeagues: 0,
      errors: [],
      durationMs: 0,
    };

    try {
      const initialLeaguesCount = db.leagues.length;
      const initialTeamsCount = db.teams.length;

      const html = await this.fetchFlashscoreHtml(queryPath);
      const parsedMatches = this.parseHtml(html);
      result.totalParsed = parsedMatches.length;

      for (const item of parsedMatches) {
        try {
          const leagueId = this.resolveLeague(item.country, item.leagueName);
          const homeTeam = this.resolveTeam(item.homeTeamName, item.country, leagueId);
          const awayTeam = this.resolveTeam(item.awayTeamName, item.country, leagueId);

          // Procura partida existente
          const existingIdx = db.matches.findIndex(
            (m) =>
              (m.flashscoreUrl && m.flashscoreUrl.includes(item.fsId)) ||
              m.id === `match-fs-${item.fsId}` ||
              (m.homeTeam.id === homeTeam.id &&
                m.awayTeam.id === awayTeam.id &&
                m.kickoffTime.startsWith(targetDateStr))
          );

          if (existingIdx !== -1) {
            const existing = db.matches[existingIdx];
            const previousScore = { ...existing.score };
            const previousStatus = existing.status;

            const homeScore = item.homeScore ?? existing.score?.home ?? 0;
            const awayScore = item.awayScore ?? existing.score?.away ?? 0;

            db.matches[existingIdx] = {
              ...existing,
              status: item.status,
              minute: item.minute ?? existing.minute,
              period: item.period ?? existing.period,
              flashscoreUrl: item.flashscoreUrl,
              score: {
                home: homeScore,
                away: awayScore,
                fulltime:
                  item.status === 'FINISHED'
                    ? { home: homeScore, away: awayScore }
                    : existing.score?.fulltime,
                halftime:
                  item.period === 'HT' || item.period === '2H' || item.status === 'FINISHED'
                    ? { home: homeScore, away: awayScore }
                    : existing.score?.halftime,
              },
            };

            result.updatedMatches++;

            // Dispara Webhooks se houve mudança de status ou gol
            if (previousStatus !== item.status) {
              webhookService
                .notify('MATCH_STATUS_CHANGE', {
                  matchId: existing.id,
                  matchSlug: existing.slug,
                  status: item.status,
                  previousStatus,
                  score: db.matches[existingIdx].score,
                })
                .catch(() => {});
            }

            if (
              item.status === 'LIVE' &&
              ((homeScore > (previousScore.home || 0)) || (awayScore > (previousScore.away || 0)))
            ) {
              webhookService
                .notify('GOAL', {
                  matchId: existing.id,
                  score: db.matches[existingIdx].score,
                })
                .catch(() => {});
            }
          } else {
            // Insere nova partida
            const matchId = `match-fs-${item.fsId}`;
            const kickoffTime = this.calculateKickoffTime(targetDateStr, item.timeStr);
            const homeScore = item.homeScore ?? 0;
            const awayScore = item.awayScore ?? 0;

            const newMatch: Match = {
              id: matchId,
              slug: `${slugify(item.homeTeamName)}-vs-${slugify(item.awayTeamName)}-2026`,
              leagueId,
              leagueName: `${item.leagueName} (${item.country})`,
              leagueCountry: item.country,
              leagueRound: 1,
              season: '2026',
              status: item.status,
              minute: item.minute,
              period: item.period,
              kickoffTime,
              stadium: homeTeam.stadium?.name || `Estádio de ${item.homeTeamName}`,
              city: homeTeam.stadium?.city || item.homeTeamName,
              gender: 'men',
              ageCategory: 'senior',
              flashscoreUrl: item.flashscoreUrl,
              homeTeam: {
                id: homeTeam.id,
                name: homeTeam.name,
                shortName: homeTeam.shortName,
                code: homeTeam.code,
                logoUrl: homeTeam.logoUrl,
              },
              awayTeam: {
                id: awayTeam.id,
                name: awayTeam.name,
                shortName: awayTeam.shortName,
                code: awayTeam.code,
                logoUrl: awayTeam.logoUrl,
              },
              score: {
                home: homeScore,
                away: awayScore,
                fulltime: item.status === 'FINISHED' ? { home: homeScore, away: awayScore } : undefined,
                halftime:
                  item.period === 'HT' || item.period === '2H' || item.status === 'FINISHED'
                    ? { home: homeScore, away: awayScore }
                    : undefined,
              },
            };

            db.matches.push(newMatch);
            result.newMatches++;
          }
        } catch (itemErr: any) {
          result.errors.push(`Erro ao processar ${item.homeTeamName} x ${item.awayTeamName}: ${itemErr.message}`);
        }
      }

      result.newLeagues = db.leagues.length - initialLeaguesCount;
      result.newTeams = db.teams.length - initialTeamsCount;

      // Persiste estado
      if (result.newMatches > 0 || result.updatedMatches > 0) {
        db.persist('matches');
      }
      if (result.newTeams > 0) {
        db.persist('teams');
      }
      if (result.newLeagues > 0) {
        db.persist('leagues');
      }

      const durationMs = Date.now() - startTime;
      result.durationMs = durationMs;

      this.status.lastSyncAt = new Date().toISOString();
      this.status.lastSuccessAt = new Date().toISOString();
      this.status.lastDurationMs = durationMs;
      this.status.lastError = null;

      return result;
    } catch (err: any) {
      const durationMs = Date.now() - startTime;
      result.durationMs = durationMs;
      result.errors.push(err.message);
      this.status.lastSyncAt = new Date().toISOString();
      this.status.lastError = err.message;
      return result;
    } finally {
      this.status.isRunning = false;
    }
  }

  /**
   * Sincroniza a grade completa: Ontem, Hoje e Amanhã + Jogos Ao Vivo.
   */
  public async syncAll(): Promise<Record<string, FlashscoreSyncResult>> {
    const today = todayInTimeZone();
    const tomorrow = tomorrowInTimeZone();
    const yesterday = yesterdayInTimeZone();

    const [resToday, resTomorrow, resYesterday, resLive] = await Promise.all([
      this.syncMatches('', today),
      this.syncMatches('?d=1', tomorrow),
      this.syncMatches('?d=-1', yesterday),
      this.syncMatches('?s=2', today),
    ]);

    return {
      today: resToday,
      tomorrow: resTomorrow,
      yesterday: resYesterday,
      live: resLive,
    };
  }

  /**
   * Inicia o worker em segundo plano para ingestão contínua.
   */
  public startBackgroundSync(intervalMinutes: number = 5): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    this.status.backgroundIntervalMinutes = intervalMinutes;
    const intervalMs = Math.max(intervalMinutes * 60 * 1000, 60000);

    this.syncTimer = setInterval(() => {
      if (this.isSyncing) return;
      this.isSyncing = true;
      this.syncMatches('?s=2', todayInTimeZone()) // Atualiza jogos ao vivo
        .then(() => this.syncMatches('', todayInTimeZone())) // Atualiza grade do dia
        .catch((err) => console.error('Erro na sincronização em background do Flashscore:', err.message))
        .finally(() => {
          this.isSyncing = false;
        });
    }, intervalMs);

    this.syncTimer.unref?.();
    console.log(`📡 Flashscore Sync Worker ativo (intervalo: ${intervalMinutes} minutos).`);
  }

  /**
   * Para o worker em segundo plano.
   */
  public stopBackgroundSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
      console.log('🛑 Flashscore Sync Worker pausado.');
    }
  }
}

export const flashscoreSyncService = FlashscoreSyncService.getInstance();

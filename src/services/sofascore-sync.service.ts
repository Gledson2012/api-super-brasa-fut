import { db } from '../repositories/db.js';
import { Match, MatchStatus } from '../models/match.model.js';
import { Team } from '../models/team.model.js';
import { League } from '../models/league.model.js';
import {
  SofascoreParsedMatch,
  SofascoreParsedTransfer,
  SofascoreParsedRating,
  SofascoreSyncResult,
  SofascoreSyncStatus,
} from '../models/sync.model.js';
import { todayInTimeZone, tomorrowInTimeZone } from '../utils/date.js';
import { slugify } from '../utils/slug.js';
import { webhookService } from './webhook.service.js';

const KNOWN_SOFASCORE_LEAGUES_MAP: Record<string, string> = {
  'brasileirao serie a': 'bra-serie-a-2026',
  'brasileirao serie b': 'bra-serie-b-2026',
  'campeonato brasileiro serie a': 'bra-serie-a-2026',
  'campeonato brasileiro serie b': 'bra-serie-b-2026',
  'copa do brasil': 'bra-copa-do-brasil-2026',
  'uefa nations league': 'uefa-nations-league-2026',
  'laliga': 'esp-laliga-2026',
  'laliga 2': 'esp-laliga-2-2026',
  'premier league': 'eng-premier-league-2026',
  'serie a': 'ita-serie-a-2026',
  'bundesliga': 'ger-bundesliga-2026',
  'copa libertadores': 'conmebol-libertadores-2026',
  'copa sul-americana': 'conmebol-sudamericana-2026',
  'concacaf nations league': 'concacaf-nations-league-2026',
  'primera division clausura': 'par-primera-division-2026',
  'liga profesional': 'arg-liga-profesional-2026',
  'liga profesional clausura': 'arg-liga-profesional-2026',
  'international friendly games': 'int-friendly-games-2026',
  'club friendly games': 'club-friendly-games-2026',
  'afghanistan champions league': 'afg-champions-league-2026',
  'u23 africa cup of nations': 'caf-u23-cup-2026',
  'caf olympic qualification': 'caf-olympic-qual-women-2026',
};

export class SofascoreSyncService {
  private static instance: SofascoreSyncService;
  private syncTimer: NodeJS.Timeout | null = null;
  private isSyncing = false;

  private transfers: SofascoreParsedTransfer[] = [];
  private topRatings: SofascoreParsedRating[] = [];

  private status: SofascoreSyncStatus = {
    lastSyncAt: null,
    lastSuccessAt: null,
    lastDurationMs: 0,
    totalSyncedMatches: 0,
    totalTransfers: 0,
    totalTopRatings: 0,
    isRunning: false,
    backgroundIntervalMinutes: 5,
    lastError: null,
  };

  public static getInstance(): SofascoreSyncService {
    if (!SofascoreSyncService.instance) {
      SofascoreSyncService.instance = new SofascoreSyncService();
    }
    return SofascoreSyncService.instance;
  }

  public getStatus(): SofascoreSyncStatus {
    return {
      ...this.status,
      totalSyncedMatches: db.matches.filter((m) => m.sofascoreUrl || m.id.startsWith('match-sofa-')).length,
      totalTransfers: this.transfers.length,
      totalTopRatings: this.topRatings.length,
    };
  }

  public getTransfers(): SofascoreParsedTransfer[] {
    return this.transfers;
  }

  public getTopRatings(): SofascoreParsedRating[] {
    return this.topRatings;
  }

  /**
   * Baixa a página HTML ou dados públicos do Sofascore.
   */
  public async fetchSofascoreHtml(path: string = 'pt/football'): Promise<string> {
    const url = `https://www.sofascore.com/${path}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'no-cache',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      throw new Error(`Falha na requisição ao Sofascore (${url}): HTTP ${response.status} ${response.statusText}`);
    }

    return await response.text();
  }

  /**
   * Analisador de texto / markdown / HTML do Sofascore.
   * Converte texto copiado do Sofascore em estruturas de partidas, transferências e notas.
   */
  public parseSofascore(content: string): {
    matches: SofascoreParsedMatch[];
    transfers: SofascoreParsedTransfer[];
    topRatings: SofascoreParsedRating[];
  } {
    const matches: SofascoreParsedMatch[] = [];
    const transfers: SofascoreParsedTransfer[] = [];
    const topRatings: SofascoreParsedRating[] = [];

    // Limpa escape de barras invertidas comuns em markdown colado
    const normalized = content.replace(/\\+/g, '\n');

    // 1. Extração de Transferências Destacadas
    const transferSectionRegex = /Transferências destacadas([\s\S]*?)(?=RankingFIFA|Dois desempenhos|Sobre|$)/i;
    const transferSectionMatch = normalized.match(transferSectionRegex);
    if (transferSectionMatch) {
      const transferBody = transferSectionMatch[1];
      // Localiza cada bloco de jogador por imagem de player do Sofascore
      const playerImgMatches = Array.from(
        transferBody.matchAll(
          /!\[([^\]]+)\]\((https:\/\/img\.sofascore\.com\/api\/v1\/player\/(\d+)\/image)\)/gi
        )
      );

      for (let i = 0; i < playerImgMatches.length; i++) {
        const pMatch = playerImgMatches[i];
        const startIndex = pMatch.index!;
        const nextIndex =
          i + 1 < playerImgMatches.length ? playerImgMatches[i + 1].index! : transferBody.length;
        const block = transferBody.slice(startIndex, nextIndex);

        const playerName = pMatch[1].trim();
        const playerImageUrl = pMatch[2];
        const playerId = pMatch[3];

        // Extrai imagens de times no bloco
        const teamMatches = Array.from(
          block.matchAll(
            /!\[([^\]]+)\]\((https:\/\/img\.sofascore\.com\/api\/v1\/team\/(\d+)\/image[^\)]*)\)/gi
          )
        );

        if (teamMatches.length >= 2) {
          const fromTeamName = teamMatches[0][1].trim();
          const fromTeamLogo = teamMatches[0][2];
          const toTeamName = teamMatches[1][1].trim();
          const toTeamLogo = teamMatches[1][2];

          // Extrai valor da transferência
          const feeMatch = block.match(/(\d+(?:\.\d+)?\s*[MKmk]?\s*€|\d+(?:[.,]\d+)?\s*(?:mi|mil|M|K)\s*€|Grátis|Empréstimo|Free)/i);
          const transferFee = feeMatch ? feeMatch[1].trim() : 'Não informado';

          transfers.push({
            playerName,
            playerId,
            playerImageUrl,
            fromTeam: fromTeamName,
            fromTeamLogo,
            toTeam: toTeamName,
            toTeamLogo,
            transferFee,
          });
        }
      }
    }

    // 2. Extração de Destaques de Desempenho / Notas (Ratings)
    const ratingSectionRegex = /Dois desempenhos([\s\S]*?)(?=Mostrar mais|Comparar jogadores|Odds em destaque|$)/i;
    const ratingSectionMatch = normalized.match(ratingSectionRegex);
    if (ratingSectionMatch) {
      const ratingBody = ratingSectionMatch[1];
      const playerMatches = Array.from(
        ratingBody.matchAll(
          /!\[([^\]]+)\]\((https:\/\/img\.sofascore\.com\/api\/v1\/player\/(\d+)\/image)\)/gi
        )
      );

      for (let i = 0; i < playerMatches.length; i++) {
        const pMatch = playerMatches[i];
        const startIndex = pMatch.index!;
        const nextIndex =
          i + 1 < playerMatches.length ? playerMatches[i + 1].index! : ratingBody.length;
        const block = ratingBody.slice(startIndex, nextIndex);

        const playerName = pMatch[1].trim();
        const playerImageUrl = pMatch[2];
        const playerId = pMatch[3];

        // Extrai time do jogador
        const teamMatch = block.match(
          /!\[([^\]]+)\]\((https:\/\/img\.sofascore\.com\/api\/v1\/team\/(\d+)\/image[^\)]*)\)/i
        );

        // Extrai posição
        const posMatch = block.match(/(Meio-campista|Atacante|Defensor|Goleiro|Lateral|Zagueiro|Volante)/i);

        // Extrai nota (ex: 10, 9.5, 8.4) no final do card do jogador
        const blockLines = block
          .split('\n')
          .map((l) => l.trim())
          .filter((l) => l.length > 0);
        let ratingVal = 0;

        for (let j = blockLines.length - 1; j >= 0; j--) {
          const line = blockLines[j];
          const rMatch = line.match(/^(10(?:\.0)?|[5-9](?:\.[0-9]+)?)$/);
          if (rMatch) {
            ratingVal = parseFloat(rMatch[1]);
            break;
          }
        }

        if (ratingVal === 0) {
          const fallbackMatch = block.match(/\b(10(?:\.0)?|[5-9]\.[0-9]+)\b/);
          if (fallbackMatch) {
            ratingVal = parseFloat(fallbackMatch[1]);
          }
        }

        if (ratingVal > 0) {
          topRatings.push({
            playerName,
            playerId,
            playerImageUrl,
            teamName: teamMatch ? teamMatch[1].trim() : undefined,
            teamLogo: teamMatch ? teamMatch[2] : undefined,
            position: posMatch ? posMatch[1].trim() : undefined,
            rating: ratingVal,
          });
        }
      }
    }

    // 3. Extração das Partidas e Ligas
    let currentTournament = 'Futebol Internacional';
    let currentCountry = 'Mundo';
    let currentRoundGroup: string | undefined;

    // Itera por blocos de partidas no formato markdown do Sofascore
    const matchBlockRegex =
      /\[((?:!\[[^\]]*\]\([^\)]*\)|[^\[\]])+)\]\((https:\/\/www\.sofascore\.com\/(?:[a-z]{2}\/)?football\/match\/([^#\)]+)#id:(\d+))\)/gi;

    let mMatch: RegExpExecArray | null;
    while ((mMatch = matchBlockRegex.exec(normalized)) !== null) {
      const innerText = mMatch[1];
      const matchUrl = mMatch[2];
      const matchSlug = mMatch[3];
      const sofascoreId = mMatch[4];

      // Procura contexto de liga antes da posição do match
      const preText = normalized.slice(Math.max(0, mMatch.index - 1000), mMatch.index);

      // Torneio no formato: [Tournament Name](https://www.sofascore.com/.../tournament/.../id:xxx)
      const tournamentMatches = Array.from(
        preText.matchAll(
          /\[([^\]]+)\]\(https:\/\/www\.sofascore\.com\/[^\)]*\/tournament\/([^\/]+)\/([^\/]+)\/(\d+)[^\)]*\)/gi
        )
      );
      if (tournamentMatches.length > 0) {
        const lastTourn = tournamentMatches[tournamentMatches.length - 1];
        currentTournament = lastTourn[1].trim();
        const countrySlug = lastTourn[2];
        currentCountry = countrySlug.charAt(0).toUpperCase() + countrySlug.slice(1);
      }

      // Grupo ou fase: UEFA Nations League, League A, Gr. 1
      const groupMatches = Array.from(
        preText.matchAll(
          /((?:UEFA|CONCACAF|Liga|Primera|Copa)[^\n]{3,60}(?:Gr\.|Grupo|League|Clausura|Abertura)[^\n]*)/gi
        )
      );
      if (groupMatches.length > 0) {
        currentRoundGroup = groupMatches[groupMatches.length - 1][1].trim();
      }

      // Extrai os times e logos de dentro do bloco
      const teamImgRegex = /!\[([^\]]*)\]\((https:\/\/img\.sofascore\.com\/api\/v1\/team\/(\d+)\/image[^\)]*)\)/gi;
      const teamImages: { name: string; url: string; id: string }[] = [];
      let tImg: RegExpExecArray | null;
      while ((tImg = teamImgRegex.exec(innerText)) !== null) {
        teamImages.push({
          name: tImg[1].trim(),
          url: tImg[2],
          id: tImg[3],
        });
      }

      if (teamImages.length < 2) continue;

      const homeTeamInfo = teamImages[0];
      const awayTeamInfo = teamImages[1];

      // Extrai linhas de texto do bloco interno
      const innerLines = innerText
        .replace(/!\[[^\]]*\]\([^\)]*\)/g, '') // remove imagens
        .split('\n')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      // Extrai horário / status
      let timeStr: string | undefined;
      let status: MatchStatus = 'FINISHED';
      let minute: number | undefined;
      let period: '1H' | 'HT' | '2H' | 'ET' | 'P' | 'FT' | undefined;
      let homeScore: number | null = null;
      let awayScore: number | null = null;
      let homePens: number | undefined;
      let awayPens: number | undefined;

      const headerLine = innerLines[0] || '';
      const timeExtract = headerLine.match(/\b(\d{1,2}:\d{2})\b/);
      if (timeExtract) {
        timeStr = timeExtract[1];
      }

      const isLive = innerLines.some((l) => l.includes("'") || l.toLowerCase().includes('ao vivo') || l.includes('90+'));
      const isFT = innerLines.some((l) => l === 'FT' || l === 'AP' || l === 'Finalizado');
      const isUpcoming = innerLines.some((l) => l === '-' || l.includes('qui.') || l.includes('Amanhã') || l.match(/\d{2}\/\d{2}\/\d{4}/));

      if (isLive) {
        status = 'LIVE';
        const minuteMatch = innerText.match(/(\d+)\+?'/);
        minute = minuteMatch ? parseInt(minuteMatch[1], 10) : 75;
        period = minute > 45 ? '2H' : '1H';
      } else if (isUpcoming) {
        status = 'UPCOMING';
      } else if (isFT) {
        status = 'FINISHED';
        minute = 90;
        period = 'FT';
      }

      // Extrai placar numérico
      const scoreCandidates: number[] = [];
      for (const line of innerLines) {
        const penMatch = line.match(/(\d+)\((\d+)\)/);
        if (penMatch) {
          scoreCandidates.push(parseInt(penMatch[1], 10));
          if (homePens === undefined) homePens = parseInt(penMatch[2], 10);
          else awayPens = parseInt(penMatch[2], 10);
          continue;
        }

        const num = parseInt(line, 10);
        if (!isNaN(num) && String(num) === line && num >= 0 && num <= 30) {
          scoreCandidates.push(num);
        }
      }

      if (scoreCandidates.length >= 2) {
        homeScore = scoreCandidates[scoreCandidates.length - 2];
        awayScore = scoreCandidates[scoreCandidates.length - 1];
      }

      // Se status for UPCOMING e nenhum score foi encontrado, placar é null
      if (status === 'UPCOMING' && scoreCandidates.length === 0) {
        homeScore = null;
        awayScore = null;
      }

      // Nome dos times a partir do texto ou da imagem
      const homeTeamName = homeTeamInfo.name || 'Time Mandante';
      const awayTeamName = awayTeamInfo.name || 'Time Visitante';

      matches.push({
        sofascoreId,
        tournamentName: currentTournament,
        country: currentCountry,
        roundGroup: currentRoundGroup,
        homeTeam: {
          id: homeTeamInfo.id,
          name: homeTeamName,
          logoUrl: homeTeamInfo.url,
        },
        awayTeam: {
          id: awayTeamInfo.id,
          name: awayTeamName,
          logoUrl: awayTeamInfo.url,
        },
        status,
        minute,
        period,
        score: {
          home: homeScore,
          away: awayScore,
          penalties:
            homePens !== undefined && awayPens !== undefined
              ? { home: homePens, away: awayPens }
              : undefined,
        },
        timeStr,
        sofascoreUrl: matchUrl,
      });
    }

    return { matches, transfers, topRatings };
  }

  /**
   * Localiza ou cria a liga correspondente a partir do Sofascore.
   */
  private resolveLeague(country: string, tournamentName: string, roundGroup?: string): string {
    const combinedName = `${tournamentName} ${roundGroup || ''}`.trim();
    const normalized = slugify(combinedName);

    for (const [key, id] of Object.entries(KNOWN_SOFASCORE_LEAGUES_MAP)) {
      if (normalized.includes(key) || key.includes(slugify(tournamentName))) {
        const found = db.leagues.find((l) => l.id === id);
        if (found) return found.id;
      }
    }

    const match = db.leagues.find(
      (l) =>
        slugify(l.name).includes(slugify(tournamentName)) ||
        slugify(l.originalName || '').includes(slugify(tournamentName))
    );
    if (match) return match.id;

    const leagueId = `sofa-${slugify(country)}-${slugify(tournamentName)}-2026`;
    const existing = db.leagues.find((l) => l.id === leagueId);
    if (existing) return existing.id;

    const newLeague: League = {
      id: leagueId,
      slug: slugify(`${country}-${tournamentName}`),
      name: roundGroup ? `${tournamentName} - ${roundGroup}` : `${tournamentName} (${country})`,
      originalName: tournamentName,
      country,
      countryCode: country.slice(0, 3).toUpperCase(),
      flagUrl: `https://img.sofascore.com/api/v1/category/1465/image`,
      logoUrl: `https://img.sofascore.com/api/v1/unique-tournament/10783/image`,
      tier: 'other',
      gender: tournamentName.toLowerCase().includes('women') || tournamentName.toLowerCase().includes('feminin') ? 'women' : 'men',
      ageCategory:
        tournamentName.toLowerCase().includes('u23') ||
        tournamentName.toLowerCase().includes('u21') ||
        tournamentName.toLowerCase().includes('u20')
          ? 'u17'
          : 'senior',
      season: '2026',
      hasStandings: false,
      hasLiveScores: true,
      totalTeams: 16,
      currentRound: roundGroup || 'Fase de Grupos',
      source: 'sofascore',
    };

    db.leagues.push(newLeague);
    return newLeague.id;
  }

  /**
   * Localiza ou cria o time correspondente no banco.
   */
  private resolveTeam(
    teamName: string,
    country: string,
    leagueId: string,
    logoUrl?: string,
    sofascoreTeamId?: string
  ): Team {
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
      if (logoUrl && (!existing.logoUrl || existing.logoUrl.includes('default'))) {
        existing.logoUrl = logoUrl;
      }
      return existing;
    }

    const teamId = slugName || `team-sofa-${sofascoreTeamId || Date.now()}`;
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
      logoUrl: logoUrl || `https://img.sofascore.com/api/v1/team/${sofascoreTeamId || '4481'}/image/small`,
      stadium: {
        name: `Estádio de ${teamName}`,
        city: country,
        capacity: 25000,
      },
      founded: 1920,
      coach: 'Treinador Principal',
      marketValueEur: 15000000,
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
   * Sincroniza partidas a partir de texto/markdown colado ou da web do Sofascore.
   */
  public async syncMatches(
    customContent?: string,
    targetDateStr: string = todayInTimeZone()
  ): Promise<SofascoreSyncResult> {
    const startTime = Date.now();
    this.status.isRunning = true;

    const result: SofascoreSyncResult = {
      source: 'sofascore',
      date: targetDateStr,
      totalParsed: 0,
      newMatches: 0,
      updatedMatches: 0,
      newTeams: 0,
      newLeagues: 0,
      transfersCount: 0,
      ratingsCount: 0,
      transfers: [],
      topRatings: [],
      errors: [],
      durationMs: 0,
    };

    try {
      const initialLeaguesCount = db.leagues.length;
      const initialTeamsCount = db.teams.length;

      let content = customContent;
      if (!content) {
        try {
          content = await this.fetchSofascoreHtml();
        } catch (fetchErr) {
          content = '';
          result.errors.push(`Não foi possível consultar o Sofascore ao vivo: ${(fetchErr as Error).message}`);
        }
      }

      const parsed = this.parseSofascore(content || '');
      result.totalParsed = parsed.matches.length;
      result.transfersCount = parsed.transfers.length;
      result.ratingsCount = parsed.topRatings.length;
      result.transfers = parsed.transfers;
      result.topRatings = parsed.topRatings;

      this.transfers = parsed.transfers;
      this.topRatings = parsed.topRatings;

      for (const item of parsed.matches) {
        try {
          const leagueId = this.resolveLeague(item.country, item.tournamentName, item.roundGroup);
          const homeTeam = this.resolveTeam(
            item.homeTeam.name,
            item.country,
            leagueId,
            item.homeTeam.logoUrl,
            item.homeTeam.id
          );
          const awayTeam = this.resolveTeam(
            item.awayTeam.name,
            item.country,
            leagueId,
            item.awayTeam.logoUrl,
            item.awayTeam.id
          );

          // Identifica se a partida já existe por ID do Sofascore ou por confronto na data
          const existingIdx = db.matches.findIndex(
            (m) =>
              m.sofascoreId === item.sofascoreId ||
              m.id === `match-sofa-${item.sofascoreId}` ||
              (m.sofascoreUrl && m.sofascoreUrl.includes(item.sofascoreId)) ||
              (m.homeTeam.id === homeTeam.id &&
                m.awayTeam.id === awayTeam.id &&
                m.kickoffTime.startsWith(targetDateStr))
          );

          const kickoffTime = `${targetDateStr}T${item.timeStr || '19:00'}:00Z`;

          if (existingIdx !== -1) {
            const existing = db.matches[existingIdx];
            const previousScore = { ...existing.score };
            const previousStatus = existing.status;

            const homeScore = item.score?.home ?? existing.score?.home ?? null;
            const awayScore = item.score?.away ?? existing.score?.away ?? null;

            db.matches[existingIdx] = {
              ...existing,
              status: item.status,
              minute: item.minute ?? existing.minute,
              period: item.period ?? existing.period,
              sofascoreId: item.sofascoreId,
              sofascoreUrl: item.sofascoreUrl,
              score: {
                home: homeScore,
                away: awayScore,
                penalties: item.score?.penalties || existing.score?.penalties,
                fulltime:
                  item.status === 'FINISHED' && homeScore !== null && awayScore !== null
                    ? { home: homeScore, away: awayScore }
                    : existing.score?.fulltime,
              },
            };

            result.updatedMatches++;

            if (previousStatus !== item.status) {
              webhookService
                .notify('MATCH_STATUS_CHANGE', {
                  matchId: existing.id,
                  matchSlug: existing.slug,
                  leagueId: existing.leagueId,
                  status: item.status,
                  previousStatus,
                  minute: item.minute,
                  score: db.matches[existingIdx].score,
                  source: 'sofascore',
                })
                .catch(() => {});
            }
          } else {
            // Nova partida inserida a partir do Sofascore
            const matchId = `match-sofa-${item.sofascoreId}`;
            const slug = slugify(`${homeTeam.name}-vs-${awayTeam.name}-2026`);

            const newMatch: Match = {
              id: matchId,
              slug,
              leagueId,
              leagueName: item.roundGroup ? `${item.tournamentName} - ${item.roundGroup}` : item.tournamentName,
              leagueCountry: item.country,
              leagueRound: item.roundGroup || '1',
              season: '2026',
              status: item.status,
              minute: item.minute,
              period: item.period,
              kickoffTime,
              stadium: `Estádio de ${homeTeam.name}`,
              city: item.country,
              gender: 'men',
              ageCategory: 'senior',
              sofascoreId: item.sofascoreId,
              sofascoreUrl: item.sofascoreUrl,
              homeTeam: {
                id: homeTeam.id,
                name: homeTeam.name,
                shortName: homeTeam.shortName || homeTeam.name,
                code: homeTeam.code,
                logoUrl: homeTeam.logoUrl,
              },
              awayTeam: {
                id: awayTeam.id,
                name: awayTeam.name,
                shortName: awayTeam.shortName || awayTeam.name,
                code: awayTeam.code,
                logoUrl: awayTeam.logoUrl,
              },
              score: {
                home: item.score?.home ?? null,
                away: item.score?.away ?? null,
                penalties: item.score?.penalties,
                fulltime:
                  item.status === 'FINISHED' &&
                  item.score &&
                  item.score.home !== null &&
                  item.score.away !== null
                    ? { home: item.score.home, away: item.score.away }
                    : undefined,
              },
              odds: {
                homeWin: 2.1,
                draw: 3.2,
                awayWin: 3.4,
                provider: 'bet365',
              },
              broadcast: ['Sofascore Live'],
            };

            db.matches.push(newMatch);
            result.newMatches++;
          }
        } catch (matchErr) {
          result.errors.push(
            `Erro ao processar partida Sofascore '${item.homeTeam.name} vs ${item.awayTeam.name}': ${(matchErr as Error).message}`
          );
        }
      }

      result.newLeagues = db.leagues.length - initialLeaguesCount;
      result.newTeams = db.teams.length - initialTeamsCount;
      result.durationMs = Date.now() - startTime;

      this.status.lastSyncAt = new Date().toISOString();
      this.status.lastSuccessAt = new Date().toISOString();
      this.status.lastDurationMs = result.durationMs;
      this.status.lastError = null;

      db.persist('matches');
      db.persist('teams');
      db.persist('leagues');

      return result;
    } catch (err) {
      const errorMsg = (err as Error).message;
      this.status.lastError = errorMsg;
      result.errors.push(errorMsg);
      result.durationMs = Date.now() - startTime;
      return result;
    } finally {
      this.status.isRunning = false;
    }
  }

  public async syncFromText(text: string, targetDateStr: string = todayInTimeZone()): Promise<SofascoreSyncResult> {
    return this.syncMatches(text, targetDateStr);
  }

  public startBackgroundSync(intervalMinutes: number = 5): void {
    this.stopBackgroundSync();
    this.status.backgroundIntervalMinutes = intervalMinutes;

    this.syncTimer = setInterval(async () => {
      if (this.isSyncing) return;
      this.isSyncing = true;
      try {
        await this.syncMatches();
      } catch (err) {
        console.error('Erro no sync background do Sofascore:', err);
      } finally {
        this.isSyncing = false;
      }
    }, intervalMinutes * 60 * 1000);

    this.syncTimer.unref?.();
  }

  public stopBackgroundSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }
}

export const sofascoreSyncService = SofascoreSyncService.getInstance();

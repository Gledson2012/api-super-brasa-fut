import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { League } from '../models/league.model.js';
import { Team } from '../models/team.model.js';
import { Match } from '../models/match.model.js';
import { LeagueStanding } from '../models/standing.model.js';
import { Player, StatsLeaders } from '../models/player.model.js';
import { NewsArticle } from '../models/news.model.js';
import { MatchOddsDetail } from '../models/odds.model.js';
import { LeagueBracket } from '../models/bracket.model.js';
import { MatchLineups } from '../models/lineup.model.js';
import { stateStore, STATE_PREFIX } from './state-store.js';
import type { StateStore } from './state-store.js';
import { withTimeout } from '../utils/with-timeout.js';
import { config } from '../config/environment.js';
import { todayInTimeZone } from '../utils/date.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type PersistentEntity = 'matches' | 'teams' | 'players' | 'leagues' | 'news' | 'standings';

const PERSISTENT_ENTITIES: PersistentEntity[] = ['matches', 'teams', 'players', 'leagues', 'news', 'standings'];

const HYDRATE_TIMEOUT_MS = 4000;

function getDataDir(): string {
  const localDistData = path.resolve(__dirname, '../data');
  if (fs.existsSync(localDistData)) {
    return localDistData;
  }
  const cwdDistData = path.resolve(process.cwd(), 'dist/data');
  if (fs.existsSync(cwdDistData)) {
    return cwdDistData;
  }
  const srcData = path.resolve(process.cwd(), 'src/data');
  if (fs.existsSync(srcData)) {
    return srcData;
  }
  return path.resolve(__dirname, '../../src/data');
}

function loadJson<T>(filename: string): T {
  const dataDir = getDataDir();
  const filePath = path.join(dataDir, filename);
  const rawData = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(rawData) as T;
}

function storeKey(entity: string): string {
  return `${STATE_PREFIX}:${entity}`;
}

export class InMemoryDatabase {
  private static instance: InMemoryDatabase;

  public leagues: League[] = [];
  public teams: Team[] = [];
  public matches: Match[] = [];
  public standings: LeagueStanding[] = [];
  public players: Player[] = [];
  public news: NewsArticle[] = [];
  public odds: MatchOddsDetail[] = [];
  public statsLeaders: StatsLeaders[] = [];
  public brackets: LeagueBracket[] = [];
  public lineups: MatchLineups[] = [];

  private constructor() {
    this.reload();
  }

  public static getInstance(): InMemoryDatabase {
    if (!InMemoryDatabase.instance) {
      InMemoryDatabase.instance = new InMemoryDatabase();
    }
    return InMemoryDatabase.instance;
  }

  /** Carrega (de forma síncrona) a linha de base a partir dos seeds JSON. */
  public reload(): void {
    this.leagues = loadJson<League[]>('leagues.json');
    this.teams = loadJson<Team[]>('teams.json');
    this.matches = loadJson<Match[]>('matches.json');
    this.standings = loadJson<LeagueStanding[]>('standings.json');
    this.players = loadJson<Player[]>('players.json');
    this.news = loadJson<NewsArticle[]>('news.json');
    this.odds = loadJson<MatchOddsDetail[]>('odds.json');
    this.statsLeaders = loadJson<StatsLeaders[]>('stats-leaders.json');
    this.brackets = loadJson<LeagueBracket[]>('brackets.json');
    this.lineups = loadJson<MatchLineups[]>('lineups.json');

    // Em produção/desenvolvimento, garante que as partidas demonstrativas de hoje/ao vivo
    // acompanhem a data atual caso os seeds estáticos estejam defasados e a sincronização externa
    // ainda não tenha ocorrido.
    if (config.env !== 'test') {
      const todayStr = todayInTimeZone();
      const hasToday = this.matches.some((m) => m.kickoffTime.startsWith(todayStr));
      if (!hasToday) {
        const liveSample = this.matches.find((m) => m.status === 'LIVE');
        const oldDate = liveSample ? liveSample.kickoffTime.slice(0, 10) : undefined;
        if (oldDate) {
          this.matches = this.matches.map((m) => {
            if (m.kickoffTime.startsWith(oldDate)) {
              return {
                ...m,
                kickoffTime: m.kickoffTime.replace(oldDate, todayStr),
              };
            }
            return m;
          });
        }
      }
    }
  }

  /**
   * Sobrepõe a linha de base com o estado persistido externamente, quando há um
   * backend configurado. Deve ser chamado no boot da aplicação (inclusive a cada
   * cold start em serverless). Erros de rede não derrubam o processo: a API
   * segue com os dados dos seeds JSON.
   */
  public async hydrate(store: StateStore = stateStore): Promise<void> {
    if (store.name === 'memory') return;

    try {
      await withTimeout(
        (async () => {
          for (const entity of PERSISTENT_ENTITIES) {
            const stored = await store.get<unknown>(storeKey(entity));
            if (Array.isArray(stored)) {
              (this[entity] as unknown[]) = stored;
            }
          }
        })(),
        HYDRATE_TIMEOUT_MS,
        'hydrate do banco de dados'
      );
    } catch (err) {
      console.error('Falha ao hidratar estado externo. Usando seeds JSON.', err);
    }
  }

  /** Restaura os seeds e limpa o estado persistido externamente. */
  public async resetAll(store: StateStore = stateStore): Promise<void> {
    this.reload();
    await Promise.all(
      PERSISTENT_ENTITIES.map((entity) =>
        store.del(storeKey(entity)).catch(() => undefined)
      )
    );
  }

  public persist(entity: PersistentEntity): void {
    const payload = this[entity];

    if (process.env.PERSIST_CHANGES === 'true') {
      try {
        const dataDir = getDataDir();
        const filePath = path.join(dataDir, `${entity}.json`);
        fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf-8');
      } catch (err) {
        console.error(`Erro ao persistir ${entity} em disco:`, err);
      }
    }

    // Write-through para o backend externo (quando configurado), sem bloquear.
    if (stateStore.name !== 'memory') {
      stateStore.set(storeKey(entity), payload).catch((err) => {
        console.error(`Erro ao persistir ${entity} no estado externo:`, err);
      });
    }
  }
}

export const db = InMemoryDatabase.getInstance();

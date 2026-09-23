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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getDataDir(): string {
  const localDistData = path.resolve(__dirname, '../data');
  if (fs.existsSync(localDistData)) {
    return localDistData;
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

  private constructor() {
    this.reload();
  }

  public static getInstance(): InMemoryDatabase {
    if (!InMemoryDatabase.instance) {
      InMemoryDatabase.instance = new InMemoryDatabase();
    }
    return InMemoryDatabase.instance;
  }

  public reload(): void {
    this.leagues = loadJson<League[]>('leagues.json');
    this.teams = loadJson<Team[]>('teams.json');
    this.matches = loadJson<Match[]>('matches.json');
    this.standings = loadJson<LeagueStanding[]>('standings.json');
    this.players = loadJson<Player[]>('players.json');
    this.news = loadJson<NewsArticle[]>('news.json');
    this.odds = loadJson<MatchOddsDetail[]>('odds.json');
    this.statsLeaders = loadJson<StatsLeaders[]>('stats-leaders.json');
  }
}

export const db = InMemoryDatabase.getInstance();

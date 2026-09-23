import { GenderCategory, AgeCategory } from './league.model.js';

export type MatchStatus = 'UPCOMING' | 'LIVE' | 'HALFTIME' | 'FINISHED' | 'POSTPONED' | 'CANCELLED';

export interface MatchEvent {
  id: string;
  type: 'GOAL' | 'YELLOW_CARD' | 'RED_CARD' | 'SUBSTITUTION' | 'VAR' | 'PENALTY_MISSED';
  minute: number;
  extraMinute?: number;
  teamId: string;
  teamName: string;
  primaryPlayer: string;
  secondaryPlayer?: string;
  detail?: string;
  scoreAfter?: {
    home: number;
    away: number;
  };
}

export interface MatchTeamStats {
  possessionPercent: number;
  expectedGoals?: number;
  totalShots: number;
  shotsOnTarget: number;
  shotsOffTarget: number;
  blockedShots: number;
  cornerKicks: number;
  offsides: number;
  fouls: number;
  yellowCards: number;
  redCards: number;
  goalkeeperSaves: number;
  totalPasses: number;
  accuratePasses: number;
  passAccuracyPercent: number;
}

export interface MatchLineupPlayer {
  number: number;
  name: string;
  position: 'GK' | 'DF' | 'MF' | 'FW';
  isCaptain?: boolean;
  rating?: number;
}

export interface MatchLineups {
  home: {
    formation: string;
    coach: string;
    starters: MatchLineupPlayer[];
    substitutes: MatchLineupPlayer[];
  };
  away: {
    formation: string;
    coach: string;
    starters: MatchLineupPlayer[];
    substitutes: MatchLineupPlayer[];
  };
}

export interface MatchOdds {
  homeWin: number;
  draw: number;
  awayWin: number;
  over25?: number;
  under25?: number;
  bttsYes?: number;
  bttsNo?: number;
  provider?: string;
}

export interface Match {
  id: string;
  slug: string;
  leagueId: string;
  leagueName: string;
  leagueCountry: string;
  leagueRound?: string | number;
  round?: string | number;
  season: string;
  status: MatchStatus;
  minute?: number;
  period?: '1H' | 'HT' | '2H' | 'ET' | 'P' | 'FT';
  kickoffTime: string;
  stadium?: string;
  city?: string;
  referee?: string;
  gender?: GenderCategory;
  ageCategory?: AgeCategory;
  homeTeam: {
    id: string;
    name: string;
    shortName: string;
    code: string;
    logoUrl?: string;
  };
  awayTeam: {
    id: string;
    name: string;
    shortName: string;
    code: string;
    logoUrl?: string;
  };
  score: {
    home: number | null;
    away: number | null;
    halftime?: {
      home: number;
      away: number;
    };
    fulltime?: {
      home: number;
      away: number;
    };
    penalties?: {
      home: number;
      away: number;
    };
  };
  events?: MatchEvent[];
  stats?: {
    home: MatchTeamStats;
    away: MatchTeamStats;
  };
  lineups?: MatchLineups;
  odds?: MatchOdds;
  broadcast?: string[];
}

export interface MatchFilterQuery {
  leagueId?: string;
  teamId?: string;
  status?: MatchStatus;
  date?: string;
  liveOnly?: boolean;
  season?: string;
  round?: string | number;
  search?: string;
  gender?: GenderCategory;
  ageCategory?: AgeCategory;
}

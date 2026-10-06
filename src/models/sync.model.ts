import { MatchStatus } from './match.model.js';

export interface FlashscoreParsedMatch {
  fsId: string;
  country: string;
  leagueName: string;
  homeTeamName: string;
  awayTeamName: string;
  status: MatchStatus;
  minute?: number;
  period?: '1H' | 'HT' | '2H' | 'ET' | 'P' | 'FT';
  homeScore?: number;
  awayScore?: number;
  timeStr?: string;
  flashscoreUrl: string;
}

export interface FlashscoreSyncResult {
  date: string;
  totalParsed: number;
  newMatches: number;
  updatedMatches: number;
  newTeams: number;
  newLeagues: number;
  errors: string[];
  durationMs: number;
}

export interface FlashscoreSyncStatus {
  lastSyncAt: string | null;
  lastSuccessAt: string | null;
  lastDurationMs: number;
  totalSyncedMatches: number;
  isRunning: boolean;
  backgroundIntervalMinutes: number;
  lastError: string | null;
}

export interface SofascoreParsedMatch {
  sofascoreId: string;
  tournamentId?: string;
  tournamentName: string;
  country: string;
  roundGroup?: string;
  homeTeam: {
    id?: string;
    name: string;
    logoUrl?: string;
  };
  awayTeam: {
    id?: string;
    name: string;
    logoUrl?: string;
  };
  status: MatchStatus;
  minute?: number;
  period?: '1H' | 'HT' | '2H' | 'ET' | 'P' | 'FT';
  score?: {
    home: number | null;
    away: number | null;
    penalties?: {
      home: number;
      away: number;
    };
  };
  timeStr?: string;
  dateStr?: string;
  sofascoreUrl: string;
}

export interface SofascoreParsedTransfer {
  playerName: string;
  playerId?: string;
  playerImageUrl?: string;
  fromTeam: string;
  fromTeamLogo?: string;
  toTeam: string;
  toTeamLogo?: string;
  transferFee: string;
}

export interface SofascoreParsedRating {
  playerName: string;
  playerId?: string;
  playerImageUrl?: string;
  position?: string;
  teamName?: string;
  teamLogo?: string;
  matchScore?: string;
  opponentTeam?: string;
  rating: number;
}

export interface SofascoreSyncResult {
  source: 'sofascore';
  date: string;
  totalParsed: number;
  newMatches: number;
  updatedMatches: number;
  newTeams: number;
  newLeagues: number;
  transfersCount?: number;
  ratingsCount?: number;
  transfers?: SofascoreParsedTransfer[];
  topRatings?: SofascoreParsedRating[];
  errors: string[];
  durationMs: number;
}

export interface SofascoreSyncStatus {
  lastSyncAt: string | null;
  lastSuccessAt: string | null;
  lastDurationMs: number;
  totalSyncedMatches: number;
  totalTransfers: number;
  totalTopRatings: number;
  isRunning: boolean;
  backgroundIntervalMinutes: number;
  lastError: string | null;
}


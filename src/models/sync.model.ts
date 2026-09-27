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

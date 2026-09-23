export type PlayerPosition = 'Goalkeeper' | 'Defender' | 'Midfielder' | 'Forward';

export interface PlayerStats {
  season: string;
  leagueId: string;
  leagueName: string;
  appearances: number;
  minutesPlayed: number;
  goals: number;
  expectedGoals?: number;
  assists: number;
  expectedAssists?: number;
  shotsOnTarget?: number;
  passAccuracyPercent?: number;
  keyPasses?: number;
  yellowCards: number;
  redCards: number;
  cleanSheets?: number;
  sofascoreRating?: number; // e.g. 7.65
}

export interface Player {
  id: string;
  slug: string;
  name: string;
  fullName: string;
  nickname?: string;
  birthDate: string; // YYYY-MM-DD
  age: number;
  nationality: string;
  countryCode: string;
  photoUrl?: string;
  heightCm?: number;
  weightKg?: number;
  preferredFoot?: 'left' | 'right' | 'both';
  position: PlayerPosition;
  currentTeam: {
    id: string;
    name: string;
    shortName: string;
    logoUrl?: string;
  };
  shirtNumber: number;
  marketValueEur?: number;
  contractUntil?: string;
  stats: PlayerStats[];
  sofascoreId?: string;
  fbrefId?: string;
}

export interface PlayerFilterQuery {
  teamId?: string;
  nationality?: string;
  position?: PlayerPosition;
  search?: string;
  leagueId?: string;
}

export interface TopScorerEntry {
  rank: number;
  player: {
    id: string;
    name: string;
    photoUrl?: string;
    nationality: string;
  };
  team: {
    id: string;
    name: string;
    logoUrl?: string;
  };
  goals: number;
  penaltyGoals: number;
  assists: number;
  matchesPlayed: number;
  minutesPerGoal: number;
}

export interface TopAssistEntry {
  rank: number;
  player: {
    id: string;
    name: string;
    photoUrl?: string;
    nationality: string;
  };
  team: {
    id: string;
    name: string;
    logoUrl?: string;
  };
  assists: number;
  keyPasses: number;
  matchesPlayed: number;
}

export interface TopRatingEntry {
  rank: number;
  player: {
    id: string;
    name: string;
    position: PlayerPosition;
    photoUrl?: string;
    nationality: string;
  };
  team: {
    id: string;
    name: string;
    logoUrl?: string;
  };
  rating: number; // e.g. 7.82
  matchesPlayed: number;
  goals: number;
  assists: number;
}

export interface StatsLeaders {
  leagueId: string;
  leagueName: string;
  season: string;
  topScorers: TopScorerEntry[];
  topAssists: TopAssistEntry[];
  topRatings: TopRatingEntry[];
}

export interface PlayerComparisonSummary {
  player1: {
    id: string;
    name: string;
    team: string;
    position: PlayerPosition;
    age: number;
    marketValueEur?: number;
    goals: number;
    assists: number;
    appearances: number;
    minutesPlayed: number;
    yellowCards: number;
    redCards: number;
    averageRating?: number;
    goalsPerMatch: number;
    assistsPerMatch: number;
    minutesPerGoal: number | null;
  };
  player2: {
    id: string;
    name: string;
    team: string;
    position: PlayerPosition;
    age: number;
    marketValueEur?: number;
    goals: number;
    assists: number;
    appearances: number;
    minutesPlayed: number;
    yellowCards: number;
    redCards: number;
    averageRating?: number;
    goalsPerMatch: number;
    assistsPerMatch: number;
    minutesPerGoal: number | null;
  };
  metricsComparison: {
    moreGoals: 'player1' | 'player2' | 'tie';
    moreAssists: 'player1' | 'player2' | 'tie';
    higherRating: 'player1' | 'player2' | 'tie';
    higherMarketValue: 'player1' | 'player2' | 'tie';
  };
  fullDetails: {
    player1: Player;
    player2: Player;
  };
}


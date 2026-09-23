export type LeagueTier = 'top' | 'second' | 'cup' | 'international' | 'continental' | 'youth' | 'amateur';
export type GenderCategory = 'men' | 'women' | 'mixed';
export type AgeCategory = 'senior' | 'u23' | 'u20' | 'u17';

export interface League {
  id: string;
  slug: string;
  name: string;
  originalName: string;
  country: string;
  countryCode: string;
  flagUrl?: string;
  logoUrl?: string;
  tier: LeagueTier;
  gender: GenderCategory;
  ageCategory: AgeCategory;
  season: string;
  hasStandings: boolean;
  hasLiveScores: boolean;
  isLive?: boolean;
  isCup?: boolean;
  totalTeams?: number;
  currentRound?: number | string;
  source: 'flashscore' | 'sofascore' | 'espn' | 'fbref';
}

export interface LeagueFilterQuery {
  country?: string;
  gender?: GenderCategory;
  ageCategory?: AgeCategory;
  tier?: LeagueTier;
  search?: string;
  season?: string;
  isLive?: boolean;
  isCup?: boolean;
}

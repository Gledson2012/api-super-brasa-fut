import { GenderCategory, AgeCategory } from './league.model.js';

export interface Team {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  code: string;
  country: string;
  countryCode: string;
  leagueId: string;
  leagueName: string;
  logoUrl?: string;
  gender?: GenderCategory;
  ageCategory?: AgeCategory;
  stadium?: {
    name: string;
    city: string;
    capacity: number;
  };
  founded?: number;
  coach?: string;
  marketValueEur?: number;
  stats?: {
    matchesPlayed: number;
    wins: number;
    draws: number;
    losses: number;
    goalsScored: number;
    goalsConceded: number;
    cleanSheets: number;
  };
}

export interface TeamFilterQuery {
  country?: string;
  leagueId?: string;
  gender?: GenderCategory;
  ageCategory?: AgeCategory;
  search?: string;
}

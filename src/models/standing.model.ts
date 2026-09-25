export interface StandingEntry {
  position: number;
  team: {
    id: string;
    name: string;
    shortName: string;
    code: string;
    logoUrl?: string;
  };
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  pointsPercentage: number;
  form: Array<'W' | 'D' | 'L'>; // e.g. ['W', 'W', 'D', 'W', 'L']
  zone?: {
    name: string; // 'Fase de Grupos da Libertadores', 'Pré-Libertadores', 'Copa Sul-Americana', 'Rebaixamento Série B', 'Champions League', 'Europa League'
    type: 'champions_league' | 'libertadores' | 'pre_libertadores' | 'sudamericana' | 'relegation' | 'promotion' | 'neutral';
    color: string;
  };
}

export interface StandingGroup {
  groupName?: string; // e.g., 'Grupo A', 'Fase Única'
  table: StandingEntry[];
}

export interface LeagueStanding {
  id: string;
  leagueId: string;
  leagueName: string;
  country: string;
  season: string;
  updatedAt: string;
  /**
   * Tabela amostral: cobre apenas parte dos clubes da competição (ex.: só 4 dos
   * 20 clubes da Série B), então os balanços coletivos da tabela (total de jogos
   * par, vitórias = derrotas, gols marcados = gols sofridos) não se aplicam.
   */
  partial?: boolean;
  groups: StandingGroup[];
}

export interface StandingFilterQuery {
  leagueId?: string;
  season?: string;
  country?: string;
}

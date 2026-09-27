export interface BracketTeamRef {
  id: string;
  name: string;
  shortName: string;
  logoUrl?: string;
}

export interface BracketMatch {
  id: string;
  matchId?: string;
  homeTeam: BracketTeamRef;
  awayTeam: BracketTeamRef;
  leg1Score?: { home: number; away: number };
  leg2Score?: { home: number; away: number };
  aggregateScore?: { home: number; away: number };
  penaltiesScore?: { home: number; away: number };
  winnerTeamId?: string;
  status: 'UPCOMING' | 'LIVE' | 'FINISHED';
  date?: string;
  nextMatchId?: string;
}

export interface BracketRound {
  id: string;
  name: string;
  stage: 'round_of_32' | 'round_of_16' | 'quarter_finals' | 'semi_finals' | 'final';
  matches: BracketMatch[];
}

export interface LeagueBracket {
  id: string;
  leagueId: string;
  leagueName: string;
  season: string;
  updatedAt: string;
  rounds: BracketRound[];
}

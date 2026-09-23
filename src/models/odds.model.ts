export interface BookmakerOdds {
  bookmaker: string;
  homeWin: number;
  draw: number;
  awayWin: number;
  over25?: number;
  under25?: number;
  bttsYes?: number;
  bttsNo?: number;
  updatedAt: string;
}

export interface MatchOddsDetail {
  matchId: string;
  matchSlug: string;
  homeTeam: string;
  awayTeam: string;
  leagueId: string;
  leagueName: string;
  kickoffTime: string;
  status: string;
  averageOdds: {
    homeWin: number;
    draw: number;
    awayWin: number;
    over25?: number;
    under25?: number;
    bttsYes?: number;
    bttsNo?: number;
  };
  bookmakers: BookmakerOdds[];
}

export interface LineupPlayer {
  id: string;
  name: string;
  number: number;
  position: 'GK' | 'DEF' | 'MID' | 'FWD';
  isCaptain?: boolean;
  gridPosition: { x: number; y: number };
}

export interface TeamLineup {
  teamId: string;
  teamName: string;
  formation: string;
  coach?: string;
  startingXI: LineupPlayer[];
  substitutes: LineupPlayer[];
}

export interface MatchLineups {
  matchId: string;
  home: TeamLineup;
  away: TeamLineup;
}

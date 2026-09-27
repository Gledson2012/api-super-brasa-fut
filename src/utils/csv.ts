import { LeagueStanding } from '../models/standing.model.js';
import { Match } from '../models/match.model.js';

export function standingToCsv(standing: LeagueStanding): string {
  const lines: string[] = [];
  lines.push(`Classificação: ${standing.leagueName} (${standing.season})`);
  lines.push(`Posição,Time,Pontos,Jogos,Vitórias,Empates,Derrotas,Gols Pró,Gols Contra,Saldo de Gols,Aproveitamento (%),Forma`);

  standing.groups.forEach((group) => {
    if (standing.groups.length > 1) {
      lines.push(`Grupo: ${group.groupName || 'Fase'}`);
    }
    group.table.forEach((entry) => {
      const row = [
        entry.position,
        `"${entry.team.name}"`,
        entry.points,
        entry.played,
        entry.won,
        entry.drawn,
        entry.lost,
        entry.goalsFor,
        entry.goalsAgainst,
        entry.goalDifference,
        `${entry.pointsPercentage}%`,
        `"${entry.form.join('-')}"`,
      ];
      lines.push(row.join(','));
    });
  });

  return lines.join('\n');
}

export function matchesToCsv(matches: Match[]): string {
  const lines: string[] = [];
  lines.push(`ID,Data,Liga,Mandante,Visitante,Gols Mandante,Gols Visitante,Status,Rodada`);

  matches.forEach((m) => {
    const row = [
      m.id,
      m.kickoffTime,
      `"${m.leagueName}"`,
      `"${m.homeTeam.name}"`,
      `"${m.awayTeam.name}"`,
      m.score.home !== null ? m.score.home : '',
      m.score.away !== null ? m.score.away : '',
      m.status,
      m.round || m.leagueRound || '',
    ];
    lines.push(row.join(','));
  });

  return lines.join('\n');
}

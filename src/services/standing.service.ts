import { standingRepository } from '../repositories/standing.repository.js';
import { leagueRepository } from '../repositories/league.repository.js';
import { teamRepository } from '../repositories/team.repository.js';
import { LeagueStanding, StandingFilterQuery } from '../models/standing.model.js';
import { PaginatedResult, PaginationQuery } from '../models/common.js';
import { paginate } from '../utils/pagination.js';
import { NotFoundError } from '../utils/errors.js';

export interface StandingValidationIssue {
  leagueId: string;
  teamId?: string;
  rule: string;
  message: string;
}

export interface StandingValidationWarning {
  leagueId: string;
  rule: string;
  message: string;
}

export interface StandingValidationReport {
  valid: boolean;
  checkedLeagues: number;
  checkedEntries: number;
  /** Ligas cuja tabela é amostral, isentas dos balanços coletivos. */
  partialLeagues: string[];
  /** Inconsistências que não invalidam as tabelas existentes. */
  warnings: StandingValidationWarning[];
  issues: StandingValidationIssue[];
}

export class StandingService {
  public async getStandings(
    filters: StandingFilterQuery,
    pagination: PaginationQuery
  ): Promise<PaginatedResult<LeagueStanding>> {
    const standings = await standingRepository.findAll(filters);
    return paginate(standings, pagination.page, pagination.limit);
  }

  /**
   * Valida as invariantes de uma tabela de classificação real: jogos = V+E+D,
   * pontos = 3V+E, saldo = GP-GC, aproveitamento, ordenação por pontos, além dos
   * balanços coletivos (vitórias = derrotas, gols marcados = gols sofridos) e da
   * existência de cada time da tabela no cadastro de times.
   */
  public async validateStandings(): Promise<StandingValidationReport> {
    const standings = await standingRepository.findAll();
    const teams = await teamRepository.findAll();
    const teamIds = new Set(teams.map((t) => t.id));
    const issues: StandingValidationIssue[] = [];
    let checkedEntries = 0;

    const addIssue = (leagueId: string, rule: string, message: string, teamId?: string): void => {
      issues.push({ leagueId, teamId, rule, message });
    };

    standings.forEach((standing) => {
      standing.groups.forEach((group) => {
        let totalPlayed = 0;
        let totalWon = 0;
        let totalDrawn = 0;
        let totalLost = 0;
        let totalGoalsFor = 0;
        let totalGoalsAgainst = 0;

        group.table.forEach((entry, index) => {
          checkedEntries++;
          const { team } = entry;

          if (entry.position !== index + 1) {
            addIssue(standing.leagueId, 'position', `Posição ${entry.position} fora de ordem (esperado ${index + 1}).`, team.id);
          }

          if (!teamIds.has(team.id)) {
            addIssue(standing.leagueId, 'team_exists', `Time '${team.id}' não existe no cadastro de times.`, team.id);
          }

          if (entry.played !== entry.won + entry.drawn + entry.lost) {
            addIssue(
              standing.leagueId,
              'played',
              `Jogos (${entry.played}) diferente de V+E+D (${entry.won + entry.drawn + entry.lost}).`,
              team.id
            );
          }

          if (entry.points !== entry.won * 3 + entry.drawn) {
            addIssue(standing.leagueId, 'points', `Pontos (${entry.points}) diferente de 3V+E (${entry.won * 3 + entry.drawn}).`, team.id);
          }

          if (entry.goalDifference !== entry.goalsFor - entry.goalsAgainst) {
            addIssue(
              standing.leagueId,
              'goal_difference',
              `Saldo de gols (${entry.goalDifference}) diferente de GP-GC (${entry.goalsFor - entry.goalsAgainst}).`,
              team.id
            );
          }

          if (entry.played > 0) {
            const expectedPercentage = Math.round((entry.points / (entry.played * 3)) * 1000) / 10;
            if (Math.abs(entry.pointsPercentage - expectedPercentage) > 0.05) {
              addIssue(
                standing.leagueId,
                'points_percentage',
                `Aproveitamento (${entry.pointsPercentage}) diferente de ${expectedPercentage}.`,
                team.id
              );
            }
          }

          // A forma guarda os últimos 5 resultados — ou todos, se o time jogou menos que isso.
          const expectedFormLength = Math.min(5, entry.played);
          if (entry.form.length !== expectedFormLength) {
            addIssue(
              standing.leagueId,
              'form',
              `Forma com ${entry.form.length} resultados (esperado ${expectedFormLength} para ${entry.played} jogos).`,
              team.id
            );
          }

          const previous = group.table[index - 1];
          if (previous && previous.points < entry.points) {
            addIssue(
              standing.leagueId,
              'ordering',
              `Time com ${entry.points} pontos posicionado abaixo de um time com ${previous.points}.`,
              team.id
            );
          }

          totalPlayed += entry.played;
          totalWon += entry.won;
          totalDrawn += entry.drawn;
          totalLost += entry.lost;
          totalGoalsFor += entry.goalsFor;
          totalGoalsAgainst += entry.goalsAgainst;
        });

        // Tabelas amostrais cobrem só parte dos clubes da competição, então os
        // balanços coletivos da tabela não têm como fechar.
        if (!standing.partial) {
          if (totalPlayed % 2 !== 0) {
            addIssue(
              standing.leagueId,
              'played_balance',
              `Total de jogos ímpar (${totalPlayed}): cada partida pertence a dois times.`
            );
          }

          if (totalWon !== totalLost) {
            addIssue(
              standing.leagueId,
              'wins_losses_balance',
              `Soma de vitórias (${totalWon}) diferente da soma de derrotas (${totalLost}) na tabela.`
            );
          }

          if (totalGoalsFor !== totalGoalsAgainst) {
            addIssue(
              standing.leagueId,
              'goals_balance',
              `Soma de gols marcados (${totalGoalsFor}) diferente da soma de gols sofridos (${totalGoalsAgainst}) na tabela.`
            );
          }

          if (totalDrawn % 2 !== 0) {
            addIssue(
              standing.leagueId,
              'draws_balance',
              `Soma de empates ímpar (${totalDrawn}): cada empate pertence a dois times.`
            );
          }
        }
      });
    });

    // Ligas que se declaram com classificação publicada mas não têm tabela:
    // o endpoint /leagues/{id}/standings responde 404 para elas.
    const leagues = await leagueRepository.findAll();
    const leaguesWithStandings = new Set(standings.map((standing) => standing.leagueId));
    const warnings: StandingValidationWarning[] = leagues
      .filter((league) => league.hasStandings && !leaguesWithStandings.has(league.id))
      .map((league) => ({
        leagueId: league.id,
        rule: 'missing_standings',
        message: `Liga '${league.id}' declara hasStandings=true mas não possui tabela de classificação publicada.`,
      }));

    return {
      valid: issues.length === 0,
      checkedLeagues: standings.length,
      checkedEntries,
      partialLeagues: standings.filter((standing) => standing.partial).map((standing) => standing.leagueId),
      warnings,
      issues,
    };
  }

  public async getStandingByLeagueId(leagueId: string): Promise<LeagueStanding> {
    const standing = await standingRepository.findByLeagueId(leagueId);
    if (!standing) {
      throw new NotFoundError(`Classificação da liga '${leagueId}' não encontrada.`);
    }
    return standing;
  }
}

export const standingService = new StandingService();

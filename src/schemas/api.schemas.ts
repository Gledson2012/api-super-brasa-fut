import { z } from 'zod';

export const idParamSchema = z.object({
  id: z.string().trim().min(1, 'O parâmetro :id é obrigatório.'),
});

export const leagueIdParamSchema = z.object({
  leagueId: z.string().trim().min(1, 'O parâmetro :leagueId é obrigatório.'),
});

export const matchIdParamSchema = z.object({
  matchId: z.string().trim().min(1, 'O parâmetro :matchId é obrigatório.'),
});

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive('A página deve ser um número inteiro positivo.').default(1).optional(),
  limit: z.coerce.number().int().positive().max(100, 'O limite máximo é de 100 itens por página.').default(20).optional(),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional(),
});

export const matchFilterQuerySchema = paginationQuerySchema.extend({
  leagueId: z.string().optional(),
  // Atalhos com nomes curtos (`?league=` e `?team=`) — antes removidos pelo
  // strip do Zod, o que silenciosamente anulava os filtros.
  league: z.string().optional(),
  teamId: z.string().optional(),
  team: z.string().optional(),
  status: z
    .enum(['SCHEDULED', 'UPCOMING', 'LIVE', 'HALFTIME', 'FINISHED', 'POSTPONED', 'CANCELLED'])
    .optional(),
  date: z
    .string()
    .regex(
      /^(\d{4}-\d{2}-\d{2}|today|tomorrow|yesterday|hoje|amanha|amanhã|ontem)$/,
      'Formato de data inválido. Use AAAA-MM-DD, "today", "tomorrow" ou "yesterday".'
    )
    .optional(),
  round: z.coerce.number().int().positive().optional(),
  gender: z.enum(['men', 'women', 'all']).optional(),
  ageCategory: z.enum(['senior', 'u20', 'u17', 'all']).optional(),
  format: z.enum(['json', 'csv']).optional(),
  search: z.string().optional(),
  q: z.string().optional(),
});

export const leagueFilterQuerySchema = paginationQuerySchema.extend({
  country: z.string().optional(),
  season: z.string().optional(),
  tier: z
    .enum(['top', 'second', 'third', 'fourth', 'state', 'cup', 'international', 'continental', 'youth', 'amateur', 'other'])
    .optional(),
  gender: z.enum(['men', 'women', 'mixed', 'all']).optional(),
  ageCategory: z.enum(['senior', 'u23', 'u20', 'u17', 'all']).optional(),
  isLive: z.enum(['true', 'false']).optional(),
  isCup: z.enum(['true', 'false']).optional(),
  search: z.string().optional(),
});

export const newsFilterQuerySchema = paginationQuerySchema.extend({
  category: z.string().optional(),
  tag: z.string().optional(),
  leagueId: z.string().optional(),
  teamId: z.string().optional(),
  search: z.string().optional(),
});

export const oddsFilterQuerySchema = paginationQuerySchema.extend({
  leagueId: z.string().optional(),
  matchId: z.string().optional(),
});

export const teamFilterQuerySchema = paginationQuerySchema.extend({
  country: z.string().optional(),
  leagueId: z.string().optional(),
  search: z.string().optional(),
  gender: z.enum(['men', 'women', 'all']).optional(),
  ageCategory: z.enum(['senior', 'u23', 'u20', 'u17', 'all']).optional(),
  isNationalTeam: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .transform((val) => (typeof val === 'string' ? val === 'true' : val))
    .optional(),
});

export const playerFilterQuerySchema = paginationQuerySchema.extend({
  teamId: z.string().optional(),
  nationality: z.string().optional(),
  position: z.enum(['Goalkeeper', 'Defender', 'Midfielder', 'Forward']).optional(),
  search: z.string().optional(),
  leagueId: z.string().optional(),
});

export const h2hQuerySchema = z.object({
  team1Id: z.string().trim().min(1, 'O parâmetro team1Id é obrigatório.'),
  team2Id: z.string().trim().min(1, 'O parâmetro team2Id é obrigatório.'),
});

export const playerCompareQuerySchema = z.object({
  p1: z.string().trim().min(1, 'O parâmetro p1 é obrigatório.'),
  p2: z.string().trim().min(1, 'O parâmetro p2 é obrigatório.'),
});

export const simulateEventBodySchema = z.object({
  type: z
    .enum(['GOAL', 'YELLOW_CARD', 'RED_CARD', 'SUBSTITUTION'], {
      errorMap: () => ({ message: 'Tipo de evento inválido. Use GOAL, YELLOW_CARD, RED_CARD ou SUBSTITUTION.' }),
    })
    .optional(),
  team: z
    .enum(['home', 'away'], { errorMap: () => ({ message: 'O time deve ser "home" ou "away".' }) })
    .optional(),
  player: z.string().trim().min(1, 'O nome do jogador não pode ser vazio.').max(120, 'O nome do jogador é muito longo.').optional(),
  minute: z.coerce
    .number()
    .int('O minuto deve ser um número inteiro.')
    .min(1, 'O minuto deve estar entre 1 e 120.')
    .max(120, 'O minuto deve estar entre 1 e 120.')
    .optional(),
});

export const simulateAutoBodySchema = z.object({
  intervalMs: z.coerce.number().int().min(500, 'O intervalo mínimo é de 500ms.').max(30000).default(2500).optional(),
  speedMinutes: z.coerce.number().int().min(1).max(15).default(5).optional(),
  autoEvents: z.boolean().default(true).optional(),
});

export const webhookEventTypes = ['GOAL', 'MATCH_EVENT', 'MATCH_STATUS_CHANGE', 'ALL'] as const;

export const createWebhookBodySchema = z.object({
  url: z.string().trim().min(1, 'A URL do webhook é obrigatória e deve iniciar com http:// ou https://.'),
  events: z
    .array(z.enum(webhookEventTypes, { errorMap: () => ({ message: `Eventos válidos: ${webhookEventTypes.join(', ')}.` }) }))
    .min(1, 'Informe ao menos um evento ou use ["ALL"].')
    .max(webhookEventTypes.length)
    .optional(),
  matchId: z.string().trim().min(1, 'O matchId não pode ser vazio.').max(120, 'O matchId é muito longo.').optional(),
  leagueId: z.string().trim().min(1, 'O leagueId não pode ser vazio.').max(120, 'O leagueId é muito longo.').optional(),
  secret: z
    .string()
    .min(8, 'O segredo do webhook deve ter ao menos 8 caracteres.')
    .max(256, 'O segredo do webhook é muito longo.')
    .optional(),
});

export const searchQuerySchema = z.object({
  q: z.string().trim().min(1, 'O parâmetro de busca "q" é obrigatório.'),
  type: z.enum(['all', 'leagues', 'teams', 'players', 'matches', 'news']).default('all').optional(),
  limit: z.coerce.number().int().positive().max(50, 'O limite máximo para busca é 50.').default(10).optional(),
});

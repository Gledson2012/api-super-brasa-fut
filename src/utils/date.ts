import { config } from '../config/environment.js';

/**
 * Retorna a data atual (AAAA-MM-DD) no fuso horário configurado (padrão:
 * America/Sao_Paulo). Evita o deslocamento de um dia causado pelo uso de UTC
 * em `toISOString()`.
 */
export function todayInTimeZone(timeZone: string = config.timeZone, at: Date = new Date()): string {
  // en-CA produz o formato ISO AAAA-MM-DD.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(at);
}

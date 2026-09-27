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

export function relativeDateInTimeZone(offsetDays: number = 0, timeZone: string = config.timeZone, at: Date = new Date()): string {
  const target = new Date(at.getTime() + offsetDays * 24 * 60 * 60 * 1000);
  return todayInTimeZone(timeZone, target);
}

export function tomorrowInTimeZone(timeZone: string = config.timeZone, at: Date = new Date()): string {
  return relativeDateInTimeZone(1, timeZone, at);
}

export function yesterdayInTimeZone(timeZone: string = config.timeZone, at: Date = new Date()): string {
  return relativeDateInTimeZone(-1, timeZone, at);
}


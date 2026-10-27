import {
  format,
  formatDistanceStrict,
  differenceInCalendarDays,
  isToday,
  isYesterday,
  parseISO,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'

/** Tolerância de 5 minutos para pequenas diferenças de relógio ao recusar datas no futuro. */
export const FUTURE_TOLERANCE_MS = 5 * 60_000

/**
 * Converte string para Date preservando o calendário local para strings no formato
 * yyyy-MM-dd (evita meia-noite UTC que viraria 21h do dia anterior em UTC-3).
 */
export function parseDate(value: string | Date): Date {
  return typeof value === 'string' ? parseISO(value) : value
}

/** `true` quando a data/hora é válida e não está no futuro (com 5 min de tolerância). */
export function isNotInFuture(value: string, now: Date = new Date()): boolean {
  const time = parseDate(value).getTime()
  if (Number.isNaN(time)) return false
  return time <= now.getTime() + FUTURE_TOLERANCE_MS
}

/** Data/hora atual em ISO — base do preenchimento automático de `occurred_at`. */
export function nowISO(): string {
  return new Date().toISOString()
}

/** Valor para `<input type="datetime-local">`, no fuso local. */
export function toDateTimeLocalValue(value: string | Date = new Date()): string {
  const date = parseDate(value)
  return format(date, "yyyy-MM-dd'T'HH:mm")
}

/** Valor para `<input type="date">`, no fuso local. */
export function toDateValue(value: string | Date = new Date()): string {
  const date = parseDate(value)
  return format(date, 'yyyy-MM-dd')
}

/** Converte o valor de um input local para ISO/UTC, que é o que o banco guarda. */
export function fromDateTimeLocalValue(value: string): string {
  return parseDate(value).toISOString()
}

/** Ex.: "20/08/2026 às 14:32" */
export function formatDateTime(value: string | Date): string {
  const date = parseDate(value)
  return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
}

/** Ex.: "22/10 às 09:00" — dia/mês e hora para rótulos curtos e acessibilidade. */
export function formatShortDateTime(value: string | Date): string {
  const date = parseDate(value)
  return format(date, "dd/MM 'às' HH:mm", { locale: ptBR })
}

/** Ex.: "20/08/2026" */
export function formatDate(value: string | Date): string {
  const date = parseDate(value)
  return format(date, 'dd/MM/yyyy', { locale: ptBR })
}

/** Ex.: "20/10" — dia e mês curtos. */
export function formatShortDate(value: string | Date): string {
  const date = parseDate(value)
  return format(date, 'dd/MM', { locale: ptBR })
}

/** Ex.: "8 horas" — usado para o intervalo desde a exposição. Nunca é causa. */
export function formatInterval(from: string | Date, to: string | Date): string {
  const start = parseDate(from)
  const end = parseDate(to)
  return formatDistanceStrict(end, start, { locale: ptBR })
}

/** Dia da etapa, contado a partir do início do período (o primeiro dia é 1). */
export function dayOfStage(startedAt: string | Date, reference: Date = new Date()): number {
  const start = parseDate(startedAt)
  return differenceInCalendarDays(reference, start) + 1
}

/** Ex.: "14:32" — a hora real do registro, nunca manhã/tarde/noite. */
export function formatTime(value: string | Date): string {
  const date = parseDate(value)
  return format(date, 'HH:mm')
}

/** Cabeçalho de um dia da timeline: "Hoje", "Ontem" ou "quinta-feira, 20/08". */
export function formatDayLabel(value: string | Date, options?: { absolute?: boolean }): string {
  const date = parseDate(value)
  if (!options?.absolute) {
    if (isToday(date)) return 'Hoje'
    if (isYesterday(date)) return 'Ontem'
  }
  return format(date, 'EEEE, dd/MM', { locale: ptBR })
}

/**
 * Distância no tempo em minutos, no formato do 02-arquitetura.md: `8h40`.
 * É só a distância — a leitura clínica é do profissional de saúde.
 */
export function formatElapsedMinutes(minutes: number): string {
  const total = Math.abs(Math.round(minutes))
  if (total < 60) return `${total}min`

  const hours = Math.floor(total / 60)
  const restMinutes = total % 60
  if (hours < 24) {
    return restMinutes === 0 ? `${hours}h` : `${hours}h${String(restMinutes).padStart(2, '0')}`
  }

  const days = Math.floor(hours / 24)
  const restHours = hours % 24
  return restHours === 0 ? `${days}d` : `${days}d${restHours}h`
}

/** Mesmo formato, a partir de dois momentos. */
export function formatElapsed(from: string | Date, to: string | Date): string {
  const start = parseDate(from)
  const end = parseDate(to)
  return formatElapsedMinutes((end.getTime() - start.getTime()) / 60_000)
}

import { format, formatDistanceStrict, differenceInCalendarDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'

/** Data/hora atual em ISO — base do preenchimento automático de `occurred_at`. */
export function nowISO(): string {
  return new Date().toISOString()
}

/** Valor para `<input type="datetime-local">`, no fuso local. */
export function toDateTimeLocalValue(value: string | Date = new Date()): string {
  const date = typeof value === 'string' ? new Date(value) : value
  return format(date, "yyyy-MM-dd'T'HH:mm")
}

/** Valor para `<input type="date">`, no fuso local. */
export function toDateValue(value: string | Date = new Date()): string {
  const date = typeof value === 'string' ? new Date(value) : value
  return format(date, 'yyyy-MM-dd')
}

/** Converte o valor de um input local para ISO/UTC, que é o que o banco guarda. */
export function fromDateTimeLocalValue(value: string): string {
  return new Date(value).toISOString()
}

/** Ex.: "20/08/2026 às 14:32" */
export function formatDateTime(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value
  return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
}

/** Ex.: "20/08/2026" */
export function formatDate(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value
  return format(date, 'dd/MM/yyyy', { locale: ptBR })
}

/** Ex.: "8 horas" — usado para o intervalo desde a exposição. Nunca é causa. */
export function formatInterval(from: string | Date, to: string | Date): string {
  const start = typeof from === 'string' ? new Date(from) : from
  const end = typeof to === 'string' ? new Date(to) : to
  return formatDistanceStrict(end, start, { locale: ptBR })
}

/** Dia da etapa, contado a partir do início do período (o primeiro dia é 1). */
export function dayOfStage(startedAt: string | Date, reference: Date = new Date()): number {
  const start = typeof startedAt === 'string' ? new Date(startedAt) : startedAt
  return differenceInCalendarDays(reference, start) + 1
}

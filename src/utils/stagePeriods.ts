import type { StageHistory } from '@/types/domain'

/** Desfechos que fecham o TPO — depois deles o protocolo não tem etapa vigente. */
const TERMINAL_OUTCOMES = new Set(['paused', 'finished', 'interrupted'])

/** Início do minuto: o campo de data/hora da tela não tem segundos. */
export function minuteFloor(iso: string): number {
  const time = new Date(iso).getTime()
  return time - (time % 60_000)
}

/**
 * Etapa vigente num instante, segundo o histórico de um protocolo.
 * `null` quando o instante é anterior ao início do TPO ou posterior ao seu
 * encerramento — nesses casos o registro não pertence a nenhuma etapa.
 */
export function stageAtTime(periods: readonly StageHistory[], iso: string): number | null {
  const time = new Date(iso).getTime()
  if (Number.isNaN(time)) return null
  const period = periods
    .toSorted((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())
    .find((item) => minuteFloor(item.started_at) <= time)
  if (!period) return null
  if (
    period.ended_at &&
    period.outcome &&
    TERMINAL_OUTCOMES.has(period.outcome) &&
    time > new Date(period.ended_at).getTime()
  ) {
    return null
  }
  return period.stage
}

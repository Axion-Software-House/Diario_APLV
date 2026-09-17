import { subDays } from 'date-fns'
import type { TimelineSources } from '@/utils/timeline'
import type { Protocol } from '@/types'

export type ReportPeriodId = 'today' | '7d' | '14d' | '30d' | 'all' | 'tpo'

export const REPORT_PERIODS: readonly { id: ReportPeriodId; label: string }[] = [
  { id: 'today', label: 'Hoje' },
  { id: '7d', label: '7 dias' },
  { id: '14d', label: '14 dias' },
  { id: '30d', label: '30 dias' },
  { id: 'all', label: 'Todo o acompanhamento' },
  { id: 'tpo', label: 'TPO atual' },
] as const

/** Início do dia local. */
function startOfToday(now: Date): Date {
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  return start
}

/**
 * `from = null` significa "sem limite inicial" (todo o histórico). O
 * relatório está disponível desde o primeiro registro — nenhuma opção
 * exige um mínimo de dias de uso (README FINAL §19).
 */
export function periodRange(
  id: ReportPeriodId,
  protocol: Protocol | null,
  now: Date = new Date(),
): { from: Date | null; to: Date } {
  switch (id) {
    case 'today':
      return { from: startOfToday(now), to: now }
    case '7d':
      return { from: subDays(now, 7), to: now }
    case '14d':
      return { from: subDays(now, 14), to: now }
    case '30d':
      return { from: subDays(now, 30), to: now }
    case 'tpo':
      return { from: protocol ? new Date(protocol.started_at) : null, to: now }
    case 'all':
    default:
      return { from: null, to: now }
  }
}

function inRange(iso: string, from: Date | null, to: Date): boolean {
  const time = new Date(iso).getTime()
  return (from === null || time >= from.getTime()) && time <= to.getTime()
}

/**
 * Recorta as origens do diário ao intervalo do relatório. O histórico de
 * etapas fica inteiro — é o contexto que explica os números do período.
 */
export function filterSources(
  sources: TimelineSources,
  from: Date | null,
  to: Date,
): TimelineSources {
  const keep = <T extends { occurred_at: string }>(rows: readonly T[]) =>
    rows.filter((row) => inRange(row.occurred_at, from, to))

  return {
    exposures: keep(sources.exposures),
    symptomEvents: keep(sources.symptomEvents),
    diaperRecords: keep(sources.diaperRecords),
    notes: keep(sources.notes),
    productRecords: keep(sources.productRecords),
    environmentRecords: keep(sources.environmentRecords),
    healthRecords: keep(sources.healthRecords),
    stageHistory: sources.stageHistory,
  }
}

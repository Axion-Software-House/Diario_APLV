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

/** Onde um registro entra no TPO: os dois `null` quando fica fora de qualquer etapa. */
export type StageAssignment = {
  protocolId: string | null
  stage: number | null
}

/**
 * Protocolo e etapa de um registro com data `iso`, segundo o histórico de
 * etapas (`periods` pode trazer todos os TPOs da criança). Os protocolos são
 * tentados na ordem dada e vale o primeiro em que a data cai dentro de uma
 * etapa; repetidos e `null` são ignorados. Nenhum serve → fora do TPO.
 */
export function stageAssignmentAt(
  periods: readonly StageHistory[],
  protocolIds: readonly (string | null | undefined)[],
  iso: string,
): StageAssignment {
  const seen = new Set<string>()
  for (const protocolId of protocolIds) {
    if (!protocolId || seen.has(protocolId)) continue
    seen.add(protocolId)
    const stage = stageAtTime(
      periods.filter((period) => period.protocol_id === protocolId),
      iso,
    )
    if (stage !== null) return { protocolId, stage }
  }
  return { protocolId: null, stage: null }
}

/**
 * Colunas `protocol_id`/`stage` de um update. Só entram quando o patch as
 * traz: ausentes (`undefined`), a etapa gravada fica como está; `null` tira o
 * registro do TPO.
 */
export function stageUpdateColumns(patch: Partial<StageAssignment>): {
  protocol_id?: string | null
  stage?: number | null
} {
  return {
    ...(patch.protocolId !== undefined ? { protocol_id: patch.protocolId } : {}),
    ...(patch.stage !== undefined ? { stage: patch.stage } : {}),
  }
}

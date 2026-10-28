import { isSameDay } from 'date-fns'
import {
  latestMeasuresFrom,
  listActiveTreatments,
  readHealthData,
  readMeasure,
} from '@/constants/health'
import type { ActiveMedicationTreatment, LatestMeasures, MeasureKey } from '@/constants/health'
import { formatShortDateTime, formatTime } from '@/utils/dates'
import type { HealthRecord } from '@/types'

/**
 * Resumos da Saúde — funções puras sobre `health_records`, usadas pelo hub
 * `/app/saude` e pelo resumo de cada tela de registro (e reutilizáveis pela
 * Home). Tudo aqui é descritivo: o que foi registrado e cálculos sobre o que
 * foi informado. Nada sugere conduta, dose ou interpretação clínica.
 */

/** Quantos itens as listas curtas mostram. */
export const RECENT_LIMIT = 3

/** Orientações e dúvidas longas aparecem resumidas; o texto inteiro fica no Diário. */
export const EXCERPT_LENGTH = 120

function time(iso: string): number {
  return new Date(iso).getTime()
}

/** Mais recente primeiro; no mesmo instante, o criado por último. */
function byMostRecent(a: HealthRecord, b: HealthRecord): number {
  return time(b.occurred_at) - time(a.occurred_at) || time(b.created_at) - time(a.created_at)
}

/** Corta no limite de palavras e acrescenta reticências. */
export function excerpt(text: string, max: number = EXCERPT_LENGTH): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  const cut = clean.slice(0, max)
  const lastSpace = cut.lastIndexOf(' ')
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`
}

// ── Medicamento ─────────────────────────────────────────────────────────

/**
 * Horário da próxima dose pela conta "última dose registrada + intervalo
 * informado". `null` sem dose registrada ou sem intervalo. É cálculo sobre o
 * que a família informou, não orientação.
 */
export function nextDoseAt(lastDoseAt: string | null, intervalHours: number | null): Date | null {
  if (!lastDoseAt || intervalHours === null || !(intervalHours > 0)) return null
  const last = time(lastDoseAt)
  if (Number.isNaN(last)) return null
  return new Date(last + intervalHours * 3_600_000)
}

/** "18:30" no mesmo dia da referência; "29/10 às 06:30" em outro dia. */
export function formatDoseTime(date: Date, reference: Date = new Date()): string {
  return isSameDay(date, reference) ? formatTime(date) : formatShortDateTime(date)
}

export type TreatmentSummary = {
  treatment: ActiveMedicationTreatment
  /** ISO da próxima dose calculada, ou `null`. */
  nextDoseAt: string | null
  /**
   * "Próxima dose conforme o intervalo informado: 18:30", "Sem dose
   * registrada" ou "Intervalo não informado". Nunca "dê" ou "tome".
   */
  nextDoseLabel: string
}

export function describeNextDose(
  treatment: ActiveMedicationTreatment,
  reference: Date = new Date(),
): TreatmentSummary {
  if (!treatment.lastDoseAt) {
    return { treatment, nextDoseAt: null, nextDoseLabel: 'Sem dose registrada' }
  }
  const next = nextDoseAt(treatment.lastDoseAt, treatment.intervalHours)
  if (!next) {
    return { treatment, nextDoseAt: null, nextDoseLabel: 'Intervalo não informado' }
  }
  return {
    treatment,
    nextDoseAt: next.toISOString(),
    nextDoseLabel: `Próxima dose conforme o intervalo informado: ${formatDoseTime(next, reference)}`,
  }
}

/** Tratamentos ativos, cada um com a próxima dose calculada. */
export function summarizeTreatments(
  records: readonly HealthRecord[],
  reference: Date = new Date(),
): TreatmentSummary[] {
  return listActiveTreatments(records, reference).map((treatment) =>
    describeNextDose(treatment, reference),
  )
}

export type DoseItem = {
  id: string
  name: string
  occurredAt: string
  dose: string | null
}

/**
 * Últimas doses registradas: as de tratamento e as avulsas (e as antigas,
 * de antes dos tratamentos, que não têm `entryType`). O início de um
 * tratamento não é dose.
 */
export function recentDoses(
  records: readonly HealthRecord[],
  reference: Date = new Date(),
  limit: number = RECENT_LIMIT,
): DoseItem[] {
  return records
    .filter(
      (record) =>
        record.kind === 'medication' &&
        readHealthData(record).entryType !== 'treatment' &&
        time(record.occurred_at) <= reference.getTime(),
    )
    .toSorted(byMostRecent)
    .slice(0, limit)
    .map((record) => ({
      id: record.id,
      name: record.title ?? 'Medicamento',
      occurredAt: record.occurred_at,
      dose: readHealthData(record).dose ?? null,
    }))
}

// ── Vacina ──────────────────────────────────────────────────────────────

export type VaccineItem = {
  id: string
  name: string
  occurredAt: string
  reaction: string | null
}

/** Últimas vacinas registradas, da mais recente para a mais antiga. */
export function recentVaccines(
  records: readonly HealthRecord[],
  reference: Date = new Date(),
  limit: number = RECENT_LIMIT,
): VaccineItem[] {
  return records
    .filter(
      (record) => record.kind === 'vaccine' && time(record.occurred_at) <= reference.getTime(),
    )
    .toSorted(byMostRecent)
    .slice(0, limit)
    .map((record) => {
      const { reaction } = readHealthData(record)
      return {
        id: record.id,
        name: record.title ?? 'Vacina',
        occurredAt: record.occurred_at,
        reaction: reaction ? excerpt(reaction) : null,
      }
    })
}

// ── Consulta ────────────────────────────────────────────────────────────

export type AppointmentItem = {
  id: string
  specialty: string
  occurredAt: string
  /** Resumidas em `EXCERPT_LENGTH` caracteres. */
  guidance: string | null
  questions: string | null
}

function toAppointment(record: HealthRecord): AppointmentItem {
  const { guidance, questions } = readHealthData(record)
  return {
    id: record.id,
    specialty: record.title ?? 'Consulta',
    occurredAt: record.occurred_at,
    guidance: guidance ? excerpt(guidance) : null,
    questions: questions ? excerpt(questions) : null,
  }
}

/** A consulta futura mais próxima (a família registra a data para anotar dúvidas). */
export function nextAppointment(
  records: readonly HealthRecord[],
  reference: Date = new Date(),
): AppointmentItem | null {
  const next = records
    .filter(
      (record) => record.kind === 'appointment' && time(record.occurred_at) > reference.getTime(),
    )
    .toSorted((a, b) => time(a.occurred_at) - time(b.occurred_at))[0]
  return next ? toAppointment(next) : null
}

/** Últimas consultas que já aconteceram, da mais recente para a mais antiga. */
export function recentAppointments(
  records: readonly HealthRecord[],
  reference: Date = new Date(),
  limit: number = RECENT_LIMIT,
): AppointmentItem[] {
  return records
    .filter(
      (record) => record.kind === 'appointment' && time(record.occurred_at) <= reference.getTime(),
    )
    .toSorted(byMostRecent)
    .slice(0, limit)
    .map(toAppointment)
}

// ── Peso e medidas ──────────────────────────────────────────────────────

export type GrowthPoint = {
  id: string
  occurredAt: string
  value: number
}

/**
 * Série de uma medida no tempo, da mais antiga para a mais recente — a base
 * do gráfico de crescimento. Só o que foi registrado: sem curva de
 * referência, sem interpolação.
 */
export function growthSeries(
  records: readonly HealthRecord[],
  key: MeasureKey,
  reference: Date = new Date(),
): GrowthPoint[] {
  return records
    .filter((record) => record.kind === 'weight' && time(record.occurred_at) <= reference.getTime())
    .flatMap((record) => {
      const value = readMeasure(readHealthData(record), key)
      return value === null ? [] : [{ record, value }]
    })
    .toSorted((a, b) => byMostRecent(b.record, a.record))
    .map(({ record, value }) => ({ id: record.id, occurredAt: record.occurred_at, value }))
}

// ── Painel do hub ───────────────────────────────────────────────────────

export type HealthOverview = {
  treatments: TreatmentSummary[]
  nextAppointment: AppointmentItem | null
  latestVaccine: VaccineItem | null
  latestMeasures: LatestMeasures | null
  weightSeries: GrowthPoint[]
  lengthSeries: GrowthPoint[]
}

/**
 * O "Resumo da saúde" do hub. Só faz sentido com os registros já carregados:
 * com a lista vazia por carregamento ou erro, "Nenhuma vacina registrada"
 * seria uma afirmação falsa. Quem chama confere o estado da leitura antes.
 */
export function buildHealthOverview(
  records: readonly HealthRecord[],
  reference: Date = new Date(),
): HealthOverview {
  const measured = records.filter((record) => time(record.occurred_at) <= reference.getTime())
  return {
    treatments: summarizeTreatments(records, reference),
    nextAppointment: nextAppointment(records, reference),
    latestVaccine: recentVaccines(records, reference, 1)[0] ?? null,
    latestMeasures: latestMeasuresFrom(measured),
    weightSeries: growthSeries(records, 'kg', reference),
    lengthSeries: growthSeries(records, 'lengthCm', reference),
  }
}

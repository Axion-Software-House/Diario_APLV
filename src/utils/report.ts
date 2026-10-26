import { EXPOSURE_DAIRY_OPTIONS } from '@/constants/exposure'
import { FEEDING_OPTIONS } from '@/constants/feeding'
import { formatKg, latestWeightFrom, listActiveTreatments } from '@/constants/health'
import type { ActiveMedicationTreatment } from '@/constants/health'
import { STAGES, stageLabel } from '@/constants/stages'
import { INTENSITIES, SYMPTOMS } from '@/constants/symptoms'
import { formatShortDate } from '@/utils/dates'
import { differenceInCalendarDays } from 'date-fns'
import type { TimelineSources } from '@/utils/timeline'
import type { Child, HealthRecord, Protocol } from '@/types'

const SYMPTOM_LABELS = new Map(SYMPTOMS.map((symptom) => [symptom.code, symptom.label]))
const INTENSITY_LABELS = new Map(INTENSITIES.map((item) => [item.value, item.label]))
const DAIRY_LABELS = new Map(EXPOSURE_DAIRY_OPTIONS.map((option) => [option.value, option.label]))
const FEEDING_LABELS = new Map<string, string>(
  FEEDING_OPTIONS.map((option) => [option.code, option.label]),
)

/** Contagens de uma etapa, a partir do `stage` gravado em cada evento. */
export type StageSummary = {
  stage: number
  label: string
  /** Dias somados dos períodos vividos nesta etapa. `0` se nunca foi alcançada. */
  days: number
  exposures: number
  symptoms: number
  noSymptoms: number
  diapers: number
  notes: number
  /** Quantas vezes a família esteve nesta etapa. */
  periods: number
}

/**
 * Uma linha por sintoma marcado em evento vinculado a uma exposição.
 * `minutes` é distância no tempo — a interpretação é do profissional.
 */
export type TemporalityRow = {
  occurredAt: string
  symptom: string
  intensity: string
  minutes: number
  exposureFood: string
  exposureDairy: string | null
}

export type ReportCounts = {
  exposures: number
  exposuresDairyYes: number
  exposuresDairyNo: number
  exposuresDairyUnknown: number
  symptoms: number
  noSymptoms: number
  diapers: number
  notes: number
  products: number
  environments: number
  health: number
}

export type Report = {
  childName: string
  birthDate: string | null
  feeding: string | null
  /** Ex.: "7,85 kg em 20/10" ou `null` quando ainda não há peso registrado. */
  latestWeight: string | null
  reason: string | null
  professional: string | null
  startedAt: string
  /** Fim do período coberto: hoje, para um acompanhamento em curso. */
  endedAt: string | null
  /** `null` quando não há TPO em andamento. */
  currentStage: number | null
  currentStageLabel: string | null
  /** `true` quando a criança tem (ou teve) um TPO — habilita o resumo por etapa. */
  hasTpo: boolean
  totals: ReportCounts
  activeTreatments: ActiveMedicationTreatment[]
  stages: StageSummary[]
  temporality: TemporalityRow[]
}

function daysOfPeriod(startedAt: string, endedAt: string | null, reference: Date): number {
  const end = endedAt ? new Date(endedAt) : reference
  return differenceInCalendarDays(end, new Date(startedAt)) + 1
}

/** Momento do primeiro registro do diário — base do período quando não há TPO. */
function earliestOccurrence(sources: TimelineSources): string | null {
  const stamps = [
    ...sources.exposures.map((item) => item.occurred_at),
    ...sources.symptomEvents.map((item) => item.occurred_at),
    ...sources.diaperRecords.map((item) => item.occurred_at),
    ...sources.notes.map((item) => item.occurred_at),
    ...sources.productRecords.map((item) => item.occurred_at),
    ...sources.environmentRecords.map((item) => item.occurred_at),
    ...sources.healthRecords.map((item) => item.occurred_at),
    ...sources.stageHistory.map((item) => item.started_at),
  ]
  if (stamps.length === 0) return null
  return stamps.reduce((min, current) => (current < min ? current : min))
}

/** Escada usada no resumo por etapa — de `tpo_stages`, com fallback nos constants. */
export type ReportStage = { id: number; label: string }

const FALLBACK_STAGES: ReportStage[] = STAGES.map((stage) => ({ id: stage.id, label: stage.label }))

export function buildReport(
  sources: TimelineSources,
  child: Child,
  protocol: Protocol | null,
  range?: { from: Date | null; to: Date },
  tpoStages: readonly ReportStage[] = FALLBACK_STAGES,
  reference: Date = new Date(),
  allHealthRecords: readonly HealthRecord[] = sources.healthRecords,
): Report {
  const {
    exposures,
    symptomEvents,
    diaperRecords,
    notes,
    productRecords,
    environmentRecords,
    healthRecords,
    stageHistory,
  } = sources

  const withSymptoms = symptomEvents.filter((event) => !event.no_symptoms)
  const withoutSymptoms = symptomEvents.filter((event) => event.no_symptoms)

  const hasTpo = protocol !== null || stageHistory.length > 0

  const stages = hasTpo
    ? tpoStages.map<StageSummary>((stage) => {
        const periods = stageHistory.filter((period) => period.stage === stage.id)
        return {
          stage: stage.id,
          label: stage.label,
          days: periods.reduce(
            (total, period) => total + daysOfPeriod(period.started_at, period.ended_at, reference),
            0,
          ),
          periods: periods.length,
          exposures: exposures.filter((item) => item.stage === stage.id).length,
          symptoms: withSymptoms.filter((item) => item.stage === stage.id).length,
          noSymptoms: withoutSymptoms.filter((item) => item.stage === stage.id).length,
          diapers: diaperRecords.filter((item) => item.stage === stage.id).length,
          notes: notes.filter((item) => item.stage === stage.id).length,
        }
      })
    : []

  const exposureById = new Map(exposures.map((exposure) => [exposure.id, exposure]))

  const temporality = withSymptoms
    .flatMap<TemporalityRow>((event) => {
      const exposure = event.exposure_id ? exposureById.get(event.exposure_id) : undefined
      if (!exposure) return []

      const minutes = Math.round(
        (new Date(event.occurred_at).getTime() - new Date(exposure.occurred_at).getTime()) / 60_000,
      )
      const exposureDairy = exposure.contains_dairy
        ? (DAIRY_LABELS.get(exposure.contains_dairy) ?? null)
        : null

      return event.items.map((item) => ({
        occurredAt: event.occurred_at,
        symptom: SYMPTOM_LABELS.get(item.code) ?? item.code,
        intensity: INTENSITY_LABELS.get(item.intensity as 1 | 2 | 3) ?? String(item.intensity),
        minutes,
        exposureFood: exposure.food,
        exposureDairy,
      }))
    })
    .toSorted((a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime())

  const startedAt =
    range?.from?.toISOString() ??
    protocol?.started_at ??
    earliestOccurrence(sources) ??
    child.created_at

  const endedAt = range ? range.to.toISOString() : (protocol?.ended_at ?? null)

  const weightCandidates = range
    ? allHealthRecords.filter(
        (record) => new Date(record.occurred_at).getTime() <= range.to.getTime(),
      )
    : allHealthRecords
  const weight = latestWeightFrom(weightCandidates)

  return {
    childName: child.name,
    birthDate: child.birth_date,
    feeding: child.feeding ? (FEEDING_LABELS.get(child.feeding) ?? child.feeding) : null,
    latestWeight: weight ? `${formatKg(weight.kg)} em ${formatShortDate(weight.occurredAt)}` : null,
    reason: child.reason,
    professional: child.professional,
    startedAt,
    endedAt,
    currentStage: protocol?.current_stage ?? null,
    currentStageLabel: protocol
      ? (tpoStages.find((stage) => stage.id === protocol.current_stage)?.label ??
        stageLabel(protocol.current_stage))
      : null,
    hasTpo,
    totals: {
      exposures: exposures.length,
      exposuresDairyYes: exposures.filter((item) => item.contains_dairy === 'sim').length,
      exposuresDairyNo: exposures.filter((item) => item.contains_dairy === 'nao').length,
      exposuresDairyUnknown: exposures.filter((item) => item.contains_dairy === 'nao_sei').length,
      symptoms: withSymptoms.length,
      noSymptoms: withoutSymptoms.length,
      diapers: diaperRecords.length,
      notes: notes.length,
      products: productRecords.length,
      environments: environmentRecords.length,
      health: healthRecords.length,
    },
    activeTreatments: listActiveTreatments(healthRecords, reference),
    stages,
    temporality,
  }
}

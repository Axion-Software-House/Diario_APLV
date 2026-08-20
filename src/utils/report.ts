import { STAGES, stageLabel } from '@/constants/stages'
import { INTENSITIES, SYMPTOMS } from '@/constants/symptoms'
import { FEEDING_OPTIONS } from '@/constants/feeding'
import { differenceInCalendarDays } from 'date-fns'
import type { TimelineSources } from '@/utils/timeline'
import type { Child, Protocol } from '@/types'

const SYMPTOM_LABELS = new Map(SYMPTOMS.map((symptom) => [symptom.code, symptom.label]))
const INTENSITY_LABELS = new Map(INTENSITIES.map((item) => [item.value, item.label]))
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
}

export type ReportCounts = {
  exposures: number
  symptoms: number
  noSymptoms: number
  diapers: number
  notes: number
}

export type Report = {
  childName: string
  birthDate: string | null
  feeding: string | null
  reason: string | null
  professional: string | null
  startedAt: string
  /** Fim do período coberto: hoje, para um acompanhamento em curso. */
  endedAt: string | null
  currentStage: number
  currentStageLabel: string
  totals: ReportCounts
  stages: StageSummary[]
  temporality: TemporalityRow[]
}

function daysOfPeriod(startedAt: string, endedAt: string | null, reference: Date): number {
  const end = endedAt ? new Date(endedAt) : reference
  return differenceInCalendarDays(end, new Date(startedAt)) + 1
}

export function buildReport(
  sources: TimelineSources,
  child: Child,
  protocol: Protocol,
  reference: Date = new Date(),
): Report {
  const { exposures, symptomEvents, diaperRecords, notes, stageHistory } = sources

  const withSymptoms = symptomEvents.filter((event) => !event.no_symptoms)
  const withoutSymptoms = symptomEvents.filter((event) => event.no_symptoms)

  const stages = STAGES.map<StageSummary>((stage) => {
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

  const exposureById = new Map(exposures.map((exposure) => [exposure.id, exposure]))

  const temporality = withSymptoms
    .flatMap<TemporalityRow>((event) => {
      const exposure = event.exposure_id ? exposureById.get(event.exposure_id) : undefined
      if (!exposure) return []

      const minutes = Math.round(
        (new Date(event.occurred_at).getTime() - new Date(exposure.occurred_at).getTime()) / 60_000,
      )

      return event.items.map((item) => ({
        occurredAt: event.occurred_at,
        symptom: SYMPTOM_LABELS.get(item.code) ?? item.code,
        intensity: INTENSITY_LABELS.get(item.intensity as 1 | 2 | 3) ?? String(item.intensity),
        minutes,
        exposureFood: exposure.food,
      }))
    })
    .toSorted((a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime())

  return {
    childName: child.name,
    birthDate: child.birth_date,
    feeding: child.feeding ? (FEEDING_LABELS.get(child.feeding) ?? child.feeding) : null,
    reason: protocol.reason,
    professional: protocol.professional,
    startedAt: protocol.started_at,
    endedAt: protocol.ended_at,
    currentStage: protocol.current_stage,
    currentStageLabel: stageLabel(protocol.current_stage),
    totals: {
      exposures: exposures.length,
      symptoms: withSymptoms.length,
      noSymptoms: withoutSymptoms.length,
      diapers: diaperRecords.length,
      notes: notes.length,
    },
    stages,
    temporality,
  }
}

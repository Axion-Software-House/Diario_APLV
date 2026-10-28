import { differenceInCalendarDays, parseISO, startOfDay } from 'date-fns'
import { EXPOSURE_DAIRY_OPTIONS } from '@/constants/exposure'
import { FEEDING_OPTIONS } from '@/constants/feeding'
import {
  formatKg,
  latestWeightFrom,
  listActiveTreatments,
  readHealthData,
} from '@/constants/health'
import type { ActiveMedicationTreatment } from '@/constants/health'
import { STAGES, stageLabel } from '@/constants/stages'
import { INTENSITIES, SYMPTOMS } from '@/constants/symptoms'
import { formatShortDate } from '@/utils/dates'
import { isResumedPeriod, previousInProtocol } from '@/utils/timeline'
import type { TimelineSources } from '@/utils/timeline'
import type { Child, HealthRecord, Protocol, StageHistory } from '@/types'

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
  /**
   * Dias de calendário vividos nesta etapa, somando os períodos sem contar o
   * mesmo dia duas vezes. Os dias em que o TPO ficou pausado ficam de fora:
   * a pausa fecha o período e a retomada abre outro. `0` se nunca foi alcançada.
   */
  days: number
  exposures: number
  symptoms: number
  noSymptoms: number
  diapers: number
  notes: number
  /**
   * Quantas vezes a família esteve nesta etapa. A retomada depois de uma
   * pausa continua a mesma passagem pela etapa e não conta como outra.
   */
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

/** Consulta agendada para data futura (com dúvidas anotadas para levar ao médico). */
export type UpcomingAppointment = {
  id: string
  occurredAt: string
  specialty: string | null
  guidance: string | null
  questions: string | null
  note: string | null
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
  /**
   * Tratamentos em andamento na data final do relatório, inclusive os
   * iniciados antes do período. Aqui `doseCount` conta só as doses
   * registradas DENTRO do período, como os demais números do relatório.
   */
  activeTreatments: ActiveMedicationTreatment[]
  stages: StageSummary[]
  temporality: TemporalityRow[]
  /** Consultas registradas com data futura, exibidas como "Próxima consulta" no Relatório. */
  upcomingAppointments: UpcomingAppointment[]
}

/**
 * Dias de calendário cobertos pelos períodos. Intervalos que se tocam no
 * mesmo dia (pausa e retomada no mesmo dia, ou "Repetiu") são unidos antes
 * da soma, para o dia não contar duas vezes. O intervalo entre o fim de um
 * período e o começo do próximo — a pausa — não entra.
 */
function daysOfPeriods(periods: readonly StageHistory[], reference: Date): number {
  const spans = periods
    .map((period) => ({
      start: startOfDay(parseISO(period.started_at)),
      end: startOfDay(period.ended_at ? parseISO(period.ended_at) : reference),
    }))
    .toSorted((a, b) => a.start.getTime() - b.start.getTime())

  const merged: { start: Date; end: Date }[] = []
  for (const span of spans) {
    const last = merged.at(-1)
    if (last && span.start.getTime() <= last.end.getTime()) {
      if (span.end.getTime() > last.end.getTime()) last.end = span.end
    } else {
      merged.push({ ...span })
    }
  }

  return merged.reduce(
    (total, span) => total + Math.max(0, differenceInCalendarDays(span.end, span.start) + 1),
    0,
  )
}

/** Momento do primeiro registro do diário — base do período em Todo o acompanhamento ou quando não há TPO. */
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
  const previousById = previousInProtocol(stageHistory)

  const stages = hasTpo
    ? tpoStages.map<StageSummary>((stage) => {
        const periods = stageHistory.filter((period) => period.stage === stage.id)
        return {
          stage: stage.id,
          label: stage.label,
          days: daysOfPeriods(periods, reference),
          periods: periods.filter((period) => !isResumedPeriod(period, previousById.get(period.id)))
            .length,
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
    earliestOccurrence(sources) ??
    protocol?.started_at ??
    child.created_at

  const endedAt = range ? range.to.toISOString() : (protocol?.ended_at ?? null)

  const cutoffTime = (range?.to ?? reference).getTime()
  const healthUntilCutoff = allHealthRecords.filter(
    (record) => new Date(record.occurred_at).getTime() <= cutoffTime,
  )
  const weight = latestWeightFrom(healthUntilCutoff)

  // Um tratamento contínuo iniciado antes do período continua ativo nele:
  // a lista sai de todos os registros até o fim do período, não do recorte.
  const dosesInPeriod = new Map<string, number>()
  for (const record of healthRecords) {
    if (record.kind !== 'medication') continue
    const data = readHealthData(record)
    if (data.entryType === 'dose' && data.treatmentId) {
      dosesInPeriod.set(data.treatmentId, (dosesInPeriod.get(data.treatmentId) ?? 0) + 1)
    }
  }
  const activeTreatments = listActiveTreatments(healthUntilCutoff, reference).map((treatment) => ({
    ...treatment,
    doseCount: dosesInPeriod.get(treatment.record.id) ?? 0,
  }))

  const upcomingAppointments = allHealthRecords
    .filter(
      (record) =>
        record.kind === 'appointment' && new Date(record.occurred_at).getTime() > cutoffTime,
    )
    .toSorted((a, b) => new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime())
    .map<UpcomingAppointment>((record) => {
      const data = readHealthData(record)
      return {
        id: record.id,
        occurredAt: record.occurred_at,
        specialty: record.title,
        guidance: data.guidance ?? null,
        questions: data.questions ?? null,
        note: record.note,
      }
    })

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
    activeTreatments,
    stages,
    temporality,
    upcomingAppointments,
  }
}

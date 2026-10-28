import {
  formatKg,
  formatMedicationInterval,
  latestWeightFrom,
  listActiveTreatments,
  readHealthData,
} from '@/constants/health'
import { INTENSITIES, SYMPTOMS } from '@/constants/symptoms'
import { formatDate, formatDateTime, formatTime, toDateValue } from '@/utils/dates'
import type { TimelineSources } from '@/utils/timeline'
import type { HealthRecord } from '@/types'

const SYMPTOM_LABELS = new Map(SYMPTOMS.map((symptom) => [symptom.code, symptom.label]))
const INTENSITY_LABELS = new Map(INTENSITIES.map((item) => [item.value, item.label]))

export type HomeSummary = {
  todayCount: number
  todayLabel: string
  latestWeightLabel: string
  activeTreatmentLabel: string
  latestSymptomsLabel: string
}

function byMostRecent(a: { occurred_at: string }, b: { occurred_at: string }): number {
  return new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime()
}

/** Registro que pertence a um tratamento — nunca dose avulsa nem registro antigo sem tipo. */
function isTreatmentEntry(record: HealthRecord): boolean {
  if (record.kind !== 'medication') return false
  const { entryType } = readHealthData(record)
  return entryType === 'treatment' || entryType === 'dose'
}

function summarizeActiveTreatments(
  healthRecords: readonly HealthRecord[],
  todayKey: string,
  reference: Date,
): string {
  const active = listActiveTreatments(healthRecords, reference)

  if (active.length > 0) {
    return active
      .map((treatment) => {
        const details = [
          treatment.dose ?? undefined,
          formatMedicationInterval(treatment.intervalHours ?? undefined),
        ]
          .filter(Boolean)
          .join(' · ')
        return details ? `${treatment.name} (${details})` : treatment.name
      })
      .join(', ')
  }

  // Nenhum tratamento em andamento, mas um tratamento teve registro hoje
  // (ex.: encerrado depois da dose da manhã). O texto não o chama de ativo.
  const latestToday = healthRecords
    .filter((record) => isTreatmentEntry(record) && toDateValue(record.occurred_at) === todayKey)
    .toSorted(byMostRecent)[0]

  if (latestToday) {
    const name = latestToday.title ?? 'Medicamento'
    return `Nenhum em andamento (${name}: último registro hoje às ${formatTime(latestToday.occurred_at)})`
  }

  return 'Nenhum no momento'
}

/**
 * Monta o resumo rápido exibido no topo da Home ao abrir o app:
 * registros de hoje, último peso, tratamento ativo e últimos sintomas.
 *
 * Só faz sentido com o diário já carregado: com `sources` vazio por
 * carregamento ou erro, "Nenhum sintoma registrado" seria uma afirmação
 * falsa. Quem chama confere `loading` e `errorMessage` antes.
 */
export function buildHomeSummary(
  sources: TimelineSources,
  reference: Date = new Date(),
): HomeSummary {
  const todayKey = toDateValue(reference)

  const allStamps = [
    ...sources.exposures.map((item) => item.occurred_at),
    ...sources.symptomEvents.map((item) => item.occurred_at),
    ...sources.diaperRecords.map((item) => item.occurred_at),
    ...sources.notes.map((item) => item.occurred_at),
    ...sources.productRecords.map((item) => item.occurred_at),
    ...sources.environmentRecords.map((item) => item.occurred_at),
    ...sources.healthRecords.map((item) => item.occurred_at),
  ]

  const todayCount = allStamps.filter((stamp) => toDateValue(stamp) === todayKey).length
  const todayLabel =
    todayCount === 0
      ? 'Nenhum registro hoje'
      : todayCount === 1
        ? '1 registro hoje'
        : `${todayCount} registros hoje`

  const latestWeight = latestWeightFrom(sources.healthRecords)
  const latestWeightLabel = latestWeight
    ? `${formatKg(latestWeight.kg)} em ${formatDate(latestWeight.occurredAt)}`
    : 'Não registrado'

  const activeTreatmentLabel = summarizeActiveTreatments(
    sources.healthRecords,
    todayKey,
    reference,
  )

  const latestSymptomEvent = sources.symptomEvents
    .filter((event) => !event.no_symptoms && event.items.length > 0)
    .toSorted(byMostRecent)[0]

  const latestSymptomsLabel = latestSymptomEvent
    ? `${latestSymptomEvent.items
        .map((item) => {
          const label = SYMPTOM_LABELS.get(item.code) ?? item.code
          const intensity = INTENSITY_LABELS.get(item.intensity as 1 | 2 | 3)
          return intensity ? `${label} (${intensity})` : label
        })
        .join(' · ')} (${formatDateTime(latestSymptomEvent.occurred_at)})`
    : 'Nenhum sintoma registrado'

  return {
    todayCount,
    todayLabel,
    latestWeightLabel,
    activeTreatmentLabel,
    latestSymptomsLabel,
  }
}

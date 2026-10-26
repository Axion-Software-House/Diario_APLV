import { differenceInCalendarDays } from 'date-fns'
import { readHealthData } from '@/constants/health'
import { INTENSITIES, SYMPTOMS } from '@/constants/symptoms'
import { formatDate, formatDateTime, formatTime, toDateValue } from '@/utils/dates'
import type { TimelineSources } from '@/utils/timeline'
import type { HealthRecord } from '@/types'

const SYMPTOM_LABELS = new Map(SYMPTOMS.map((symptom) => [symptom.code, symptom.label]))
const INTENSITY_LABELS = new Map(INTENSITIES.map((item) => [item.value, item.label]))

type MedicationData = {
  entryType?: 'treatment' | 'dose' | 'single'
  dose?: string
  intervalHours?: number
  durationMode?: 'days' | 'continuous'
  durationDays?: number
  endedAt?: string
}

export type HomeSummary = {
  todayCount: number
  todayLabel: string
  latestWeightLabel: string
  activeTreatmentLabel: string
  latestSymptomsLabel: string
}

function formatWeightKg(kg: number): string {
  return `${String(kg).replace('.', ',')} kg`
}

function summarizeActiveTreatments(
  healthRecords: readonly HealthRecord[],
  todayKey: string,
  reference: Date,
): string {
  const medications = healthRecords.filter((item) => item.kind === 'medication')

  const activeTreatments = medications.filter((record) => {
    const data = readHealthData(record) as MedicationData
    if (data.entryType !== 'treatment' || data.endedAt) return false
    if (data.durationMode === 'continuous') return true
    if (typeof data.durationDays === 'number' && data.durationDays > 0) {
      const currentDay = Math.max(
        1,
        differenceInCalendarDays(reference, new Date(record.occurred_at)) + 1,
      )
      return currentDay <= data.durationDays
    }
    return true
  })

  if (activeTreatments.length > 0) {
    return activeTreatments
      .map((record) => {
        const data = readHealthData(record) as MedicationData
        const name = record.title ?? 'Medicamento'
        const details = [
          data.dose,
          typeof data.intervalHours === 'number' && data.intervalHours > 0
            ? `de ${data.intervalHours} em ${data.intervalHours}h`
            : undefined,
        ]
          .filter(Boolean)
          .join(' · ')
        return details ? `${name} (${details})` : name
      })
      .join(', ')
  }

  const todayMedication = medications.find(
    (record) => toDateValue(record.occurred_at) === todayKey,
  )
  if (todayMedication) {
    const data = readHealthData(todayMedication)
    const name = todayMedication.title ?? 'Medicamento'
    const dosePart = data.dose ? ` · ${data.dose}` : ''
    return `${name}${dosePart} (hoje às ${formatTime(todayMedication.occurred_at)})`
  }

  return 'Nenhum no momento'
}

/**
 * Monta o resumo rápido exibido no topo da Home ao abrir o app:
 * registros de hoje, último peso, tratamento ativo e últimos sintomas.
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

  const latestWeightRecord = sources.healthRecords
    .filter((item) => item.kind === 'weight' && typeof readHealthData(item).kg === 'number')
    .toSorted((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime())[0]

  const latestWeightKg = latestWeightRecord ? readHealthData(latestWeightRecord).kg : undefined
  const latestWeightLabel =
    latestWeightRecord && typeof latestWeightKg === 'number'
      ? `${formatWeightKg(latestWeightKg)} em ${formatDate(latestWeightRecord.occurred_at)}`
      : 'Não registrado'

  const activeTreatmentLabel = summarizeActiveTreatments(
    sources.healthRecords,
    todayKey,
    reference,
  )

  const latestSymptomEvent = sources.symptomEvents
    .filter((event) => !event.no_symptoms && event.items.length > 0)
    .toSorted((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime())[0]

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

import { DIAPER_BLOOD, DIAPER_CONSISTENCY, DIAPER_MUCUS } from '@/constants/diaper'
import { ENVIRONMENT_PLACE_LABELS } from '@/constants/environments'
import { EXPOSURE_AMOUNTS, EXPOSURE_DAIRY_OPTIONS, FOOD_CONSUMERS } from '@/constants/exposure'
import {
  formatMedicationDuration,
  formatMedicationInterval,
  healthKindMeta,
  readHealthData,
} from '@/constants/health'
import { PRODUCT_CATEGORY_LABELS } from '@/constants/products'
import { OUTCOME_LABELS, stageLabel } from '@/constants/stages'
import { INTENSITIES, SYMPTOMS } from '@/constants/symptoms'
import { toDateValue } from '@/utils/dates'
import type {
  DiaperRecord,
  EnvironmentRecord,
  Exposure,
  HealthRecord,
  Note,
  ProductRecord,
  StageHistory,
  SymptomEventWithItems,
  TimelineEvent,
} from '@/types'

const AMOUNT_LABELS = new Map(EXPOSURE_AMOUNTS.map((option) => [option.value, option.label]))
const CONSUMER_LABELS = new Map(FOOD_CONSUMERS.map((option) => [option.value, option.label]))
const DAIRY_LABELS = new Map(EXPOSURE_DAIRY_OPTIONS.map((option) => [option.value, option.label]))
const SYMPTOM_LABELS = new Map(SYMPTOMS.map((symptom) => [symptom.code, symptom.label]))
const INTENSITY_LABELS = new Map(INTENSITIES.map((item) => [item.value, item.label]))
const BLOOD_LABELS = new Map(DIAPER_BLOOD.map((option) => [option.value, option.label]))
const MUCUS_LABELS = new Map(DIAPER_MUCUS.map((option) => [option.value, option.label]))
const CONSISTENCY_LABELS = new Map(DIAPER_CONSISTENCY.map((option) => [option.value, option.label]))

export type TimelineSources = {
  exposures: readonly Exposure[]
  symptomEvents: readonly SymptomEventWithItems[]
  diaperRecords: readonly DiaperRecord[]
  notes: readonly Note[]
  productRecords: readonly ProductRecord[]
  environmentRecords: readonly EnvironmentRecord[]
  healthRecords: readonly HealthRecord[]
  stageHistory: readonly StageHistory[]
}

function describeHealthTitle(record: HealthRecord): string {
  const data = readHealthData(record)
  if (record.kind === 'medication') {
    if (data.entryType === 'treatment') {
      return record.title ? `Início de tratamento: ${record.title}` : 'Início de tratamento'
    }
    if (data.entryType === 'dose') {
      return record.title ? `Dose dada: ${record.title}` : 'Dose dada'
    }
  }
  const label = healthKindMeta(record.kind)?.label ?? record.kind
  return record.title ? `${label}: ${record.title}` : label
}

function describeHealth(record: HealthRecord): string | undefined {
  const data = readHealthData(record)
  const intervalLabel = formatMedicationInterval(data.intervalHours)
  const durationLabel = formatMedicationDuration(data)
  const parts = [
    data.dose ? `Dose: ${data.dose}` : undefined,
    intervalLabel,
    durationLabel,
    data.endedAt ? 'Tratamento encerrado' : undefined,
    typeof data.kg === 'number' ? `${String(data.kg).replace('.', ',')} kg` : undefined,
    data.reaction ? `Reação: ${data.reaction}` : undefined,
    data.guidance ?? undefined,
    data.questions ? `Dúvidas: ${data.questions}` : undefined,
    record.note ?? undefined,
  ].filter(Boolean)
  return parts.length > 0 ? parts.join(' · ') : undefined
}

/** "Produto novo · Nome · Marca" — só o que a família preencheu. */
function describeProduct(record: ProductRecord): string | undefined {
  const parts = [
    record.is_new === true ? 'Produto novo' : undefined,
    record.name ?? undefined,
    record.brand ?? undefined,
    record.note ?? undefined,
  ].filter(Boolean)
  return parts.length > 0 ? parts.join(' · ') : undefined
}

function describeEnvironment(record: EnvironmentRecord): string | undefined {
  const parts = [record.different ?? undefined, record.note ?? undefined].filter(Boolean)
  return parts.length > 0 ? parts.join(' · ') : undefined
}

/** "Muco nas fezes (Leve) · Vômito (Intensa)" — rótulo do catálogo, nunca o code. */
function describeItems(event: SymptomEventWithItems): string {
  return event.items
    .map((item) => {
      const label = SYMPTOM_LABELS.get(item.code) ?? item.code
      const intensity = INTENSITY_LABELS.get(item.intensity as 1 | 2 | 3)
      return intensity ? `${label} (${intensity})` : label
    })
    .join(' · ')
}

function describeExposure(exposure: Exposure): string | undefined {
  const dairyLabel = exposure.contains_dairy
    ? DAIRY_LABELS.get(exposure.contains_dairy)
    : undefined
  const parts = [
    CONSUMER_LABELS.get(exposure.consumer),
    dairyLabel ? `Leite ou derivados: ${dairyLabel}` : undefined,
    exposure.brand ?? undefined,
    exposure.amount ? AMOUNT_LABELS.get(exposure.amount) : undefined,
    exposure.details ?? undefined,
    exposure.note ?? undefined,
  ].filter(Boolean)
  return parts.length > 0 ? parts.join(' · ') : undefined
}

/** "Sangue: Traços · Muco: Não · Líquida" — os três seletores, na ordem da tela. */
function describeDiaper(record: DiaperRecord): string {
  return [
    `Sangue: ${BLOOD_LABELS.get(record.blood) ?? record.blood}`,
    `Muco: ${MUCUS_LABELS.get(record.mucus) ?? record.mucus}`,
    record.consistency ? CONSISTENCY_LABELS.get(record.consistency) : undefined,
  ]
    .filter(Boolean)
    .join(' · ')
}

function minutesBetween(fromIso: string, toIso: string): number {
  return Math.round((new Date(toIso).getTime() - new Date(fromIso).getTime()) / 60_000)
}

/**
 * Um evento por período de etapa, no instante em que ele começou. Como o
 * período anterior terminou é o que explica esse começo, então o desfecho
 * dele vira o detalhe daqui -- é a mesma virada, contada uma vez só.
 */
function stageEvents(
  history: readonly StageHistory[],
  labelFor: (ordinal: number) => string,
): TimelineEvent[] {
  const ordered = history.toSorted(
    (a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime(),
  )

  return ordered.map((period, index) => {
    const previous = index > 0 ? ordered[index - 1] : undefined
    const detail = [
      previous?.outcome ? (OUTCOME_LABELS[previous.outcome] ?? previous.outcome) : undefined,
      previous?.note ?? undefined,
    ].filter(Boolean)

    return {
      id: period.id,
      kind: 'stage',
      occurredAt: period.started_at,
      stage: period.stage,
      title: `Etapa ${period.stage} — ${labelFor(period.stage)}`,
      detail: detail.length > 0 ? detail.join(' · ') : undefined,
    }
  })
}

/**
 * União no frontend das origens do diário — não existe tabela nem view
 * `timeline` (02-arquitetura.md). Ordena por `occurred_at` decrescente.
 *
 * O intervalo desde o registro vinculado é calculado aqui e nunca gravado:
 * é distância no tempo, não relação de causa.
 */
export function buildTimeline(
  {
    exposures,
    symptomEvents,
    diaperRecords,
    notes,
    productRecords,
    environmentRecords,
    healthRecords,
    stageHistory,
  }: TimelineSources,
  /** Rótulo de uma etapa — vem de `tpo_stages` (fallback: constants). */
  stageLabelFor: (ordinal: number) => string = stageLabel,
): TimelineEvent[] {
  const exposureById = new Map(exposures.map((exposure) => [exposure.id, exposure]))
  const environmentById = new Map(environmentRecords.map((record) => [record.id, record]))
  const productById = new Map(productRecords.map((record) => [record.id, record]))

  const events: TimelineEvent[] = [
    ...exposures.map<TimelineEvent>((exposure) => ({
      id: exposure.id,
      kind: 'exposure',
      occurredAt: exposure.occurred_at,
      stage: exposure.stage,
      title: exposure.food,
      detail: describeExposure(exposure),
    })),
    ...symptomEvents.map<TimelineEvent>((event) => {
      const linkedExposure = event.exposure_id ? exposureById.get(event.exposure_id) : undefined
      const linkedEnvironment = event.environment_id
        ? environmentById.get(event.environment_id)
        : undefined
      const linkedProduct = event.product_id ? productById.get(event.product_id) : undefined
      const items = describeItems(event)

      const linkedRecord = linkedEnvironment
        ? {
            kind: 'environment' as const,
            title: ENVIRONMENT_PLACE_LABELS.get(linkedEnvironment.place) ?? linkedEnvironment.place,
            minutesAfter: minutesBetween(linkedEnvironment.occurred_at, event.occurred_at),
          }
        : linkedProduct
          ? {
              kind: 'product' as const,
              title:
                linkedProduct.name ||
                (PRODUCT_CATEGORY_LABELS.get(linkedProduct.category) ?? linkedProduct.category),
              minutesAfter: minutesBetween(linkedProduct.occurred_at, event.occurred_at),
            }
          : linkedExposure
            ? {
                kind: 'exposure' as const,
                title: linkedExposure.food,
                minutesAfter: minutesBetween(linkedExposure.occurred_at, event.occurred_at),
              }
            : undefined

      return {
        id: event.id,
        kind: event.no_symptoms ? 'no_symptoms' : 'symptom',
        occurredAt: event.occurred_at,
        stage: event.stage,
        title: event.no_symptoms ? 'Sem sintomas' : items,
        detail: event.note ?? undefined,
        ...(linkedExposure
          ? {
              minutesAfterExposure: minutesBetween(linkedExposure.occurred_at, event.occurred_at),
            }
          : {}),
        ...(linkedRecord ? { linkedRecord } : {}),
        ...(event.evolutions && event.evolutions.length > 0
          ? { evolutions: event.evolutions }
          : {}),
      }
    }),
    ...diaperRecords.map<TimelineEvent>((record) => ({
      id: record.id,
      kind: 'diaper',
      occurredAt: record.occurred_at,
      stage: record.stage,
      title: describeDiaper(record),
      detail: record.note ?? undefined,
    })),
    ...notes.map<TimelineEvent>((note) => ({
      id: note.id,
      kind: 'note',
      occurredAt: note.occurred_at,
      stage: note.stage,
      title: note.content,
    })),
    ...productRecords.map<TimelineEvent>((record) => ({
      id: record.id,
      kind: 'product',
      occurredAt: record.occurred_at,
      stage: record.stage,
      title: PRODUCT_CATEGORY_LABELS.get(record.category) ?? record.category,
      detail: describeProduct(record),
    })),
    ...environmentRecords.map<TimelineEvent>((record) => ({
      id: record.id,
      kind: 'environment',
      occurredAt: record.occurred_at,
      stage: record.stage,
      title: ENVIRONMENT_PLACE_LABELS.get(record.place) ?? record.place,
      detail: describeEnvironment(record),
    })),
    ...healthRecords.map<TimelineEvent>((record) => ({
      id: record.id,
      kind: 'health',
      occurredAt: record.occurred_at,
      stage: record.stage,
      title: describeHealthTitle(record),
      detail: describeHealth(record),
    })),
    ...stageEvents(stageHistory, stageLabelFor),
  ]

  // Comparação por timestamp: `occurred_at` volta com offset de fuso e
  // comparar as strings erraria a ordem entre registros de offsets diferentes.
  return events.toSorted(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
  )
}

export type TimelineDay = {
  /** yyyy-MM-dd no fuso local — a chave do agrupamento. */
  key: string
  events: TimelineEvent[]
}

/** Agrupamento por dia, preservando a ordem decrescente. */
export function groupByDay(events: readonly TimelineEvent[]): TimelineDay[] {
  const days: TimelineDay[] = []

  for (const event of events) {
    const key = toDateValue(event.occurredAt)
    const last = days.at(-1)
    if (last?.key === key) last.events.push(event)
    else days.push({ key, events: [event] })
  }

  return days
}

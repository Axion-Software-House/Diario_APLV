import { DIAPER_BLOOD, DIAPER_CONSISTENCY, DIAPER_MUCUS } from '@/constants/diaper'
import { ENVIRONMENT_PLACE_LABELS } from '@/constants/environments'
import { EXPOSURE_AMOUNTS, FOOD_CONSUMERS } from '@/constants/exposure'
import { PRODUCT_CATEGORY_LABELS } from '@/constants/products'
import { OUTCOME_LABELS, stageLabel } from '@/constants/stages'
import { INTENSITIES, SYMPTOMS } from '@/constants/symptoms'
import { toDateValue } from '@/utils/dates'
import type {
  DiaperRecord,
  EnvironmentRecord,
  Exposure,
  Note,
  ProductRecord,
  StageHistory,
  SymptomEventWithItems,
  TimelineEvent,
} from '@/types'

const AMOUNT_LABELS = new Map(EXPOSURE_AMOUNTS.map((option) => [option.value, option.label]))
const CONSUMER_LABELS = new Map(FOOD_CONSUMERS.map((option) => [option.value, option.label]))
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
  stageHistory: readonly StageHistory[]
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
  const parts = [
    CONSUMER_LABELS.get(exposure.consumer),
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

/**
 * Um evento por período de etapa, no instante em que ele começou. Como o
 * período anterior terminou é o que explica esse começo, então o desfecho
 * dele vira o detalhe daqui -- é a mesma virada, contada uma vez só.
 */
function stageEvents(history: readonly StageHistory[]): TimelineEvent[] {
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
      title: `Etapa ${period.stage} — ${stageLabel(period.stage)}`,
      detail: detail.length > 0 ? detail.join(' · ') : undefined,
    }
  })
}

/**
 * União no frontend das origens do diário — não existe tabela nem view
 * `timeline` (02-arquitetura.md). Ordena por `occurred_at` decrescente.
 *
 * O intervalo desde a exposição vinculada é calculado aqui e nunca gravado:
 * é distância no tempo, não causa.
 */
export function buildTimeline({
  exposures,
  symptomEvents,
  diaperRecords,
  notes,
  productRecords,
  environmentRecords,
  stageHistory,
}: TimelineSources): TimelineEvent[] {
  const exposureById = new Map(exposures.map((exposure) => [exposure.id, exposure]))

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
      const linked = event.exposure_id ? exposureById.get(event.exposure_id) : undefined
      const items = describeItems(event)

      return {
        id: event.id,
        kind: event.no_symptoms ? 'no_symptoms' : 'symptom',
        occurredAt: event.occurred_at,
        stage: event.stage,
        title: event.no_symptoms ? 'Sem sintomas' : items,
        detail: event.note ?? undefined,
        ...(linked
          ? {
              minutesAfterExposure: Math.round(
                (new Date(event.occurred_at).getTime() - new Date(linked.occurred_at).getTime()) /
                  60_000,
              ),
            }
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
    ...stageEvents(stageHistory),
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

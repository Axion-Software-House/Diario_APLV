import { EXPOSURE_AMOUNTS } from '@/constants/exposure'
import { INTENSITIES, SYMPTOMS } from '@/constants/symptoms'
import { toDateValue } from '@/utils/dates'
import type { Exposure, SymptomEventWithItems, TimelineEvent } from '@/types'

const AMOUNT_LABELS = new Map(EXPOSURE_AMOUNTS.map((option) => [option.value, option.label]))
const SYMPTOM_LABELS = new Map(SYMPTOMS.map((symptom) => [symptom.code, symptom.label]))
const INTENSITY_LABELS = new Map(INTENSITIES.map((item) => [item.value, item.label]))

export type TimelineSources = {
  exposures: readonly Exposure[]
  symptomEvents: readonly SymptomEventWithItems[]
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
    exposure.amount ? AMOUNT_LABELS.get(exposure.amount) : undefined,
    exposure.note ?? undefined,
  ].filter(Boolean)
  return parts.length > 0 ? parts.join(' · ') : undefined
}

/**
 * União no frontend das origens do diário — não existe tabela nem view
 * `timeline` (02-arquitetura.md). Ordena por `occurred_at` decrescente.
 *
 * O intervalo desde a exposição vinculada é calculado aqui e nunca gravado:
 * é distância no tempo, não causa.
 */
export function buildTimeline({ exposures, symptomEvents }: TimelineSources): TimelineEvent[] {
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

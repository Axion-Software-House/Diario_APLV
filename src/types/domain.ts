import type { Database } from '@/types/database'

/**
 * Tipos que a UI conhece. Os services convertem `database` → `domain`;
 * nenhum componente importa `database` direto.
 */

type Tables = Database['public']['Tables']
type Enums = Database['public']['Enums']

export type Row<T extends keyof Tables> = Tables[T]['Row']
export type Insert<T extends keyof Tables> = Tables[T]['Insert']

export type ProtocolStatus = Enums['protocol_status']
export type StageOutcome = Enums['stage_outcome']
export type ExposureAmount = Enums['exposure_amount']
export type FoodConsumer = Enums['food_consumer']
export type DiaperBlood = Enums['diaper_blood']
export type DiaperMucus = Enums['diaper_mucus']
export type DiaperConsistency = Enums['diaper_consistency']

export type Child = Row<'children'>
export type Protocol = Row<'protocols'>
export type StageHistory = Row<'stage_history'>
export type Exposure = Row<'exposures'>
export type SymptomEvent = Row<'symptom_events'>
export type SymptomEventItem = Row<'symptom_event_items'>
export type DiaperRecord = Row<'diaper_records'>
export type Note = Row<'notes'>
export type ProductRecord = Row<'product_records'>
export type EnvironmentRecord = Row<'environment_records'>
export type HealthRecord = Row<'health_records'>
export type TpoStage = Row<'tpo_stages'>

/** Tipo de registro de saúde. */
export type HealthKind = 'medication' | 'vaccine' | 'appointment' | 'weight'

/** Evento de sintoma com os itens já carregados. */
export type SymptomEventWithItems = SymptomEvent & {
  items: SymptomEventItem[]
}

/** Estado de toda escrita. `saving` desabilita o botão e evita duplicidade. */
export type ActionState = 'idle' | 'saving' | 'success' | 'error'

/** Tipos de evento que a timeline unifica no frontend. */
export type TimelineKind =
  | 'exposure'
  | 'symptom'
  | 'no_symptoms'
  | 'diaper'
  | 'note'
  | 'product'
  | 'environment'
  | 'health'
  | 'stage'

export type TimelineEvent = {
  id: string
  kind: TimelineKind
  occurredAt: string
  /** Etapa vigente no registro. `null` fora de um TPO. */
  stage: number | null
  title: string
  detail?: string
  /** Intervalo desde a exposição vinculada, em minutos. Nunca é causalidade. */
  minutesAfterExposure?: number
}

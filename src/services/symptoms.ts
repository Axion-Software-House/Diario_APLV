import { supabase } from '@/services/supabase'
import { AppError, toAppError } from '@/lib/errors'
import type { Intensity } from '@/constants/symptoms'
import type { SymptomEventWithItems, SymptomEvolution, SymptomEvolutionStatus } from '@/types'

export type SymptomItemInput = { code: string; intensity: Intensity }

export type SymptomEventInput = {
  childId: string
  /** Preenchido só quando o registro acontece durante um TPO ativo. */
  protocolId: string | null
  occurredAt: string
  /** Vazio quando `noSymptoms` é `true` — e só nesse caso. */
  items: SymptomItemInput[]
  exposureId: string | null
  environmentId?: string | null
  productId?: string | null
  noSymptoms: boolean
  note: string | null
}

/**
 * Evento + itens numa transação só (RPC `create_symptom_event`).
 * `stage` é lido do TPO dentro da função quando `protocolId` está presente.
 */
export async function createSymptomEvent(input: SymptomEventInput): Promise<string> {
  const { data, error } = await supabase.rpc('create_symptom_event', {
    p_child_id: input.childId,
    p_occurred_at: input.occurredAt,
    p_items: input.items,
    p_no_symptoms: input.noSymptoms,
    ...(input.protocolId ? { p_protocol_id: input.protocolId } : {}),
    ...(input.exposureId ? { p_exposure_id: input.exposureId } : {}),
    ...(input.environmentId ? { p_environment_id: input.environmentId } : {}),
    ...(input.productId ? { p_product_id: input.productId } : {}),
    ...(input.note ? { p_note: input.note } : {}),
  })

  if (error) throw toAppError(error)
  if (!data) throw new AppError('unknown', 'Não foi possível salvar. Tente novamente.')
  return data
}

export type SymptomEventPatch = {
  occurredAt: string
  exposureId: string | null
  environmentId?: string | null
  productId?: string | null
  note: string | null
}

/**
 * Só ajusta quando, os vínculos e a observação. Trocar os sintomas marcados
 * é excluir e registrar de novo (docs/08-plano-implementacao.md §4.3).
 */
export async function updateSymptomEvent(id: string, patch: SymptomEventPatch): Promise<void> {
  const { error } = await supabase
    .from('symptom_events')
    .update({
      occurred_at: patch.occurredAt,
      exposure_id: patch.exposureId,
      ...(patch.environmentId !== undefined ? { environment_id: patch.environmentId } : {}),
      ...(patch.productId !== undefined ? { product_id: patch.productId } : {}),
      note: patch.note,
    })
    .eq('id', id)

  if (error) throw toAppError(error)
}

export async function deleteSymptomEvent(id: string): Promise<void> {
  // symptom_event_items e symptom_evolutions cascateiam pela FK on delete cascade.
  const { error } = await supabase.from('symptom_events').delete().eq('id', id)
  if (error) throw toAppError(error)
}

export type SymptomEvolutionInput = {
  userId: string
  childId: string
  symptomEventId: string
  occurredAt: string
  status: SymptomEvolutionStatus
  note: string | null
}

export async function createSymptomEvolution(
  input: SymptomEvolutionInput,
): Promise<SymptomEvolution> {
  const { data, error } = await supabase
    .from('symptom_evolutions')
    .insert({
      user_id: input.userId,
      child_id: input.childId,
      symptom_event_id: input.symptomEventId,
      occurred_at: input.occurredAt,
      status: input.status,
      note: input.note,
    })
    .select()
    .single()

  if (error) throw toAppError(error)
  return data
}

export async function deleteSymptomEvolution(id: string): Promise<void> {
  const { error } = await supabase.from('symptom_evolutions').delete().eq('id', id)
  if (error) throw toAppError(error)
}

/** Eventos de sintoma da criança, com os itens e as evoluções já carregados. */
export async function listSymptomEvents(childId: string): Promise<SymptomEventWithItems[]> {
  const [{ data, error }, evolutionsResult] = await Promise.all([
    supabase
      .from('symptom_events')
      .select('*, items:symptom_event_items(*)')
      .eq('child_id', childId)
      .order('occurred_at', { ascending: false }),
    supabase
      .from('symptom_evolutions')
      .select('*')
      .eq('child_id', childId)
      .order('occurred_at', { ascending: true }),
  ])

  if (error) throw toAppError(error)

  const evolutionsByEvent = new Map<string, SymptomEvolution[]>()
  for (const evolution of evolutionsResult.data ?? []) {
    const list = evolutionsByEvent.get(evolution.symptom_event_id)
    if (list) list.push(evolution)
    else evolutionsByEvent.set(evolution.symptom_event_id, [evolution])
  }

  return (data ?? []).map((event) => ({
    ...event,
    evolutions: evolutionsByEvent.get(event.id) ?? [],
  }))
}

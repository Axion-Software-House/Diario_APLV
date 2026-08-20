import { supabase } from '@/services/supabase'
import { AppError, toAppError } from '@/lib/errors'
import type { Intensity } from '@/constants/symptoms'
import type { SymptomEventWithItems } from '@/types'

export type SymptomItemInput = { code: string; intensity: Intensity }

export type SymptomEventInput = {
  protocolId: string
  occurredAt: string
  /** Vazio quando `noSymptoms` é `true` — e só nesse caso. */
  items: SymptomItemInput[]
  exposureId: string | null
  noSymptoms: boolean
  note: string | null
}

/**
 * Evento + itens numa transação só (RPC `create_symptom_event`).
 * `stage` é lido do acompanhamento dentro da função, não enviado daqui.
 */
export async function createSymptomEvent(input: SymptomEventInput): Promise<string> {
  const { data, error } = await supabase.rpc('create_symptom_event', {
    p_protocol_id: input.protocolId,
    p_occurred_at: input.occurredAt,
    p_items: input.items,
    p_no_symptoms: input.noSymptoms,
    ...(input.exposureId ? { p_exposure_id: input.exposureId } : {}),
    ...(input.note ? { p_note: input.note } : {}),
  })

  if (error) throw toAppError(error)
  if (!data) throw new AppError('unknown', 'Não foi possível salvar. Tente novamente.')
  return data
}

/** Eventos de sintoma do acompanhamento, com os itens já carregados. */
export async function listSymptomEvents(protocolId: string): Promise<SymptomEventWithItems[]> {
  const { data, error } = await supabase
    .from('symptom_events')
    .select('*, items:symptom_event_items(*)')
    .eq('protocol_id', protocolId)
    .order('occurred_at', { ascending: false })

  if (error) throw toAppError(error)
  return data ?? []
}

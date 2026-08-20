import { supabase } from '@/services/supabase'
import { toAppError } from '@/lib/errors'
import type { DiaperBlood, DiaperConsistency, DiaperMucus, DiaperRecord } from '@/types'

export type DiaperInput = {
  userId: string
  protocolId: string
  /** Vem do acompanhamento ativo — nunca é campo de formulário. */
  stage: number
  occurredAt: string
  blood: DiaperBlood
  mucus: DiaperMucus
  consistency: DiaperConsistency | null
  note: string | null
}

export async function createDiaperRecord(input: DiaperInput): Promise<DiaperRecord> {
  const { data, error } = await supabase
    .from('diaper_records')
    .insert({
      user_id: input.userId,
      protocol_id: input.protocolId,
      stage: input.stage,
      occurred_at: input.occurredAt,
      blood: input.blood,
      mucus: input.mucus,
      consistency: input.consistency,
      note: input.note,
    })
    .select()
    .single()

  if (error) throw toAppError(error)
  return data
}

/** Registros de fralda do acompanhamento, mais recentes primeiro. */
export async function listDiaperRecords(protocolId: string): Promise<DiaperRecord[]> {
  const { data, error } = await supabase
    .from('diaper_records')
    .select('*')
    .eq('protocol_id', protocolId)
    .order('occurred_at', { ascending: false })

  if (error) throw toAppError(error)
  return data ?? []
}

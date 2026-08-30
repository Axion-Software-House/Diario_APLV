import { supabase } from '@/services/supabase'
import { toAppError } from '@/lib/errors'
import type { DiaperBlood, DiaperConsistency, DiaperMucus, DiaperRecord } from '@/types'

export type DiaperInput = {
  userId: string
  childId: string
  /** Só preenchidos durante um TPO ativo. */
  protocolId: string | null
  stage: number | null
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
      child_id: input.childId,
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

/** Registros de fralda da criança, mais recentes primeiro. */
export async function listDiaperRecords(childId: string): Promise<DiaperRecord[]> {
  const { data, error } = await supabase
    .from('diaper_records')
    .select('*')
    .eq('child_id', childId)
    .order('occurred_at', { ascending: false })

  if (error) throw toAppError(error)
  return data ?? []
}

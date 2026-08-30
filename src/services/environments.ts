import { supabase } from '@/services/supabase'
import { toAppError } from '@/lib/errors'
import type { EnvironmentRecord } from '@/types'

export type EnvironmentInput = {
  userId: string
  childId: string
  /** Só preenchidos durante um TPO ativo. */
  protocolId: string | null
  stage: number | null
  occurredAt: string
  place: string
  different: string | null
  note: string | null
}

export async function createEnvironmentRecord(
  input: EnvironmentInput,
): Promise<EnvironmentRecord> {
  const { data, error } = await supabase
    .from('environment_records')
    .insert({
      user_id: input.userId,
      child_id: input.childId,
      protocol_id: input.protocolId,
      stage: input.stage,
      occurred_at: input.occurredAt,
      place: input.place,
      different: input.different,
      note: input.note,
    })
    .select()
    .single()

  if (error) throw toAppError(error)
  return data
}

export type EnvironmentPatch = {
  place: string
  different: string | null
  occurredAt: string
  note: string | null
}

export async function updateEnvironmentRecord(
  id: string,
  patch: EnvironmentPatch,
): Promise<EnvironmentRecord> {
  const { data, error } = await supabase
    .from('environment_records')
    .update({
      place: patch.place,
      different: patch.different,
      occurred_at: patch.occurredAt,
      note: patch.note,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw toAppError(error)
  return data
}

export async function deleteEnvironmentRecord(id: string): Promise<void> {
  const { error } = await supabase.from('environment_records').delete().eq('id', id)
  if (error) throw toAppError(error)
}

/** Registros de ambiente da criança, mais recentes primeiro. */
export async function listEnvironmentRecords(childId: string): Promise<EnvironmentRecord[]> {
  const { data, error } = await supabase
    .from('environment_records')
    .select('*')
    .eq('child_id', childId)
    .order('occurred_at', { ascending: false })

  if (error) throw toAppError(error)
  return data ?? []
}

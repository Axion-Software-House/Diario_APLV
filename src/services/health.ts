import { supabase } from '@/services/supabase'
import { toAppError } from '@/lib/errors'
import type { HealthData } from '@/constants/health'
import type { HealthKind, HealthRecord } from '@/types'

export type { HealthData } from '@/constants/health'

export type HealthInput = {
  userId: string
  childId: string
  /** Só preenchidos durante um TPO ativo. */
  protocolId: string | null
  stage: number | null
  occurredAt: string
  kind: HealthKind
  /** Nome do medicamento/vacina, ou a especialidade. `null` para peso. */
  title: string | null
  data: HealthData
  note: string | null
}

export async function createHealthRecord(input: HealthInput): Promise<HealthRecord> {
  const { data, error } = await supabase
    .from('health_records')
    .insert({
      user_id: input.userId,
      child_id: input.childId,
      protocol_id: input.protocolId,
      stage: input.stage,
      occurred_at: input.occurredAt,
      kind: input.kind,
      title: input.title,
      data: input.data,
      note: input.note,
    })
    .select()
    .single()

  if (error) throw toAppError(error)
  return data
}

export type HealthPatch = {
  title: string | null
  data: HealthData
  occurredAt: string
  note: string | null
}

export async function updateHealthRecord(id: string, patch: HealthPatch): Promise<HealthRecord> {
  const { data, error } = await supabase
    .from('health_records')
    .update({
      title: patch.title,
      data: patch.data,
      occurred_at: patch.occurredAt,
      note: patch.note,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw toAppError(error)
  return data
}

export async function deleteHealthRecord(id: string): Promise<void> {
  const { error } = await supabase.from('health_records').delete().eq('id', id)
  if (error) throw toAppError(error)
}

/** Registros de saúde da criança, mais recentes primeiro. */
export async function listHealthRecords(childId: string): Promise<HealthRecord[]> {
  const { data, error } = await supabase
    .from('health_records')
    .select('*')
    .eq('child_id', childId)
    .order('occurred_at', { ascending: false })

  if (error) throw toAppError(error)
  return data ?? []
}

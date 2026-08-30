import { supabase } from '@/services/supabase'
import { toAppError } from '@/lib/errors'
import type { Exposure, ExposureAmount, FoodConsumer } from '@/types'

export type ExposureInput = {
  userId: string
  childId: string
  /** Só preenchidos durante um TPO ativo. */
  protocolId: string | null
  stage: number | null
  occurredAt: string
  /** Quem consumiu. Default `child` no banco. */
  consumer: FoodConsumer
  food: string
  amount: ExposureAmount | null
  brand: string | null
  details: string | null
  note: string | null
}

export async function createExposure(input: ExposureInput): Promise<Exposure> {
  const { data, error } = await supabase
    .from('exposures')
    .insert({
      user_id: input.userId,
      child_id: input.childId,
      protocol_id: input.protocolId,
      stage: input.stage,
      occurred_at: input.occurredAt,
      consumer: input.consumer,
      food: input.food,
      amount: input.amount,
      brand: input.brand,
      details: input.details,
      note: input.note,
    })
    .select()
    .single()

  if (error) throw toAppError(error)
  return data
}

/** Alimentos registrados da criança, mais recentes primeiro. */
export async function listExposures(childId: string, limit?: number): Promise<Exposure[]> {
  const query = supabase
    .from('exposures')
    .select('*')
    .eq('child_id', childId)
    .order('occurred_at', { ascending: false })

  const { data, error } = await (limit ? query.limit(limit) : query)

  if (error) throw toAppError(error)
  return data ?? []
}

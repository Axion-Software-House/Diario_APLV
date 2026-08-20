import { supabase } from '@/services/supabase'
import { toAppError } from '@/lib/errors'
import type { Exposure, ExposureAmount } from '@/types'

export type ExposureInput = {
  userId: string
  protocolId: string
  /** Vem do acompanhamento ativo — nunca é campo de formulário. */
  stage: number
  occurredAt: string
  food: string
  amount: ExposureAmount | null
  note: string | null
}

export async function createExposure(input: ExposureInput): Promise<Exposure> {
  const { data, error } = await supabase
    .from('exposures')
    .insert({
      user_id: input.userId,
      protocol_id: input.protocolId,
      stage: input.stage,
      occurred_at: input.occurredAt,
      food: input.food,
      amount: input.amount,
      note: input.note,
    })
    .select()
    .single()

  if (error) throw toAppError(error)
  return data
}

/** Exposições recentes do acompanhamento — alimentam o vínculo opcional do M6. */
export async function listRecentExposures(protocolId: string, limit = 8): Promise<Exposure[]> {
  const { data, error } = await supabase
    .from('exposures')
    .select('*')
    .eq('protocol_id', protocolId)
    .order('occurred_at', { ascending: false })
    .limit(limit)

  if (error) throw toAppError(error)
  return data ?? []
}

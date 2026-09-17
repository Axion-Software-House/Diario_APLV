import { supabase } from '@/services/supabase'
import { AppError, toAppError } from '@/lib/errors'
import type { StageHistory, StageOutcome } from '@/types'

export type ChangeStageInput = {
  protocolId: string
  /** A decisão já tomada pela equipe assistente. O app só registra. */
  outcome: StageOutcome
  note: string | null
}

/**
 * Fecha o período corrente, abre o novo e move `current_stage` — tudo na
 * RPC `change_stage`, numa transação só. Devolve a etapa nova.
 */
export async function changeStage(input: ChangeStageInput): Promise<number> {
  const { data, error } = await supabase.rpc('change_stage', {
    p_protocol_id: input.protocolId,
    p_outcome: input.outcome,
    ...(input.note ? { p_note: input.note } : {}),
  })

  if (error) throw toAppError(error)
  if (data === null) throw new AppError('unknown', 'Não foi possível salvar. Tente novamente.')
  return data
}

/**
 * Histórico de etapas da criança (todos os TPOs), do mais antigo para o
 * mais recente. Vazio quando a criança nunca iniciou um TPO.
 */
export async function listStageHistory(childId: string): Promise<StageHistory[]> {
  const { data: protocols, error: protocolsError } = await supabase
    .from('protocols')
    .select('id')
    .eq('child_id', childId)

  if (protocolsError) throw toAppError(protocolsError)

  const ids = (protocols ?? []).map((protocol) => protocol.id)
  if (ids.length === 0) return []

  const { data, error } = await supabase
    .from('stage_history')
    .select('*')
    .in('protocol_id', ids)
    .order('started_at', { ascending: true })

  if (error) throw toAppError(error)
  return data ?? []
}

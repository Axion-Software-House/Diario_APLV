import { supabase } from '@/services/supabase'
import { toAppError, AppError } from '@/lib/errors'
import type { Child, Protocol, StageHistory } from '@/types'

/** Acompanhamento ativo com a criança e o período de etapa corrente. */
export type ActiveProtocol = {
  protocol: Protocol
  child: Child
  currentStagePeriod: StageHistory | null
}

export type OnboardingInput = {
  childName: string
  birthDate: string | null
  feeding: string | null
  reason: string | null
  professional: string | null
  startedAt: string
}

/** Cria criança + acompanhamento + primeira etapa numa transação só. */
export async function createOnboarding(input: OnboardingInput): Promise<string> {
  // Campo opcional em branco é OMITIDO, não enviado como string vazia:
  // '' em coluna `date` estoura com 22007 no Postgres.
  const { data, error } = await supabase.rpc('create_onboarding', {
    p_child_name: input.childName,
    p_started_at: input.startedAt,
    ...(input.birthDate ? { p_birth_date: input.birthDate } : {}),
    ...(input.feeding ? { p_feeding: input.feeding } : {}),
    ...(input.reason ? { p_reason: input.reason } : {}),
    ...(input.professional ? { p_professional: input.professional } : {}),
  })
  if (error) throw toAppError(error)
  if (!data) throw new AppError('unknown', 'Não foi possível salvar. Tente novamente.')
  return data
}

/** `null` quando a usuária ainda não passou pelo onboarding. */
export async function getActiveProtocol(): Promise<ActiveProtocol | null> {
  const { data, error } = await supabase
    .from('protocols')
    .select('*, child:children(*)')
    .eq('status', 'active')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw toAppError(error)
  if (!data?.child) return null

  const { child, ...protocol } = data

  const { data: period, error: periodError } = await supabase
    .from('stage_history')
    .select('*')
    .eq('protocol_id', protocol.id)
    .is('ended_at', null)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (periodError) throw toAppError(periodError)

  return { protocol, child, currentStagePeriod: period }
}

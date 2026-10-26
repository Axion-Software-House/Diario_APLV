import { supabase } from '@/services/supabase'
import { toAppError, AppError } from '@/lib/errors'
import type { TpoEndOutcome } from '@/constants/stages'
import type { Child, Protocol, StageHistory, TpoStage } from '@/types'

/**
 * A escada de referência do TPO. Vive numa tabela para poder ser ajustada
 * sem deploy (README FINAL §22). O app tem um fallback em `constants/stages.ts`.
 */
export async function listTpoStages(): Promise<TpoStage[]> {
  const { data, error } = await supabase
    .from('tpo_stages')
    .select('*')
    .order('ordinal', { ascending: true })

  if (error) throw toAppError(error)
  return data ?? []
}

/** O TPO ativo da criança, com o período de etapa corrente. `null` = sem TPO. */
export type ActiveTpo = {
  protocol: Protocol
  currentStagePeriod: StageHistory | null
}

export type OnboardingInput = {
  childName: string
  birthDate: string | null
  feeding: string | null
  reason: string | null
  professional: string | null
}

/**
 * Cria SÓ a criança (nome, nascimento, alimentação, motivo, profissional).
 * O TPO é iniciado depois, na aba TPO — ver `startTpo`.
 * Retorna o `child_id`.
 */
export async function createOnboarding(input: OnboardingInput): Promise<string> {
  // Campo opcional em branco é OMITIDO, não enviado como string vazia:
  // '' em coluna `date` estoura com 22007 no Postgres.
  const { data, error } = await supabase.rpc('create_onboarding', {
    p_child_name: input.childName,
    ...(input.birthDate ? { p_birth_date: input.birthDate } : {}),
    ...(input.feeding ? { p_feeding: input.feeding } : {}),
    ...(input.reason ? { p_reason: input.reason } : {}),
    ...(input.professional ? { p_professional: input.professional } : {}),
  })
  if (error) throw toAppError(error)
  if (!data) throw new AppError('unknown', 'Não foi possível salvar. Tente novamente.')
  return data
}

/** A criança do usuário. `null` quando ainda não passou pelo onboarding. */
export async function getActiveChild(): Promise<Child | null> {
  const { data, error } = await supabase
    .from('children')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) throw toAppError(error)
  return data
}

/** O TPO em andamento da criança, se houver. */
export async function getActiveTpo(childId: string): Promise<ActiveTpo | null> {
  const { data: protocol, error } = await supabase
    .from('protocols')
    .select('*')
    .eq('child_id', childId)
    .eq('status', 'active')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw toAppError(error)
  if (!protocol) return null

  const { data: period, error: periodError } = await supabase
    .from('stage_history')
    .select('*')
    .eq('protocol_id', protocol.id)
    .is('ended_at', null)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (periodError) throw toAppError(periodError)

  return { protocol, currentStagePeriod: period }
}

export type StartTpoOptions = {
  initialStage?: number
  startedAt?: string
  note?: string | null
}

/** Inicia uma reintrodução guiada para a criança. Retorna o `protocol_id`. */
export async function startTpo(
  childId: string,
  options?: StartTpoOptions,
): Promise<string> {
  const { data, error } = await supabase.rpc('start_tpo', {
    p_child_id: childId,
    ...(options?.initialStage ? { p_initial_stage: options.initialStage } : {}),
    ...(options?.startedAt ? { p_started_at: options.startedAt } : {}),
    ...(options?.note ? { p_note: options.note } : {}),
  })

  if (error) throw toAppError(error)
  if (!data) throw new AppError('unknown', 'Não foi possível salvar. Tente novamente.')
  return data
}

export type EndTpoInput = {
  protocolId: string
  outcome: TpoEndOutcome
  endedAt?: string
  note?: string | null
}

/** Pausa, encerra ou interrompe o TPO ativo, fechando o período no histórico imutável. */
export async function endTpo(input: EndTpoInput): Promise<void> {
  const { error } = await supabase.rpc('end_tpo', {
    p_protocol_id: input.protocolId,
    p_outcome: input.outcome,
    ...(input.endedAt ? { p_ended_at: input.endedAt } : {}),
    ...(input.note ? { p_note: input.note } : {}),
  })

  if (error) throw toAppError(error)
}

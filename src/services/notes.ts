import { supabase } from '@/services/supabase'
import { toAppError } from '@/lib/errors'
import type { Note } from '@/types'

export type NoteInput = {
  userId: string
  protocolId: string
  /** Vem do acompanhamento ativo — nunca é campo de formulário. */
  stage: number
  occurredAt: string
  content: string
}

export async function createNote(input: NoteInput): Promise<Note> {
  const { data, error } = await supabase
    .from('notes')
    .insert({
      user_id: input.userId,
      protocol_id: input.protocolId,
      stage: input.stage,
      occurred_at: input.occurredAt,
      content: input.content,
    })
    .select()
    .single()

  if (error) throw toAppError(error)
  return data
}

/** Observações do acompanhamento, mais recentes primeiro. */
export async function listNotes(protocolId: string): Promise<Note[]> {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('protocol_id', protocolId)
    .order('occurred_at', { ascending: false })

  if (error) throw toAppError(error)
  return data ?? []
}

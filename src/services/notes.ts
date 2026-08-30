import { supabase } from '@/services/supabase'
import { toAppError } from '@/lib/errors'
import type { Note } from '@/types'

export type NoteInput = {
  userId: string
  childId: string
  /** Só preenchidos durante um TPO ativo. */
  protocolId: string | null
  stage: number | null
  occurredAt: string
  content: string
}

export async function createNote(input: NoteInput): Promise<Note> {
  const { data, error } = await supabase
    .from('notes')
    .insert({
      user_id: input.userId,
      child_id: input.childId,
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

export type NotePatch = {
  content: string
  occurredAt: string
}

export async function updateNote(id: string, patch: NotePatch): Promise<Note> {
  const { data, error } = await supabase
    .from('notes')
    .update({ content: patch.content, occurred_at: patch.occurredAt })
    .eq('id', id)
    .select()
    .single()

  if (error) throw toAppError(error)
  return data
}

export async function deleteNote(id: string): Promise<void> {
  const { error } = await supabase.from('notes').delete().eq('id', id)
  if (error) throw toAppError(error)
}

/** Observações da criança, mais recentes primeiro. */
export async function listNotes(childId: string): Promise<Note[]> {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('child_id', childId)
    .order('occurred_at', { ascending: false })

  if (error) throw toAppError(error)
  return data ?? []
}

import { supabase } from '@/services/supabase'
import { toAppError } from '@/lib/errors'
import type { Session } from '@supabase/supabase-js'

/** Única camada que fala com `supabase.auth`. */

export type Credentials = { email: string; password: string }

export async function signUp({ email, password }: Credentials): Promise<void> {
  const { error } = await supabase.auth.signUp({ email, password })
  if (error) throw toAppError(error)
}

export async function signIn({ email, password }: Credentials): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw toAppError(error)
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut()
  if (error) throw toAppError(error)
}

export async function getSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw toAppError(error)
  return data.session
}

/** Assina mudanças de sessão. Devolve a função de cancelamento. */
export function onAuthChange(handler: (session: Session | null) => void): () => void {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => handler(session))
  return () => data.subscription.unsubscribe()
}

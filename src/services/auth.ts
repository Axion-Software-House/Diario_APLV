import { supabase } from '@/services/supabase'
import { toAppError } from '@/lib/errors'
import type { Session, User } from '@supabase/supabase-js'

/** Única camada que fala com `supabase.auth`. */

export type Credentials = { email: string; password: string }

export async function signIn({ email, password }: Credentials): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw toAppError(error)
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut()
  if (error) throw toAppError(error)
}

/**
 * Marca, no `user_metadata`, que a pessoa já escolheu a própria senha. O
 * convite cria a conta sem senha e quem só abre o link já ganha sessão (e
 * `last_sign_in_at`); é esta marca que separa "Ativo" de "Convite pendente"
 * no /admin. Só serve para exibição: `user_metadata` é editável pelo próprio
 * usuário, então nada de permissão pode depender dela.
 */
export const PASSWORD_SET_KEY = 'password_set'

/**
 * Grava a senha e a marca acima numa chamada só: o GoTrue mescla `data` no
 * `user_metadata` existente, sem apagar as outras chaves (`full_name`).
 */
export async function updatePassword(password: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({
    password,
    data: { [PASSWORD_SET_KEY]: true },
  })
  if (error) throw toAppError(error)
}

/**
 * Conta convidada que ainda não criou a senha. Mesma regra da Edge Function
 * `admin-users`; só para escolher os textos da tela (ver `PASSWORD_SET_KEY`).
 */
export function isPendingInvite(user: User): boolean {
  return Boolean(user.invited_at) && user.user_metadata?.[PASSWORD_SET_KEY] !== true
}

export async function sendPasswordResetEmail(email: string, redirectTo?: string): Promise<void> {
  const redirect = redirectTo ?? `${window.location.origin}/redefinir-senha`
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirect,
  })
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

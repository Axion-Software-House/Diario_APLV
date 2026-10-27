import { supabase } from '@/services/supabase'
import { toAppError } from '@/lib/errors'
import type { User } from '@supabase/supabase-js'

export type AdminUserResponse = {
  success: boolean
  user: User
  suspended?: boolean
}

export type AdminListUsersResponse = {
  success: boolean
  users: User[]
  aud: string
  nextPage: number | null
  lastPage: number
  total: number
}

/** Verifica se o usuário autenticado na sessão atual é superusuário. */
export async function isCurrentSuperuser(): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_superuser')
  if (error) {
    // Se a tabela ou RPC ainda não estiverem aplicadas, trata graciosamente como false
    return false
  }
  return Boolean(data)
}

/** Convida um novo usuário por e-mail via Edge Function com service_role. */
export async function adminInviteUser(
  email: string,
  metadata?: Record<string, unknown>,
  redirectTo?: string,
): Promise<AdminUserResponse> {
  const { data, error } = await supabase.functions.invoke<AdminUserResponse>('admin-users', {
    body: {
      action: 'invite',
      email,
      metadata,
      redirectTo,
    },
  })

  if (error) throw toAppError(error)
  if (!data?.success) throw new Error('Não foi possível enviar o convite.')
  return data
}

/** Edita os dados de um usuário pelo superusuário. */
export async function adminUpdateUser(
  userId: string,
  attributes: Record<string, unknown>,
): Promise<AdminUserResponse> {
  const { data, error } = await supabase.functions.invoke<AdminUserResponse>('admin-users', {
    body: {
      action: 'update',
      userId,
      attributes,
    },
  })

  if (error) throw toAppError(error)
  if (!data?.success) throw new Error('Não foi possível atualizar o usuário.')
  return data
}

/** Suspende ou reativa o acesso de um usuário. */
export async function adminSuspendUser(
  userId: string,
  suspend = true,
  duration?: string,
): Promise<AdminUserResponse> {
  const { data, error } = await supabase.functions.invoke<AdminUserResponse>('admin-users', {
    body: {
      action: 'suspend',
      userId,
      suspend,
      duration,
    },
  })

  if (error) throw toAppError(error)
  if (!data?.success) throw new Error('Não foi possível alterar a suspensão do usuário.')
  return data
}

/** Exclui a conta de um usuário pelo superusuário. */
export async function adminDeleteUser(userId: string): Promise<AdminUserResponse> {
  const { data, error } = await supabase.functions.invoke<AdminUserResponse>('admin-users', {
    body: {
      action: 'delete',
      userId,
    },
  })

  if (error) throw toAppError(error)
  if (!data?.success) throw new Error('Não foi possível excluir o usuário.')
  return data
}

/** Lista os usuários cadastrados no Auth (paginado). */
export async function adminListUsers(page = 1, perPage = 50): Promise<AdminListUsersResponse> {
  const { data, error } = await supabase.functions.invoke<AdminListUsersResponse>('admin-users', {
    body: {
      action: 'list',
      page,
      perPage,
    },
  })

  if (error) throw toAppError(error)
  if (!data?.success) throw new Error('Não foi possível listar os usuários.')
  return data
}

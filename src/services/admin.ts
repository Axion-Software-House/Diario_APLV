import { supabase } from '@/services/supabase'
import { toAppError } from '@/lib/errors'

export type UserSituation = 'active' | 'invited' | 'suspended'

export type AdminUserItem = {
  id: string
  email: string
  name: string
  createdAt: string
  lastSignInAt: string | null
  invitedAt: string | null
  confirmedAt: string | null
  bannedUntil: string | null
  situation: UserSituation
}

export type AdminAuditLog = {
  id: string
  actor_id: string
  actor_email: string | null
  action: string
  target_user_id: string | null
  target_email: string | null
  details: Record<string, unknown>
  created_at: string
}

/** Verifica se o usuário autenticado na sessão atual é superusuário. */
export async function isCurrentSuperuser(): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_superuser')
  if (error) {
    return false
  }
  return Boolean(data)
}

/** Lista todos os usuários do sistema com busca por e-mail ou nome. */
export async function adminListUsers(
  search = '',
  page = 1,
  perPage = 100,
): Promise<{ users: AdminUserItem[]; total: number }> {
  const { data, error } = await supabase.functions.invoke<{
    success: boolean
    users: AdminUserItem[]
    total: number
    error?: string
  }>('admin-users', {
    body: {
      action: 'list',
      search,
      page,
      perPage,
    },
  })

  if (error) throw toAppError(error)
  if (data?.error) throw new Error(data.error)
  return { users: data?.users ?? [], total: data?.total ?? 0 }
}

/** Cria um novo acesso e envia o convite por e-mail. */
export async function adminInviteUser(email: string, name: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke<{
    success: boolean
    error?: string
  }>('admin-users', {
    body: {
      action: 'invite',
      email,
      name,
    },
  })

  if (error) throw toAppError(error)
  if (data?.error) throw new Error(data.error)
}

/** Reenvia o e-mail de convite para quem ainda não definiu a senha. */
export async function adminResendInvite(email: string, name?: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke<{
    success: boolean
    error?: string
  }>('admin-users', {
    body: {
      action: 'resend_invite',
      email,
      name,
    },
  })

  if (error) throw toAppError(error)
  if (data?.error) throw new Error(data.error)
}

/** Atualiza nome e/ou e-mail de um usuário existente. */
export async function adminUpdateUser(
  userId: string,
  attributes: { email?: string; name?: string },
): Promise<void> {
  const { data, error } = await supabase.functions.invoke<{
    success: boolean
    error?: string
  }>('admin-users', {
    body: {
      action: 'update',
      userId,
      email: attributes.email,
      name: attributes.name,
    },
  })

  if (error) throw toAppError(error)
  if (data?.error) throw new Error(data.error)
}

/** Suspende (ou reativa) o acesso de um usuário. */
export async function adminSuspendUser(userId: string, suspend: boolean): Promise<void> {
  const { data, error } = await supabase.functions.invoke<{
    success: boolean
    error?: string
  }>('admin-users', {
    body: {
      action: 'suspend',
      userId,
      suspend,
    },
  })

  if (error) throw toAppError(error)
  if (data?.error) throw new Error(data.error)
}

/** Dispara o link oficial de redefinição de senha para o e-mail do usuário. */
export async function adminSendPasswordReset(email: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke<{
    success: boolean
    error?: string
  }>('admin-users', {
    body: {
      action: 'reset_password',
      email,
    },
  })

  if (error) throw toAppError(error)
  if (data?.error) throw new Error(data.error)
}

/** Exclui uma conta definitivamente após confirmação explícita do e-mail. */
export async function adminDeleteUser(userId: string, confirmEmail: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke<{
    success: boolean
    error?: string
  }>('admin-users', {
    body: {
      action: 'delete',
      userId,
      confirmEmail,
    },
  })

  if (error) throw toAppError(error)
  if (data?.error) throw new Error(data.error)
}

/** Obtém os logs de auditoria recentes das ações do superusuário. */
export async function adminListAuditLogs(limit = 50): Promise<AdminAuditLog[]> {
  const { data, error } = await supabase.functions.invoke<{
    success: boolean
    logs: AdminAuditLog[]
    error?: string
  }>('admin-users', {
    body: {
      action: 'audit_logs',
      perPage: limit,
    },
  })

  if (error) throw toAppError(error)
  if (data?.error) throw new Error(data.error)
  return data?.logs ?? []
}

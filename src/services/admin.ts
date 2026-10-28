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

export type AuditOutcome = 'pending' | 'done' | 'failed'

export type AdminAuditLog = {
  id: string
  /** Nulo quando a conta de quem agiu foi excluída; `actor_email` preserva quem foi. */
  actor_id: string | null
  actor_email: string | null
  action: string
  target_user_id: string | null
  target_email: string | null
  details: Record<string, unknown>
  /** 'pending' se a ação foi registrada mas o desfecho não chegou a ser gravado. */
  outcome: AuditOutcome
  created_at: string
}

/**
 * Resultado de uma ação administrativa. `warning` vem quando a ação foi feita
 * mas algo secundário falhou (ex.: o registro de auditoria ficou pendente).
 */
export type AdminActionResult = { warning?: string }

type AdminResponse = { success?: boolean; error?: string; warning?: string }

async function invokeAdmin<T extends AdminResponse>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>('admin-users', { body })
  if (error) throw toAppError(error)
  if (!data) throw toAppError(new Error('Resposta vazia do servidor.'))
  if (data.error) throw new Error(data.error)
  return data
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
  const data = await invokeAdmin<AdminResponse & { users?: AdminUserItem[]; total?: number }>({
    action: 'list',
    search,
    page,
    perPage,
  })
  return { users: data.users ?? [], total: data.total ?? 0 }
}

/** Cria um novo acesso e envia o convite por e-mail. */
export async function adminInviteUser(email: string, name: string): Promise<AdminActionResult> {
  const data = await invokeAdmin({ action: 'invite', email, name })
  return { warning: data.warning }
}

/** Reenvia o e-mail de convite para quem ainda não definiu a senha. */
export async function adminResendInvite(email: string, name?: string): Promise<AdminActionResult> {
  const data = await invokeAdmin({ action: 'resend_invite', email, name })
  return { warning: data.warning }
}

/** Atualiza nome e/ou e-mail de um usuário existente. */
export async function adminUpdateUser(
  userId: string,
  attributes: { email?: string; name?: string },
): Promise<AdminActionResult> {
  const data = await invokeAdmin({
    action: 'update',
    userId,
    email: attributes.email,
    name: attributes.name,
  })
  return { warning: data.warning }
}

/** Suspende (ou reativa) o acesso de um usuário. */
export async function adminSuspendUser(
  userId: string,
  suspend: boolean,
): Promise<AdminActionResult> {
  const data = await invokeAdmin({ action: 'suspend', userId, suspend })
  return { warning: data.warning }
}

/** Dispara o link oficial de redefinição de senha para o e-mail do usuário. */
export async function adminSendPasswordReset(email: string): Promise<AdminActionResult> {
  const data = await invokeAdmin({ action: 'reset_password', email })
  return { warning: data.warning }
}

/** Exclui uma conta definitivamente após confirmação explícita do e-mail. */
export async function adminDeleteUser(
  userId: string,
  confirmEmail: string,
): Promise<AdminActionResult> {
  const data = await invokeAdmin({ action: 'delete', userId, confirmEmail })
  return { warning: data.warning }
}

/** Obtém os logs de auditoria recentes das ações do superusuário. */
export async function adminListAuditLogs(limit = 50): Promise<AdminAuditLog[]> {
  const data = await invokeAdmin<AdminResponse & { logs?: AdminAuditLog[] }>({
    action: 'audit_logs',
    perPage: limit,
  })
  return data.logs ?? []
}

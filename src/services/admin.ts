import { FunctionsHttpError } from '@supabase/supabase-js'
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

/**
 * Para onde o link do convite e da redefinição leva: a tela em que a pessoa
 * define a própria senha. A Edge Function só aceita origens da sua allowlist.
 */
function passwordRedirectUrl(): string {
  return `${window.location.origin}/redefinir-senha`
}

/**
 * Mensagem que a própria Edge Function devolveu no corpo da resposta de erro.
 * Com status ≠ 2xx, `functions.invoke` devolve `data` nulo e um
 * `FunctionsHttpError` cujo `context` é a `Response` original.
 */
async function readServerMessage(error: FunctionsHttpError): Promise<string | null> {
  try {
    const body: unknown = await (error.context as Response).json()
    if (typeof body === 'object' && body !== null) {
      const message = Reflect.get(body, 'error')
      if (typeof message === 'string' && message) return message
    }
  } catch {
    // Corpo vazio ou que não é JSON (ex.: erro do gateway): cai na mensagem genérica.
  }
  return null
}

async function invokeAdmin<T extends AdminResponse>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>('admin-users', { body })
  if (error) {
    // As mensagens da função já são em pt-BR e escritas para a tela (e-mail já
    // cadastrado, confirmação que não confere...). Sem elas, tudo virava
    // "Não foi possível salvar".
    const serverMessage = error instanceof FunctionsHttpError ? await readServerMessage(error) : null
    if (serverMessage) throw new Error(serverMessage)
    throw toAppError(error)
  }
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

/**
 * Lista os usuários do sistema, com busca por e-mail ou nome. A função percorre
 * todas as páginas do Auth; `total` é o número de contas que atendem à busca.
 */
export async function adminListUsers(
  search = '',
): Promise<{ users: AdminUserItem[]; total: number }> {
  const data = await invokeAdmin<AdminResponse & { users?: AdminUserItem[]; total?: number }>({
    action: 'list',
    search,
  })
  return { users: data.users ?? [], total: data.total ?? 0 }
}

/** Cria um novo acesso e envia o convite por e-mail. */
export async function adminInviteUser(email: string, name: string): Promise<AdminActionResult> {
  const data = await invokeAdmin({
    action: 'invite',
    email,
    name,
    redirectTo: passwordRedirectUrl(),
  })
  return { warning: data.warning }
}

/**
 * Reenvia o e-mail de convite para quem ainda não definiu a senha. Se a pessoa
 * já abriu o convite, o GoTrue não manda outro: vai um link de recuperação para
 * a mesma tela de criar senha (`via: 'recovery'`).
 */
export async function adminResendInvite(
  email: string,
  name?: string,
): Promise<AdminActionResult & { via: 'invite' | 'recovery' }> {
  const data = await invokeAdmin<AdminResponse & { via?: 'invite' | 'recovery' }>({
    action: 'resend_invite',
    email,
    name,
    redirectTo: passwordRedirectUrl(),
  })
  return { warning: data.warning, via: data.via ?? 'invite' }
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
export async function adminSendPasswordReset(
  userId: string,
  email: string,
): Promise<AdminActionResult> {
  const data = await invokeAdmin({
    action: 'reset_password',
    userId,
    email,
    redirectTo: passwordRedirectUrl(),
  })
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

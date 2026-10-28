// Supabase Edge Function: admin-users
// Operações administrativas de contas com verificação estrita de papel de superusuário e log de auditoria.
// A chave service_role roda exclusivamente nesta função no backend e nunca vai ao client.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import type { SupabaseClient, User } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

interface AdminRequestBody {
  action:
    | 'invite'
    | 'resend_invite'
    | 'update'
    | 'suspend'
    | 'delete'
    | 'reset_password'
    | 'list'
    | 'audit_logs'
  email?: string
  name?: string
  userId?: string
  confirmEmail?: string
  attributes?: Record<string, unknown>
  suspend?: boolean
  duration?: string
  redirectTo?: string
  /** Só para `audit_logs`: quantas linhas trazer. */
  perPage?: number
  search?: string
}

type AdminClient = SupabaseClient

function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function fail(message: string, status = 400): Response {
  return json({ error: message }, status)
}

/**
 * Mensagem em pt-BR para o erro do GoTrue. A tela mostra o que vem daqui; a
 * mensagem crua, em inglês, fica só no log da função.
 */
function authErrorMessage(error: { code?: string; message?: string } | null): string {
  switch (error?.code) {
    case 'email_exists':
    case 'user_already_exists':
      return 'Este e-mail já tem uma conta no sistema.'
    case 'email_address_invalid':
    case 'validation_failed':
      return 'O e-mail informado não é válido.'
    case 'email_address_not_authorized':
      return 'O servidor de e-mail do projeto não aceita enviar para este endereço.'
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
      return 'Muitos e-mails enviados em pouco tempo. Aguarde alguns minutos e tente de novo.'
    case 'user_not_found':
      return 'Usuário não encontrado.'
    default:
      return 'Não foi possível concluir a operação. Tente novamente.'
  }
}

// --- Convite pendente ---------------------------------------------------------
//
// Quem só abre o link do convite já fica com `confirmed_at` e `last_sign_in_at`,
// mesmo que feche a aba sem criar a senha. Por isso a situação não sai desses
// campos: a tela de criar senha (src/services/auth.ts, `updatePassword`) grava
// `user_metadata.password_set = true` junto com a senha, e o convite só deixa de
// estar pendente com essa marca.
//
// É SÓ EXIBIÇÃO, não segurança: `user_metadata` é editável pelo próprio usuário
// (`supabase.auth.updateUser({ data })`). Nenhuma permissão pode depender dela.
//
// Quem não foi convidado (sem `invited_at`, como o primeiro superusuário, criado
// com senha pelo painel) segue "Ativo" sem precisar da marca.

const PASSWORD_SET_KEY = 'password_set'

function isPendingInvite(u: User): boolean {
  return Boolean(u.invited_at) && u.user_metadata?.[PASSWORD_SET_KEY] !== true
}

/** O GoTrue recusa convidar de novo quem já abriu o link do convite. */
function isEmailExistsError(error: { code?: string; status?: number; message?: string }): boolean {
  return (
    error.code === 'email_exists' ||
    (error.status === 422 && /already been registered/i.test(error.message ?? ''))
  )
}

/** Página máxima aceita pelo GoTrue e pelo PostgREST (`max_rows`). */
const PAGE_SIZE = 1000
/** Salvaguarda contra laço infinito: 100 páginas = 100 mil contas. */
const MAX_PAGES = 100

/** Todas as contas do Auth, página a página: a busca precisa alcançar todas. */
async function listAllUsers(adminClient: AdminClient): Promise<User[] | null> {
  const all: User[] = []
  for (let page = 1; page <= MAX_PAGES; page++) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage: PAGE_SIZE })
    if (error) {
      console.error('Falha ao listar contas:', error)
      return null
    }
    all.push(...data.users)
    if (data.users.length < PAGE_SIZE) break
  }
  return all
}

/** Nome de cada perfil (`profiles.full_name`), também página a página. */
async function loadProfileNames(adminClient: AdminClient): Promise<Map<string, string> | null> {
  const names = new Map<string, string>()
  for (let page = 0; page < MAX_PAGES; page++) {
    const from = page * PAGE_SIZE
    const { data, error } = await adminClient
      .from('profiles')
      .select('id, full_name')
      .order('id')
      .range(from, from + PAGE_SIZE - 1)
    if (error) {
      console.error('Falha ao ler os perfis:', error)
      return null
    }
    const rows = (data ?? []) as { id: string; full_name: string | null }[]
    for (const row of rows) {
      if (row.full_name) names.set(row.id, row.full_name)
    }
    if (rows.length < PAGE_SIZE) break
  }
  return names
}

// --- Endereço de retorno dos links de e-mail --------------------------------
//
// O convite e a redefinição levam a pessoa para a tela em que ela define a
// própria senha. O front manda `${window.location.origin}/redefinir-senha`, mas a
// origem só é aceita se estiver na lista de ALLOWED_REDIRECT_ORIGINS (separadas
// por vírgula; na falta dela, SITE_URL). Sem a lista, quem tivesse um token de
// superusuário poderia mandar o link com a sessão da pessoa para um domínio
// qualquer (open redirect).

const PASSWORD_PATH = '/redefinir-senha'

function allowedRedirectOrigins(): string[] {
  const raw = Deno.env.get('ALLOWED_REDIRECT_ORIGINS') || Deno.env.get('SITE_URL') || ''
  return raw
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
    .flatMap((value) => {
      try {
        return [new URL(value).origin]
      } catch {
        console.error('Origem inválida em ALLOWED_REDIRECT_ORIGINS/SITE_URL:', value)
        return []
      }
    })
}

type RedirectResult = { url: string } | { error: string; status: number }

function resolveRedirect(value: unknown): RedirectResult {
  const allowed = allowedRedirectOrigins()
  if (allowed.length === 0) {
    console.error('Defina ALLOWED_REDIRECT_ORIGINS (ou SITE_URL) nos secrets da função.')
    return { error: 'Configuração do servidor incompleta: endereço do app não definido.', status: 500 }
  }
  if (typeof value !== 'string' || !value) {
    return { error: 'Endereço de retorno do link ausente.', status: 400 }
  }

  let url: URL
  try {
    url = new URL(value)
  } catch {
    return { error: 'Endereço de retorno do link inválido.', status: 400 }
  }

  if (!allowed.includes(url.origin) || url.pathname !== PASSWORD_PATH) {
    console.error('redirectTo recusado:', value, 'permitidas:', allowed)
    return {
      error: `O endereço ${url.origin} não está autorizado a receber links de acesso.`,
      status: 400,
    }
  }

  // Remonta a URL: só origem e caminho, nada de query ou hash vindos do cliente.
  return { url: `${url.origin}${PASSWORD_PATH}` }
}

// --- Auditoria ---------------------------------------------------------------
//
// Toda ação que altera uma conta grava a linha de auditoria ANTES de agir
// (outcome = 'pending') e a fecha depois ('done' ou 'failed'). Se a gravação
// inicial falha, a ação não é executada: nenhuma alteração fica sem registro.
// Se só o fechamento falha, a ação já aconteceu; a resposta leva um aviso e a
// linha fica 'pending', visível na tela de auditoria.

type AuditActor = { id: string; email: string }

type AuditEntry = {
  action: string
  targetUserId?: string | null
  targetEmail?: string | null
  details?: Record<string, unknown>
}

const AUDIT_UNAVAILABLE =
  'Não foi possível registrar a ação na auditoria. Nada foi alterado; tente novamente.'
const AUDIT_PENDING_WARNING =
  'A ação foi concluída, mas o registro de auditoria ficou como pendente.'

async function startAudit(
  adminClient: AdminClient,
  actor: AuditActor,
  entry: AuditEntry,
): Promise<string | null> {
  const { data, error } = await adminClient
    .from('admin_audit_logs')
    .insert({
      actor_id: actor.id,
      actor_email: actor.email,
      action: entry.action,
      target_user_id: entry.targetUserId ?? null,
      target_email: entry.targetEmail ?? null,
      details: entry.details ?? {},
      outcome: 'pending',
    })
    .select('id')
    .single()

  if (error || !data) {
    console.error('Falha ao abrir o registro de auditoria:', error)
    return null
  }
  return (data as { id: string }).id
}

async function finishAudit(
  adminClient: AdminClient,
  auditId: string,
  outcome: 'done' | 'failed',
  entry: AuditEntry,
): Promise<boolean> {
  const { error } = await adminClient
    .from('admin_audit_logs')
    .update({
      outcome,
      target_user_id: entry.targetUserId ?? null,
      target_email: entry.targetEmail ?? null,
      details: entry.details ?? {},
    })
    .eq('id', auditId)

  if (error) {
    console.error('Falha ao fechar o registro de auditoria:', auditId, error)
    return false
  }
  return true
}

/** Fecha a auditoria como concluída e devolve a resposta de sucesso. */
async function succeed(
  adminClient: AdminClient,
  auditId: string,
  entry: AuditEntry,
  body: Record<string, unknown>,
  extraWarnings: string[] = [],
): Promise<Response> {
  const closed = await finishAudit(adminClient, auditId, 'done', entry)
  const warnings = closed ? extraWarnings : [...extraWarnings, AUDIT_PENDING_WARNING]
  return json({ success: true, ...body, ...(warnings.length ? { warning: warnings.join(' ') } : {}) })
}

/** Fecha a auditoria como recusada e devolve o erro. */
async function refuse(
  adminClient: AdminClient,
  auditId: string,
  entry: AuditEntry,
  cause: { message?: string; code?: string } | null,
  message: string,
  status = 400,
): Promise<Response> {
  console.error(`Ação ${entry.action} recusada:`, cause)
  await finishAudit(adminClient, auditId, 'failed', {
    ...entry,
    details: { ...entry.details, error: cause?.code ?? cause?.message ?? 'desconhecido' },
  })
  return fail(message, status)
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return fail('Cabeçalho de autorização ausente.', 401)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return fail('Configuração do servidor incompleta.', 500)
    }

    // 1. Validar o chamador autenticado pelo JWT
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const {
      data: { user: caller },
      error: callerError,
    } = await userClient.auth.getUser()

    if (callerError || !caller) {
      return fail('Sessão inválida ou expirada.', 401)
    }

    // 2. Cliente administrativo com service_role
    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // 3. Checar se o chamador é superusuário
    const { data: isSuper, error: superCheckError } = await adminClient.rpc('is_superuser', {
      p_user_id: caller.id,
    })

    if (superCheckError || !isSuper) {
      return fail('Acesso negado: operação restrita a superusuários.', 403)
    }

    // 4. Executar a ação administrativa solicitada
    const body: AdminRequestBody = await req.json()
    const { action } = body
    const actor: AuditActor = { id: caller.id, email: caller.email ?? 'superusuario' }

    switch (action) {
      case 'list': {
        const search = body.search?.trim().toLowerCase() ?? ''

        // A busca roda sobre TODAS as contas, não só sobre a primeira página.
        const allUsers = await listAllUsers(adminClient)
        if (!allUsers) {
          return fail('Não foi possível carregar a lista de contas.', 500)
        }

        // Nome gravado no perfil (coluna `full_name`, a mesma do trigger de criação).
        const profileNameMap = await loadProfileNames(adminClient)
        if (!profileNameMap) {
          return fail('Não foi possível carregar os nomes das contas.', 500)
        }

        // Mapeia os usuários com sua situação
        const now = Date.now()
        let users = allUsers.map((u) => {
          const name =
            profileNameMap.get(u.id) ||
            (u.user_metadata?.full_name as string) ||
            (u.user_metadata?.name as string) ||
            ''
          // O GoTrue devolve `banned_until`, mas o tipo `User` do auth-js não o declara.
          const bannedUntil = (u as { banned_until?: string | null }).banned_until ?? null
          const isBanned = Boolean(bannedUntil && new Date(bannedUntil).getTime() > now)

          let situation: 'active' | 'invited' | 'suspended' = 'active'
          if (isBanned) situation = 'suspended'
          else if (isPendingInvite(u)) situation = 'invited'

          return {
            id: u.id,
            email: u.email ?? '',
            name,
            createdAt: u.created_at,
            lastSignInAt: u.last_sign_in_at ?? null,
            invitedAt: u.invited_at ?? null,
            confirmedAt: u.confirmed_at ?? null,
            bannedUntil,
            situation,
          }
        })

        if (search) {
          users = users.filter(
            (u) =>
              u.email.toLowerCase().includes(search) ||
              u.name.toLowerCase().includes(search)
          )
        }

        // `total` conta as contas que atendem à busca, todas devolvidas.
        return json({ success: true, users, total: users.length })
      }

      case 'invite':
      case 'resend_invite': {
        if (!body.email || typeof body.email !== 'string') {
          return fail('Informe um e-mail válido para o convite.')
        }

        const redirect = resolveRedirect(body.redirectTo)
        if ('error' in redirect) return fail(redirect.error, redirect.status)

        const email = body.email.trim().toLowerCase()
        const name = body.name?.trim() ?? ''
        const entry: AuditEntry = { action, targetEmail: email, details: { name } }

        const auditId = await startAudit(adminClient, actor, entry)
        if (!auditId) return fail(AUDIT_UNAVAILABLE, 500)

        // `full_name` é a chave que o trigger handle_new_user copia para profiles.
        const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
          email,
          {
            data: name ? { full_name: name } : {},
            redirectTo: redirect.url,
          }
        )

        let invitedUser: User | null = inviteData?.user ?? null
        let done: AuditEntry = { ...entry, targetUserId: invitedUser?.id ?? null }
        let via: 'invite' | 'recovery' = 'invite'

        if (inviteError) {
          // Reenvio para quem abriu o link mas não criou a senha: a conta já está
          // ativada pelo link e o GoTrue recusa outro convite ("email_exists"). O caminho
          // é um link de recuperação, que leva à mesma tela `/redefinir-senha`; lá
          // a conta é reconhecida como convite pendente e a tela segue sendo
          // "Criar sua senha". Num convite novo, o e-mail existente é recusado.
          const pending =
            action === 'resend_invite' && isEmailExistsError(inviteError)
              ? (await listAllUsers(adminClient))?.find(
                  (u) => (u.email ?? '').toLowerCase() === email && isPendingInvite(u),
                )
              : undefined
          if (!pending) {
            return refuse(adminClient, auditId, entry, inviteError, authErrorMessage(inviteError))
          }

          done = {
            ...entry,
            targetUserId: pending.id,
            details: { ...entry.details, via: 'recovery' },
          }
          const { error: recoveryError } = await adminClient.auth.resetPasswordForEmail(email, {
            redirectTo: redirect.url,
          })
          if (recoveryError) {
            return refuse(adminClient, auditId, done, recoveryError, authErrorMessage(recoveryError))
          }
          invitedUser = pending
          via = 'recovery'
        }

        const warnings: string[] = []

        // No reenvio o usuário já existe e o trigger não roda de novo.
        if (name && invitedUser) {
          const { error: profileError } = await adminClient
            .from('profiles')
            .upsert({ id: invitedUser.id, full_name: name })
          if (profileError) {
            console.error('Falha ao gravar o nome no perfil:', profileError)
            warnings.push('O nome não foi gravado no perfil.')
          }
        }

        return succeed(adminClient, auditId, done, { user: invitedUser, via }, warnings)
      }

      case 'update': {
        if (!body.userId || typeof body.userId !== 'string') {
          return fail('ID do usuário obrigatório para edição.')
        }

        const { data: current, error: currentError } = await adminClient.auth.admin.getUserById(
          body.userId
        )
        if (currentError || !current.user) {
          return fail('Usuário não encontrado.', 404)
        }

        const previousEmail = current.user.email ?? null
        const newEmail = body.email ? body.email.trim().toLowerCase() : undefined
        const newName = body.name !== undefined ? body.name.trim() : undefined

        const updatePayload: Record<string, unknown> = {}
        if (newEmail) updatePayload.email = newEmail
        if (newName !== undefined) updatePayload.user_metadata = { full_name: newName }

        const entry: AuditEntry = {
          action: 'update',
          targetUserId: body.userId,
          targetEmail: previousEmail,
          details: { previousEmail, email: newEmail ?? null, name: newName ?? null },
        }

        const auditId = await startAudit(adminClient, actor, entry)
        if (!auditId) return fail(AUDIT_UNAVAILABLE, 500)

        const { data: updateData, error: updateError } = await adminClient.auth.admin.updateUserById(
          body.userId,
          updatePayload
        )

        if (updateError) {
          return refuse(adminClient, auditId, entry, updateError, authErrorMessage(updateError))
        }

        const warnings: string[] = []
        if (newName !== undefined) {
          const { error: profileError } = await adminClient
            .from('profiles')
            .upsert({ id: body.userId, full_name: newName || null })
          if (profileError) {
            console.error('Falha ao gravar o nome no perfil:', profileError)
            warnings.push('O nome não foi gravado no perfil.')
          }
        }

        return succeed(adminClient, auditId, entry, { user: updateData.user }, warnings)
      }

      case 'suspend': {
        if (!body.userId || typeof body.userId !== 'string') {
          return fail('ID do usuário obrigatório para alterar suspensão.')
        }

        if (body.userId === caller.id) {
          return fail('Não é permitido suspender a própria conta de superusuário.')
        }

        const isSuspending = body.suspend !== false
        const banDuration = isSuspending ? (body.duration ?? '876000h') : 'none'

        const { data: target } = await adminClient.auth.admin.getUserById(body.userId)
        const entry: AuditEntry = {
          action: isSuspending ? 'suspend' : 'reactivate',
          targetUserId: body.userId,
          targetEmail: target?.user?.email ?? null,
          details: { banDuration },
        }

        const auditId = await startAudit(adminClient, actor, entry)
        if (!auditId) return fail(AUDIT_UNAVAILABLE, 500)

        const { data: suspendData, error: suspendError } = await adminClient.auth.admin.updateUserById(
          body.userId,
          { ban_duration: banDuration }
        )

        if (suspendError) {
          return refuse(adminClient, auditId, entry, suspendError, authErrorMessage(suspendError))
        }

        return succeed(
          adminClient,
          auditId,
          { ...entry, targetEmail: suspendData.user?.email ?? entry.targetEmail },
          { user: suspendData.user, suspended: isSuspending },
        )
      }

      case 'reset_password': {
        if (!body.email || typeof body.email !== 'string') {
          return fail('Informe o e-mail para envio de redefinição de senha.')
        }

        const redirect = resolveRedirect(body.redirectTo)
        if ('error' in redirect) return fail(redirect.error, redirect.status)

        const targetEmail = body.email.trim().toLowerCase()
        const entry: AuditEntry = {
          action: 'reset_password',
          targetUserId: body.userId ?? null,
          targetEmail,
        }

        const auditId = await startAudit(adminClient, actor, entry)
        if (!auditId) return fail(AUDIT_UNAVAILABLE, 500)

        // Dispara o e-mail oficial de redefinição para a pessoa
        const { error: resetError } = await adminClient.auth.resetPasswordForEmail(
          targetEmail,
          { redirectTo: redirect.url }
        )

        if (resetError) {
          return refuse(adminClient, auditId, entry, resetError, authErrorMessage(resetError))
        }

        return succeed(adminClient, auditId, entry, {
          message: 'Link de redefinição enviado com sucesso.',
        })
      }

      case 'delete': {
        if (!body.userId || typeof body.userId !== 'string') {
          return fail('ID do usuário obrigatório para exclusão.')
        }

        if (body.userId === caller.id) {
          return fail('Não é permitido excluir o próprio usuário logado.')
        }

        // Obtém usuário para confirmar e-mail
        const { data: targetUser, error: getTargetError } = await adminClient.auth.admin.getUserById(
          body.userId
        )

        if (getTargetError || !targetUser.user) {
          return fail('Usuário não encontrado.', 404)
        }

        if (
          !body.confirmEmail ||
          body.confirmEmail.trim().toLowerCase() !== (targetUser.user.email ?? '').toLowerCase()
        ) {
          return fail('O e-mail digitado para confirmação não confere com o e-mail da conta.')
        }

        const entry: AuditEntry = {
          action: 'delete',
          targetUserId: body.userId,
          targetEmail: targetUser.user.email ?? null,
          details: { confirmedWithEmail: body.confirmEmail.trim().toLowerCase() },
        }

        const auditId = await startAudit(adminClient, actor, entry)
        if (!auditId) return fail(AUDIT_UNAVAILABLE, 500)

        const { data: deleteData, error: deleteError } = await adminClient.auth.admin.deleteUser(
          body.userId
        )

        if (deleteError) {
          return refuse(adminClient, auditId, entry, deleteError, authErrorMessage(deleteError))
        }

        return succeed(adminClient, auditId, entry, { user: deleteData.user })
      }

      case 'audit_logs': {
        const { data: logs, error: logsError } = await adminClient
          .from('admin_audit_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(Math.min(Math.max(body.perPage ?? 50, 1), 200))

        if (logsError) {
          console.error('Falha ao ler a auditoria:', logsError)
          return fail('Não foi possível carregar o registro de auditoria.', 500)
        }

        return json({ success: true, logs })
      }

      default:
        return fail(`Ação inválida ou não suportada: ${action}`)
    }
  } catch (err) {
    console.error('Erro inesperado em admin-users:', err)
    return fail('Erro interno do servidor.', 500)
  }
})

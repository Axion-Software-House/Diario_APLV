// Supabase Edge Function: admin-users
// Operações administrativas de contas com verificação estrita de papel de superusuário e log de auditoria.
// A chave service_role roda exclusivamente nesta função no backend e nunca vai ao client.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

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
  page?: number
  perPage?: number
  search?: string
}

type AdminClient = ReturnType<typeof createClient>

async function logAdminAction(
  adminClient: AdminClient,
  actorId: string,
  actorEmail: string,
  action: string,
  targetUserId?: string | null,
  targetEmail?: string | null,
  details?: Record<string, unknown>
) {
  try {
    await adminClient.from('admin_audit_logs').insert({
      actor_id: actorId,
      actor_email: actorEmail,
      action,
      target_user_id: targetUserId ?? null,
      target_email: targetEmail ?? null,
      details: details ?? {},
    })
  } catch (err) {
    console.error('Falha ao gravar log de auditoria:', err)
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Cabeçalho de autorização ausente.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return new Response(
        JSON.stringify({ error: 'Configuração do servidor incompleta.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
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
      return new Response(
        JSON.stringify({ error: 'Sessão inválida ou expirada.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
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
      return new Response(
        JSON.stringify({ error: 'Acesso negado: operação restrita a superusuários.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 4. Executar a ação administrativa solicitada
    const body: AdminRequestBody = await req.json()
    const { action } = body
    const callerEmail = caller.email ?? 'superusuario'

    switch (action) {
      case 'list': {
        const page = body.page ?? 1
        const perPage = body.perPage ?? 100
        const search = body.search?.trim().toLowerCase() ?? ''

        const { data: listData, error: listError } = await adminClient.auth.admin.listUsers({
          page,
          perPage,
        })

        if (listError) {
          return new Response(
            JSON.stringify({ error: listError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Busca perfis para mapear nomes salvos
        const { data: profiles } = await adminClient
          .from('profiles')
          .select('id, name')

        const profileNameMap = new Map<string, string>()
        if (profiles) {
          for (const p of profiles) {
            if (p.name) profileNameMap.set(p.id, p.name)
          }
        }

        // Mapeia os usuários com sua situação
        const now = Date.now()
        let users = listData.users.map((u) => {
          const name = (u.user_metadata?.name as string) || profileNameMap.get(u.id) || ''
          const isBanned = Boolean(u.banned_until && new Date(u.banned_until).getTime() > now)
          const isPendingInvite = Boolean(u.invited_at && (!u.confirmed_at || !u.last_sign_in_at))

          let situation: 'active' | 'invited' | 'suspended' = 'active'
          if (isBanned) situation = 'suspended'
          else if (isPendingInvite) situation = 'invited'

          return {
            id: u.id,
            email: u.email ?? '',
            name,
            createdAt: u.created_at,
            lastSignInAt: u.last_sign_in_at ?? null,
            invitedAt: u.invited_at ?? null,
            confirmedAt: u.confirmed_at ?? null,
            bannedUntil: u.banned_until ?? null,
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

        return new Response(
          JSON.stringify({
            success: true,
            users,
            total: users.length,
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'invite':
      case 'resend_invite': {
        if (!body.email || typeof body.email !== 'string') {
          return new Response(
            JSON.stringify({ error: 'Informe um e-mail válido para o convite.' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const email = body.email.trim().toLowerCase()
        const name = body.name?.trim() ?? ''

        const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
          email,
          {
            data: { name },
            redirectTo: body.redirectTo,
          }
        )

        if (inviteError) {
          return new Response(
            JSON.stringify({ error: inviteError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        if (name && inviteData.user) {
          await adminClient
            .from('profiles')
            .upsert({ id: inviteData.user.id, name })
        }

        await logAdminAction(
          adminClient,
          caller.id,
          callerEmail,
          action === 'resend_invite' ? 'resend_invite' : 'invite',
          inviteData.user?.id,
          email,
          { name }
        )

        return new Response(
          JSON.stringify({ success: true, user: inviteData.user }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'update': {
        if (!body.userId || typeof body.userId !== 'string') {
          return new Response(
            JSON.stringify({ error: 'ID do usuário obrigatório para edição.' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const updatePayload: Record<string, unknown> = {}
        if (body.email) updatePayload.email = body.email.trim().toLowerCase()
        if (body.name !== undefined) {
          updatePayload.user_metadata = { name: body.name.trim() }
        }

        const { data: updateData, error: updateError } = await adminClient.auth.admin.updateUserById(
          body.userId,
          updatePayload
        )

        if (updateError) {
          return new Response(
            JSON.stringify({ error: updateError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        if (body.name !== undefined) {
          await adminClient
            .from('profiles')
            .upsert({ id: body.userId, name: body.name.trim() })
        }

        await logAdminAction(
          adminClient,
          caller.id,
          callerEmail,
          'update',
          body.userId,
          updateData.user?.email,
          { email: body.email, name: body.name }
        )

        return new Response(
          JSON.stringify({ success: true, user: updateData.user }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'suspend': {
        if (!body.userId || typeof body.userId !== 'string') {
          return new Response(
            JSON.stringify({ error: 'ID do usuário obrigatório para alterar suspensão.' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        if (body.userId === caller.id) {
          return new Response(
            JSON.stringify({ error: 'Não é permitido suspender a própria conta de superusuário.' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const isSuspending = body.suspend !== false
        const banDuration = isSuspending ? (body.duration ?? '876000h') : 'none'

        const { data: suspendData, error: suspendError } = await adminClient.auth.admin.updateUserById(
          body.userId,
          { ban_duration: banDuration }
        )

        if (suspendError) {
          return new Response(
            JSON.stringify({ error: suspendError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        await logAdminAction(
          adminClient,
          caller.id,
          callerEmail,
          isSuspending ? 'suspend' : 'reactivate',
          body.userId,
          suspendData.user?.email,
          { banDuration }
        )

        return new Response(
          JSON.stringify({
            success: true,
            user: suspendData.user,
            suspended: isSuspending,
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'reset_password': {
        if (!body.email || typeof body.email !== 'string') {
          return new Response(
            JSON.stringify({ error: 'Informe o e-mail para envio de redefinição de senha.' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const targetEmail = body.email.trim().toLowerCase()

        // Dispara o e-mail oficial de redefinição para a pessoa
        const { error: resetError } = await adminClient.auth.resetPasswordForEmail(
          targetEmail,
          { redirectTo: body.redirectTo }
        )

        if (resetError) {
          return new Response(
            JSON.stringify({ error: resetError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        await logAdminAction(
          adminClient,
          caller.id,
          callerEmail,
          'reset_password',
          body.userId,
          targetEmail
        )

        return new Response(
          JSON.stringify({ success: true, message: 'Link de redefinição enviado com sucesso.' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'delete': {
        if (!body.userId || typeof body.userId !== 'string') {
          return new Response(
            JSON.stringify({ error: 'ID do usuário obrigatório para exclusão.' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        if (body.userId === caller.id) {
          return new Response(
            JSON.stringify({ error: 'Não é permitido excluir o próprio usuário logado.' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Obtém usuário para confirmar e-mail
        const { data: targetUser, error: getTargetError } = await adminClient.auth.admin.getUserById(
          body.userId
        )

        if (getTargetError || !targetUser.user) {
          return new Response(
            JSON.stringify({ error: 'Usuário não encontrado.' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        if (
          !body.confirmEmail ||
          body.confirmEmail.trim().toLowerCase() !== (targetUser.user.email ?? '').toLowerCase()
        ) {
          return new Response(
            JSON.stringify({
              error: 'O e-mail digitado para confirmação não confere com o e-mail da conta.',
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const deletedEmail = targetUser.user.email

        const { data: deleteData, error: deleteError } = await adminClient.auth.admin.deleteUser(
          body.userId
        )

        if (deleteError) {
          return new Response(
            JSON.stringify({ error: deleteError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        await logAdminAction(
          adminClient,
          caller.id,
          callerEmail,
          'delete',
          body.userId,
          deletedEmail,
          { confirmedWithEmail: body.confirmEmail }
        )

        return new Response(
          JSON.stringify({ success: true, user: deleteData.user }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'audit_logs': {
        const { data: logs, error: logsError } = await adminClient
          .from('admin_audit_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(body.perPage ?? 50)

        if (logsError) {
          return new Response(
            JSON.stringify({ error: logsError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({ success: true, logs }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default:
        return new Response(
          JSON.stringify({ error: `Ação inválida ou não suportada: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno do servidor.'
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

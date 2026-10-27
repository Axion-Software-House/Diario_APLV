// Supabase Edge Function: admin-users
// Operações administrativas de contas com verificação estrita de papel de superusuário.
// A chave service_role roda exclusivamente nesta função no backend e nunca vai ao client.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

interface AdminRequestBody {
  action: 'invite' | 'update' | 'suspend' | 'delete' | 'list'
  email?: string
  userId?: string
  metadata?: Record<string, unknown>
  attributes?: Record<string, unknown>
  suspend?: boolean
  duration?: string
  redirectTo?: string
  page?: number
  perPage?: number
}

Deno.serve(async (req: Request) => {
  // Tratamento de preflight CORS
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

    // 2. Cliente administrativo com service_role para verificação e operações
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

    switch (action) {
      case 'invite': {
        if (!body.email || typeof body.email !== 'string') {
          return new Response(
            JSON.stringify({ error: 'Informe um e-mail válido para o convite.' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
          body.email.trim(),
          {
            data: body.metadata ?? {},
            redirectTo: body.redirectTo,
          }
        )

        if (inviteError) {
          return new Response(
            JSON.stringify({ error: inviteError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

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

        const { data: updateData, error: updateError } = await adminClient.auth.admin.updateUserById(
          body.userId,
          body.attributes ?? {}
        )

        if (updateError) {
          return new Response(
            JSON.stringify({ error: updateError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({ success: true, user: updateData.user }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'suspend': {
        if (!body.userId || typeof body.userId !== 'string') {
          return new Response(
            JSON.stringify({ error: 'ID do usuário obrigatório para suspensão.' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Se suspend for false, remove o banimento ('none'); caso contrário, aplica duração padrão de 100 anos (876000h)
        const banDuration = body.suspend === false ? 'none' : (body.duration ?? '876000h')
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

        return new Response(
          JSON.stringify({
            success: true,
            user: suspendData.user,
            suspended: body.suspend !== false,
          }),
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

        // Impede que o próprio superusuário exclua a si mesmo acidentalmente
        if (body.userId === caller.id) {
          return new Response(
            JSON.stringify({ error: 'Não é permitido excluir o próprio usuário logado.' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const { data: deleteData, error: deleteError } = await adminClient.auth.admin.deleteUser(
          body.userId
        )

        if (deleteError) {
          return new Response(
            JSON.stringify({ error: deleteError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({ success: true, user: deleteData.user }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'list': {
        const { data: listData, error: listError } = await adminClient.auth.admin.listUsers({
          page: body.page ?? 1,
          perPage: body.perPage ?? 50,
        })

        if (listError) {
          return new Response(
            JSON.stringify({ error: listError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({ success: true, ...listData }),
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

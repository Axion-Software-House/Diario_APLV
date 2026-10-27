-- Migration: Papel de superusuário e infraestrutura de segurança administrativa
-- Data: 2026-10-27
-- Contexto: Fechamento de cadastro público (novas contas apenas por convite criado por superusuário).
-- O papel superusuário é armazenado em tabela dedicada protegida por RLS.
-- O próprio usuário NUNCA tem permissão de inserir, atualizar ou excluir nesta tabela.
-- Apenas service_role ou funções security definer podem gerenciar superusuários.

-- 1. Tabela dedicada para superusuários
create table if not exists public.superusers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

comment on table public.superusers is
  'Registro de superusuários do sistema. Nenhum usuário comum tem permissão de alteração nesta tabela.';

-- 2. Habilitação de RLS na tabela de superusuários
alter table public.superusers enable row level security;

-- Superusuários autenticados podem consultar a lista de superusuários
create policy "superusers_select_policy"
  on public.superusers
  for select
  to authenticated
  using (
    auth.uid() in (select user_id from public.superusers)
  );

-- Nenhum usuário comum tem permissão de INSERT, UPDATE ou DELETE via API pública/PostgREST.
-- Operações de escrita só ocorrem com a service_role (Edge Functions / backend restrito).

-- 3. Função segura para verificar se um usuário é superusuário
create or replace function public.is_superuser(p_user_id uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.superusers
    where user_id = coalesce(p_user_id, auth.uid())
  );
$$;

comment on function public.is_superuser is
  'Verifica se o usuário especificado (ou o autenticado da sessão) é superusuário.';

grant execute on function public.is_superuser(uuid) to authenticated, service_role;

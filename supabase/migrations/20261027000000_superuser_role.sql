-- Migration: Papel de superusuário e infraestrutura de segurança administrativa
-- Data: 2026-10-27
-- Contexto: Fechamento de cadastro público (novas contas apenas por convite criado por superusuário).
-- O papel superusuário é armazenado em tabela dedicada protegida por RLS.
-- O próprio usuário NUNCA tem permissão de inserir, atualizar ou excluir nesta tabela.
-- Apenas service_role ou funções security definer podem gerenciar superusuários.
-- O primeiro superusuário é criado à mão, no SQL Editor (ver docs/09-progresso.md).

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

-- Cada pessoa autenticada enxerga só a própria linha (ou nenhuma). Uma subconsulta
-- em public.superusers dentro da policy da própria tabela reentra na policy e gera
-- "infinite recursion detected in policy"; comparar com auth.uid() basta.
create policy "superusers_select_policy"
  on public.superusers
  for select
  to authenticated
  using (user_id = auth.uid());

-- Nenhum usuário comum tem permissão de INSERT, UPDATE ou DELETE via API pública/PostgREST.
-- Operações de escrita só ocorrem com a service_role (Edge Functions / backend restrito).

-- 3. Função segura para verificar se um usuário é superusuário.
-- Sem argumento (ou com o próprio uid), responde sobre quem chama. Perguntar por
-- outro UUID é recusado, a menos que a chamada venha com a service_role (a Edge
-- Function admin-users): assim uma conta comum não descobre quem é superusuário.
create or replace function public.is_superuser(p_user_id uuid default null)
returns boolean
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_target uuid := coalesce(p_user_id, auth.uid());
begin
  if v_target is null then
    return false;
  end if;

  if v_target is distinct from auth.uid()
     and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Consulta de papel restrita ao próprio usuário.'
      using errcode = '42501';
  end if;

  return exists (
    select 1
    from public.superusers
    where user_id = v_target
  );
end;
$$;

comment on function public.is_superuser is
  'Verifica se o usuário autenticado é superusuário. Outro UUID só com service_role.';

revoke execute on function public.is_superuser(uuid) from public, anon;
grant execute on function public.is_superuser(uuid) to authenticated, service_role;

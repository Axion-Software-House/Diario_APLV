-- Migration: Log de auditoria para ações do superusuário
-- Data: 2026-10-27
-- Contexto: Registro auditável de quem realizou cada ação administrativa (convidar, editar, suspender, excluir).
-- Garante compliance LGPD e rastreabilidade: apenas metadados de contas administrativas são registrados.

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references auth.users(id),
  actor_email text,
  action text not null,
  target_user_id uuid,
  target_email text,
  details jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

comment on table public.admin_audit_logs is
  'Registro de auditoria de operações administrativas realizadas por superusuários.';

alter table public.admin_audit_logs enable row level security;

-- Apenas superusuários autenticados podem visualizar os logs de auditoria
create policy "admin_audit_logs_select_policy"
  on public.admin_audit_logs
  for select
  to authenticated
  using (
    public.is_superuser(auth.uid())
  );

-- Escrita restrita a service_role (Edge Functions com service_role)

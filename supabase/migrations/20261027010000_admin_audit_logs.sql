-- Migration: Log de auditoria para ações do superusuário
-- Data: 2026-10-27
-- Contexto: Registro auditável de quem realizou cada ação administrativa (convidar, editar, suspender, excluir).
-- Garante compliance LGPD e rastreabilidade: apenas metadados de contas administrativas são registrados.
--
-- O registro sobrevive à exclusão das contas envolvidas:
-- - actor_id aponta para auth.users com ON DELETE SET NULL. Sem isso, um superusuário
--   que já agiu não pode ser excluído (a FK barra o delete). actor_email guarda quem foi.
-- - target_user_id não tem FK de propósito: a conta alvo de um "delete" deixa de existir
--   logo depois do registro, e o UUID continua útil para a investigação.
--
-- A Edge Function grava a linha ANTES de agir (outcome = 'pending') e a fecha depois
-- ('done' ou 'failed'). Se a gravação inicial falha, a ação não é executada.

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  actor_email text,
  action text not null,
  target_user_id uuid,
  target_email text,
  details jsonb not null default '{}'::jsonb,
  outcome text not null default 'pending'
    check (outcome in ('pending', 'done', 'failed')),
  created_at timestamptz not null default now()
);

comment on table public.admin_audit_logs is
  'Registro de auditoria de operações administrativas realizadas por superusuários.';
comment on column public.admin_audit_logs.outcome is
  'pending: registrada antes de agir; done: concluída; failed: tentada e recusada.';

create index if not exists admin_audit_logs_created_at_idx
  on public.admin_audit_logs (created_at desc);

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

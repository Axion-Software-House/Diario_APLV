-- ═══════════════════════════════════════════════════════════════
-- Diário APLV — o histórico de etapas passa a ser imutável no BANCO
--
-- `03-modelo-de-dados.md` §"stage_history — imutável" e
-- `08-plano-implementacao.md` §4.3 dizem que o histórico do TPO não é
-- editável nem apagável pela usuária: "o que foi vivido não se reescreve".
--
-- Até aqui essa garantia existia só na interface (`TimelineItem` não
-- oferece Editar/Excluir para `kind === 'stage'`). No banco, `stage_history`
-- tinha entrado no bloco `do $$` genérico das tabelas de evento
-- (`20260820120200_rls.sql`) e herdou policies de update/delete abertas ao
-- dono — dava para apagar um período ou reescrever a etapa de um período
-- já fechado chamando o PostgREST direto.
--
-- Cuidado que esta migration respeita: `change_stage` é SECURITY INVOKER
-- (por decisão do M9 — a RLS vale para cada escrita dentro dela). Ela
-- precisa fechar o período corrente (`ended_at`, `outcome`, `note`) e
-- inserir a linha nova. Bloquear o update inteiro quebraria a mudança de
-- etapa. Por isso a regra é mais fina: o período AINDA ABERTO pode ser
-- fechado; o que já foi fechado não se toca; e nem no período aberto as
-- colunas estruturais mudam.
-- ═══════════════════════════════════════════════════════════════

-- ── delete: nunca pela usuária ─────────────────────────────────
-- Cascade de FK não passa por RLS, então apagar a criança ou o protocolo
-- continua limpando o histórico junto — o que some é o TPO inteiro, não
-- um pedaço do que foi vivido.
drop policy stage_history_delete on public.stage_history;

create policy stage_history_delete on public.stage_history
  for delete using (false);

-- ── update: só para FECHAR o período corrente ──────────────────
-- `using` filtra a linha antiga: só entra quem ainda está aberto.
drop policy stage_history_update on public.stage_history;

create policy stage_history_update on public.stage_history
  for update using (user_id = auth.uid() and ended_at is null)
  with check (user_id = auth.uid() and public.owns_protocol(protocol_id));

-- ── e, mesmo no período aberto, o que é estrutural não se mexe ─
-- Uma policy não compara OLD com NEW; um trigger compara. Só `ended_at`,
-- `outcome` e `note` podem mudar — exatamente o que `change_stage` escreve.
create function public.stage_history_freeze()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.id          is distinct from old.id
  or new.user_id     is distinct from old.user_id
  or new.protocol_id is distinct from old.protocol_id
  or new.stage       is distinct from old.stage
  or new.started_at  is distinct from old.started_at
  or new.created_at  is distinct from old.created_at then
    raise exception 'O histórico de etapas não pode ser reescrito.'
      using errcode = '42501';
  end if;

  return new;
end $$;

create trigger stage_history_freeze
  before update on public.stage_history
  for each row execute function public.stage_history_freeze();

# M1 — Supabase: Schema, RLS e Tipos

**Objetivo:** banco pronto e blindado antes de qualquer tela consumir dados.
**Estimativa:** 0,5–1 dia · **Depende de:** M0

> Prioridade nº 1 do produto é **segurança dos dados**. Este módulo é a porta.

## Escopo

1. Criar o projeto no Supabase (região São Paulo)
2. `npx supabase link --project-ref <ref>`
3. `npx supabase db push` — aplica as 4 migrations de `../../supabase/migrations/`
4. `npx supabase gen types typescript --linked > src/types/database.ts`
5. `types/domain.ts` — tipos de UI derivados; `types/index.ts` — barrel
6. `services/supabase.ts` — client único, lendo `VITE_SUPABASE_URL` /
   `VITE_SUPABASE_ANON_KEY`, com `persistSession: true` e `autoRefreshToken: true`.
   **Falha ruidosa** se a env faltar.
7. `lib/errors.ts` — `AppError` + `toAppError(e: unknown): AppError` com o mapeamento
   de `../02-arquitetura.md`
8. Esqueleto dos services com assinaturas tipadas

## Migrations

Já escritas e validadas contra Postgres 16:

| Arquivo | Conteúdo |
|---|---|
| `20260820120000_enums.sql` | 6 enums |
| `20260820120100_tables.sql` | 9 tabelas + índices |
| `20260820120200_rls.sql` | 4 helpers de posse + 36 policies |
| `20260820120300_auth_trigger.sql` | `handle_new_user` |

Migration aplicada **nunca** é editada. Mudança = migration nova.

## Teste de RLS (obrigatório, não pular)

Com dois usuários de teste A e B:

- [ ] A insere criança → ok
- [ ] B faz `select` em cada uma das 8 tabelas → **0 linhas** de A
- [ ] B tenta `update`/`delete` em linha de A → **0 linhas afetadas**
- [ ] B insere com `user_id` de A → **erro de policy**
- [ ] B insere no `protocol_id` de A com o **próprio** `user_id` → **erro de policy**
- [ ] B cria protocolo apontando para `child_id` de A → **erro de policy**
- [ ] B insere item no `symptom_event_id` de A → **erro de policy**
- [ ] Signup cria linha em `profiles` automaticamente

## Critério de aceite

- [ ] 9 tabelas criadas, **nenhuma view**
- [ ] `rowsecurity = true` para todas:
      `select tablename, rowsecurity from pg_tables where schemaname='public'`
- [ ] Checklist de RLS acima 100% verde
- [ ] `src/types/database.ts` gerado e commitado
- [ ] `typecheck` limpo

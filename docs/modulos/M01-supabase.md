# M2 — Supabase: Schema, RLS e Tipos

**Objetivo:** banco pronto e blindado antes de qualquer tela consumir dados.
**Estimativa:** 1 dia · **Depende de:** M0 (independe do M1)

## Escopo

1. Criar projeto no Supabase (região mais próxima do Brasil)
2. Rodar o SQL de `../03-modelo-de-dados.md` no SQL Editor, na ordem:
   enums → tabelas → índices → view `timeline_events` → trigger `handle_new_user`
3. Habilitar RLS e criar as 4 policies em **todas** as tabelas
4. Marcar a view com `security_invoker = on`
5. Gerar tipos: `npx supabase gen types typescript --project-id <id> > src/types/database.ts`
6. `types/domain.ts` — tipos de UI derivados; `types/index.ts` — barrel
7. `services/supabase.ts` — client único, lendo `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`,
   com `persistSession: true` e `autoRefreshToken: true`. Falha ruidosa se a env faltar.
8. `lib/errors.ts` — `AppError` + `toAppError(e: unknown): AppError` com o mapeamento da tabela em `../02-arquitetura.md`
9. Esqueleto dos services com assinaturas tipadas (corpo pode retornar `notImplemented()` por ora)

## Teste de RLS (obrigatório, não pular)

No SQL Editor, com dois usuários de teste A e B:

- [ ] A insere criança → ok
- [ ] B faz `select * from children` → **0 linhas** de A
- [ ] B tenta `update` na criança de A por id → **0 linhas afetadas**
- [ ] B tenta `insert` em `exposures` com `user_id` de A → **erro de policy**
- [ ] `select * from timeline_events` como B → só eventos de B
- [ ] Signup de novo usuário cria linha em `profiles` automaticamente

## Critério de aceite

- [ ] 9 tabelas + 1 view criadas
- [ ] `rowsecurity = true` para todas: `select tablename, rowsecurity from pg_tables where schemaname='public'`
- [ ] Checklist de RLS acima 100% verde
- [ ] `src/types/database.ts` gerado e commitado
- [ ] `typecheck` limpo

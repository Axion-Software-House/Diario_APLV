# M3 — Onboarding

**Objetivo:** do cadastro ao primeiro acompanhamento ativo, sem fricção.
**Estimativa:** 0,5 dia · **Depende de:** M2 · **Status: ✅ concluído**

## Escopo

### Criança
- nome / apelido
- data de nascimento
- alimentação atual (chips de `constants/feeding.ts`)

### Acompanhamento
- início
- motivo
- profissional (opcional)
- `status = 'active'`
- `current_stage = 1`

Ao concluir, gravar também a primeira linha de `stage_history` (etapa 1, `started_at`).

As três escritas acontecem numa transação só, pela função `create_onboarding`
(`supabase/migrations/20260820140000_onboarding_rpc.sql`). Em requisições
separadas, uma falha no meio deixaria criança órfã ou acompanhamento sem
histórico — e o app trataria o onboarding como concluído.

`ProtocolContext` passa a expor a criança e o acompanhamento ativos.
`<ProtectedRoute>` manda para `/onboarding` quem não tiver criança.

## Critério de aceite

- [x] Criar → refresh → **continua presente**
- [x] `children`, `protocols` e `stage_history` recebem uma linha cada
- [x] `current_stage = 1` e `status = 'active'`
- [x] Digitação mínima: só nome e motivo são texto livre
- [x] Concluído o onboarding, `/onboarding` não reaparece

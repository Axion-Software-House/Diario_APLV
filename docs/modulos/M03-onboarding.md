# M3 — Onboarding

**Objetivo:** do cadastro ao primeiro acompanhamento ativo, sem fricção.
**Estimativa:** 0,5 dia · **Depende de:** M2

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

`ProtocolContext` passa a expor a criança e o acompanhamento ativos.
`<ProtectedRoute>` manda para `/onboarding` quem não tiver criança.

## Critério de aceite

- [ ] Criar → refresh → **continua presente**
- [ ] `children`, `protocols` e `stage_history` recebem uma linha cada
- [ ] `current_stage = 1` e `status = 'active'`
- [ ] Digitação mínima: só nome e motivo são texto livre
- [ ] Concluído o onboarding, `/onboarding` não reaparece

# M4 — Onboarding

**Objetivo:** do cadastro ao primeiro protocolo ativo, sem fricção.
**Estimativa:** 0,5 dia · **Depende de:** M3

## Escopo

- `schemas/child.schema.ts` — `name` (1–80), `birthDate` opcional e não futura
- `services/protocol.service.ts` — `createChild`, `listChildren`, `createProtocol`,
  `getActiveProtocol(userId)`
- `pages/Onboarding` — 2 passos em uma coluna:
  1. "Sobre quem é o acompanhamento" → nome + data de nascimento
  2. "Vamos começar" → resumo da escada (`STAGES`) + botão "Iniciar acompanhamento"
- Ao confirmar: cria `children` → cria `protocols` (stage 1, active) → cria a primeira linha
  de `stage_history` (stage 1, `started_at = now()`) → navega para `/app`
- `contexts/ProtocolContext` — carrega criança + protocolo ativo uma vez para todo `/app`
- `ProtectedRoute` manda para `/onboarding` quem não tem criança

## Regras

- As três inserções acontecem no **service**, em sequência; se a segunda falhar, informar
  erro e não deixar estado meia-boca visível ao usuário (recarregar o contexto resolve).
- Sem seleção de etapa manual aqui: todo protocolo começa na etapa 1.

## Critério de aceite

- [ ] Usuário novo cai em `/onboarding` obrigatoriamente
- [ ] Salvar cria 1 `children` + 1 `protocols` + 1 `stage_history`
- [ ] Usuário com protocolo ativo nunca mais vê `/onboarding`
- [ ] Erro de rede mantém o formulário preenchido

# M10 — Etapas da Escada

**Objetivo:** registrar a decisão humana de avançar, repetir ou retornar — nunca decidir por ela.
**Estimativa:** 0,5 dia · **Depende de:** M9

## Escopo

- `services/protocol.service.ts` — `changeStage(protocolId, { toStage, outcome, note })`:
  fecha a linha atual de `stage_history` (`ended_at`, `outcome`), abre a nova e atualiza
  `protocols.current_stage`
- `organisms/MilkLadder` ganha ação: "Avançar etapa", "Repetir etapa", "Voltar etapa"
- Modal de confirmação com campo de observação opcional e texto claro do que será registrado
- Histórico de etapas visível (quando entrou/saiu de cada uma) no `StageOverview`
- `pausar` / `finalizar` protocolo (`protocols.status`) — ação secundária no menu

## Regras — leia antes de codar

- **Nenhuma sugestão automática de avanço.** Nada de "você está pronta para a etapa 3".
- Sem bloqueio por tempo ou por sintomas; a decisão é da usuária com seu profissional.
- Texto do modal: _"Você está registrando a mudança para a Etapa X. Essa é uma decisão sua e
  do profissional que acompanha vocês."_

## Critério de aceite

- [ ] Avançar fecha a etapa anterior com `ended_at` + `outcome='advanced'` e abre a nova
- [ ] Voltar registra `outcome='returned'`
- [ ] `protocols.current_stage` fica consistente com a última linha aberta de `stage_history`
- [ ] Mudança de etapa aparece na timeline
- [ ] Não existe nenhum texto que recomende avançar/parar

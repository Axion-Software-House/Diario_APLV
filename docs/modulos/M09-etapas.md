# M9 — Etapas da Escada

**Objetivo:** registrar a decisão humana de avançar, repetir ou retornar — nunca decidir por ela.
**Estimativa:** 0,5 dia · **Depende de:** M8

## Etapas (`constants/stages.ts`)

| # | Etapa |
|---|---|
| 1 | Preparação assada |
| 2 | Derivado aquecido |
| 3 | Queijo |
| 4 | Iogurte |
| 5 | Leite |

## Ações

`avançar` · `retornar` · `repetir`

Cada ação: fecha o período corrente em `stage_history` (`ended_at` + `outcome`),
cria uma **linha nova** e atualiza `protocols.current_stage`.

**O histórico é imutável.** Nunca faz update destrutivo do que já foi vivido.

## Confirmação obrigatória

> Avance apenas se estiver seguindo o plano definido pela equipe assistente.

Nenhuma sugestão automática de avanço, nenhuma classificação de gravidade,
nenhuma recomendação de conduta.

## Escopo adicional

Incluir `stage_history` na timeline.

## Critério de aceite

- [x] Avançar, retornar e repetir criam período novo em `stage_history`
- [x] O período anterior recebe `ended_at` e `outcome`, e **não é apagado**
- [x] `protocols.current_stage` acompanha, sempre entre 1 e 5
- [x] Confirmação exibida antes de toda mudança
- [x] Mudança aparece na timeline
- [x] O app nunca sugere avançar ou parar

# M11 — Design System

**Objetivo:** padronização visual do que já existe e funciona.
**Estimativa:** 0,5 dia · **Depende de:** M10

> **Não alterar regra de negócio.** Este módulo extrai e unifica; não inventa
> comportamento novo nem mexe em fluxo de dados.

## Criar / padronizar

| Camada | Componentes |
|---|---|
| atoms | `Button` · `Input` · `Select` · `Textarea` · `Chip` · `Badge` · `Loading` |
| molecules | `ActionTile` · `SeveritySelector` · `SymptomRow` · `Card` · `Alert` · `Toast` |
| organisms | `Modal` |

Página `/dev` com todos eles em todos os estados.

## Critério de aceite

- [ ] `/dev` mostra os 14 componentes em todos os estados
- [ ] Nenhuma cor ou tamanho hard-coded fora de `tokens.css`
- [ ] Atoms não importam `services/` nem `supabase`
- [ ] Nenhum comportamento de negócio mudou — os aceites de M2–M10 continuam verdes
- [ ] Foco visível em todo componente interativo

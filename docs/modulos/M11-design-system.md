# M1 — Design System e Atoms

**Objetivo:** vocabulário visual pronto, para nenhum módulo seguinte inventar estilo.
**Estimativa:** 1 dia · **Depende de:** M0

## Escopo

1. `styles/tokens.css` — copiar de `../04-design-system.md`
2. `styles/global.css` — reset, box-sizing, `body` com fundo/tipo dos tokens, foco visível,
   `@media print` base (esconde `[data-print="hide"]`)
3. Atoms (cada um com CSS Module + `index.ts`):

| Atom       | Props principais                                                                                     |
| ---------- | ---------------------------------------------------------------------------------------------------- |
| `Button`   | `variant: primary\|secondary\|ghost\|danger`, `size: sm\|md\|lg`, `fullWidth`, `loading`, `disabled` |
| `Input`    | `label`, `error`, `hint`, `type`, ref forwarded                                                      |
| `Textarea` | idem + `rows`                                                                                        |
| `Select`   | `options: {value,label}[]`, `label`, `error`                                                         |
| `Checkbox` | `label`, `checked`, `onChange`                                                                       |
| `Chip`     | `selected`, `onToggle`, `icon`                                                                       |
| `Badge`    | `tone: neutral\|success\|danger\|primary`                                                            |
| `Icon`     | wrapper do Lucide com `size` e `aria-hidden`                                                         |
| `Spinner`  | `size`                                                                                               |
| `Divider`  | `spacing`                                                                                            |

4. `pages/DevKit` na rota `/dev` (só em `import.meta.env.DEV`) renderizando todos os atoms
   em todos os estados.

## Regras

- Atoms **não** importam services, hooks de dados ou constants de domínio.
- `Button` com `loading` fica `disabled` e mostra `Spinner` + texto.
- Todo input tem `<label>` associado por `id` e `aria-describedby` para erro.

## Critério de aceite

- [ ] `/dev` mostra os 10 atoms, incluindo estados de erro, loading e disabled
- [ ] Nenhum valor de cor/espaço hard-coded fora de `tokens.css` (`grep -rE "#[0-9a-fA-F]{6}" src/components` vazio)
- [ ] Navegação por teclado com foco visível em todos os atoms
- [ ] Alvos de toque ≥48px no mobile
- [ ] `typecheck` e `build` limpos

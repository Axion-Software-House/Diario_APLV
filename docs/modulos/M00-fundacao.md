# M0 — Fundação do Projeto

**Objetivo:** projeto rodando, com padrões e estrutura de pastas prontos, sem nenhuma feature.
**Estimativa:** 0,5 dia · **Depende de:** nada · **Status: ✅ concluído**

## Escopo

- Scaffold Vite + React + TypeScript
- `tsconfig`: `strict`, `noUncheckedIndexedAccess`, alias `@/* → src/*`
- Vite: `resolve.alias` para `@`
- oxlint + Prettier (`docs/` fora do Prettier)
- Scripts: `dev`, `build`, `preview`, `lint`, `typecheck`, `format`
- Árvore de pastas de `../02-arquitetura.md` (`.gitkeep` onde vazia)
- `src/styles/tokens.css` com a paleta de `../04-design-system.md`
- `.env.example`, `.gitignore` cobrindo `.env.local`
- `index.html`: `lang="pt-BR"`, `<title>Diário APLV</title>`, meta description, theme-color
- `git init` + primeiro commit

## Critério de aceite

- [x] `npm run dev` sobe e mostra "Diário APLV"
- [x] `npm run build` sem erro
- [x] `npm run typecheck` sem erro
- [x] `npm run lint` sem erro
- [x] `import x from '@/utils/dates'` resolve
- [x] Árvore de pastas idêntica à especificação

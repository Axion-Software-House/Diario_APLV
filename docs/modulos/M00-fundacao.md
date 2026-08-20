# M0 — Fundação do Projeto

**Objetivo:** projeto rodando, com padrões e estrutura de pastas prontos, sem nenhuma feature.
**Estimativa:** 0,5 dia · **Depende de:** nada

## Escopo

- `npm create vite@latest diario-aplv -- --template react-ts`
- `tsconfig`: `strict: true`, `noUncheckedIndexedAccess: true`, alias `@/* → src/*`
- Vite: `resolve.alias` para `@`
- ESLint + Prettier (config mínima, sem regra exótica)
- Scripts: `dev`, `build`, `preview`, `lint`, `typecheck` (`tsc --noEmit`)
- Criar toda a árvore de pastas de `02-arquitetura.md` (com `.gitkeep` onde estiver vazia)
- `.env.example`, `.gitignore` cobrindo `.env.local`
- `index.html`: `lang="pt-BR"`, `<title>Diário APLV</title>`, meta description e theme-color
- `git init` + primeiro commit

## Entregáveis

```
package.json  vite.config.ts  tsconfig.json  .eslintrc.cjs  .prettierrc
.env.example  .gitignore  index.html
src/{components/{atoms,molecules,organisms,templates},pages,hooks,services,types,utils,constants,routes,styles,contexts,lib,schemas}/
src/App.tsx  src/main.tsx
```

## Critério de aceite

- [ ] `npm run dev` sobe e mostra "Diário APLV"
- [ ] `npm run build` sem erro
- [ ] `npm run typecheck` sem erro
- [ ] `npm run lint` sem erro
- [ ] `import x from '@/utils/dates'` resolve
- [ ] Árvore de pastas idêntica à especificação

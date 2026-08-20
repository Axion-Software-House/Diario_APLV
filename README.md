# Diário APLV

> Acompanhamento simples, registro seguro.

Diário de registro rápido para famílias em reintrodução de leite e derivados
(escada do leite). Registra exposições, sintomas, fraldas e observações em
poucos toques e organiza tudo em timeline e relatório para o profissional de saúde.

**O app registra fatos e organiza. Não estabelece diagnóstico nem sugere conduta.**

## Stack

React + TypeScript (strict) · Vite · Supabase (Postgres + Auth + RLS) ·
React Router · React Hook Form + Zod · date-fns · Lucide · CSS Modules

## Rodando

```bash
npm install
cp .env.example .env.local   # preencha com as chaves do projeto Supabase
npm run dev
```

## Scripts

| Script | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Typecheck + build de produção |
| `npm run typecheck` | `tsc -b --noEmit` |
| `npm run lint` | oxlint |
| `npm run format` | Prettier (não toca em `docs/`) |

## Documentação

O plano de construção está em [`docs/`](docs/) — comece por
[`docs/05-roadmap.md`](docs/05-roadmap.md).

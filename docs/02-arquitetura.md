# 02 — Arquitetura

## Fluxo de dados (regra única)

```
page  →  hook  →  service  →  supabase-js  →  PostgreSQL (RLS)
  ↑                  │
  └── estado ────────┘
```

- **page**: conhece rota, params e orquestra hooks + template.
- **hook**: guarda estado (`idle | loading | success | error`), chama services, expõe ações.
- **service**: única camada que fala com o Supabase. Recebe/retorna tipos de domínio,
  nunca linhas cruas do banco. Traduz erro do Postgres em `AppError`.
- **componentes**: recebem dados por props. Organisms podem receber callbacks; nunca importam service.

Proibido: `supabase.from(...)` dentro de `components/`.

## Camadas do Atomic Design

| Camada    | Sabe de regra de negócio?            | Sabe de dados remotos?  | Exemplo                        |
| --------- | ------------------------------------ | ----------------------- | ------------------------------ |
| atoms     | não                                  | não                     | `Button`, `Chip`, `Input`      |
| molecules | pouca, só de apresentação            | não                     | `SymptomChip`, `StageProgress` |
| organisms | sim (validação, montagem de payload) | não (recebe `onSubmit`) | `SymptomForm`                  |
| templates | não, só layout                       | não                     | `AppTemplate`                  |
| pages     | sim                                  | sim (via hooks)         | `Protocol`                     |

Cada componente é uma pasta:

```
Button/
├── Button.tsx
├── Button.module.css
├── Button.types.ts   (só se os tipos crescerem)
└── index.ts
```

Se um componente passar de ~150 linhas ou acumular duas responsabilidades, quebre para baixo.

## Estrutura de pastas

Exatamente a definida na especificação (`src/components|pages|hooks|services|types|utils|constants|routes|styles`).
Adições permitidas ao longo dos módulos:

```
src/
├── contexts/
│   ├── AuthContext.tsx
│   └── ProtocolContext.tsx
├── lib/
│   └── errors.ts        # AppError + mapeamento
└── schemas/
    ├── child.schema.ts
    ├── exposure.schema.ts
    ├── symptom.schema.ts
    └── diaper.schema.ts
```

## Estado global

Só dois contextos:

- `AuthContext` — sessão, usuário, `signIn/signUp/signOut`, `loading` inicial.
- `ProtocolContext` — protocolo ativo + criança ativa (evita re-fetch em toda tela do `/app`).

Todo o resto é estado local da página.

## Rotas

```
/                      → redireciona (autenticado → /app, senão → /login)
/login                 pública
/register              pública
/onboarding            protegida (sem criança cadastrada)
/app                   protegida  — dashboard
/app/protocol/:id      protegida
/app/report/:id        protegida
*                      NotFound
```

`<ProtectedRoute>` bloqueia enquanto `auth.loading === true` (spinner), redireciona para
`/login` se não houver sessão, e para `/onboarding` se o usuário não tiver criança.

## Estados de ação (obrigatório em toda escrita)

```ts
type ActionState = 'idle' | 'loading' | 'success' | 'error'
```

Contrato de UI:

- `loading` → botão desabilitado com "Salvando..."
- `success` → feedback "Registro salvo", **então** limpa o formulário e atualiza a timeline
- `error` → "Não foi possível salvar. Tente novamente." e o formulário **mantém** os dados

## Tratamento de erros

`src/lib/errors.ts` centraliza:

| Caso                    | Mensagem para a usuária                                    |
| ----------------------- | ---------------------------------------------------------- |
| Sessão expirada         | "Sua sessão expirou. Entre novamente." + redirect `/login` |
| Rede offline            | "Sem conexão. Verifique sua internet."                     |
| Erro do Supabase        | "Não foi possível salvar. Tente novamente."                |
| Validação               | mensagem do campo, vinda do Zod                            |
| Registro não encontrado | "Registro não encontrado."                                 |

Log técnico só em `console.error` (dev). Nada de código do Postgres na tela.

## Timeline

A timeline é **derivada**, não é uma tabela de escrita. Origem: view SQL `timeline_events`
(ver `03-modelo-de-dados.md`), consumida por `useTimeline` e normalizada em
`utils/timeline.ts` para o tipo `TimelineEvent`.

## Fuso horário

Tudo persistido em `timestamptz` (UTC). Formatação sempre com date-fns + `ptBR` no cliente.
Nunca comparar strings de data; sempre `Date`.

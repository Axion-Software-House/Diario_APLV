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
- `ProtocolContext` — acompanhamento ativo + criança ativa + etapa atual
  (evita re-fetch em toda tela do `/app`).

Todo o resto é estado local da página.

## Rotas

```
/                      → redireciona (autenticado → /app, senão → /login)
/login                 pública
/register              pública
/onboarding            protegida (sem criança cadastrada)
/app                   protegida  — Home / dashboard com os 8 atalhos
/app/exposicao         protegida  — registro de exposição       (M5)
/app/sintomas          protegida  — registro rápido de sintomas (M6)
/app/sem-sintomas      protegida  — atalho direto "SEM SINTOMAS" (M6)
/app/fralda            protegida  — registro de fralda          (M8)
/app/observacao        protegida  — anotação livre              (M8)
/app/timeline          protegida  — linha do tempo              (M7)
/app/etapas            protegida  — avançar/repetir/retornar    (M9)
/app/relatorio         protegida  — relatório + impressão       (M10)
*                      NotFound
```

Cada atalho da Home aponta direto para a sua rota: **nenhuma ação principal
fica a mais de 1 toque da Home**. Toda tela de registro tem retorno simples
para `/app`.

`<ProtectedRoute>` bloqueia enquanto `auth.loading === true` (spinner), redireciona para
`/login` se não houver sessão, e para `/onboarding` se o usuário não tiver criança.

## Estados de ação (obrigatório em toda escrita)

```ts
type ActionState = 'idle' | 'saving' | 'success' | 'error'
```

Contrato de UI:

- `saving` → botão **desabilitado** com "Salvando..." (evita registro duplicado)
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

A timeline é **derivada no frontend** — não existe tabela nem view `timeline_events`.

`useTimeline` busca em paralelo as 5 origens do acompanhamento ativo
(`exposures`, `symptom_events` + itens, `diaper_records`, `notes`, `stage_history`),
`utils/timeline.ts` normaliza cada linha para o tipo `TimelineEvent` e ordena por
`occurred_at DESC`. O agrupamento por dia acontece na renderização.

Motivo da escolha (roadmap M7): o relatório (M10) precisa da mesma união em memória
para montar o resumo por etapa e a tabela de temporalidade. Uma view SQL duplicaria
essa lógica e adicionaria superfície de RLS sem ganho.

### Temporalidade

```
symptom_events.occurred_at − exposures.occurred_at
```

Calculada em `utils/timeline.ts`, exibida como `8h40 após exposição`.
**Nunca gravada e nunca apresentada como causalidade** — o app mostra o intervalo,
a interpretação é do profissional de saúde.

## Fuso horário

Tudo persistido em `timestamptz` (UTC). Formatação sempre com date-fns + `ptBR` no cliente.
Nunca comparar strings de data; sempre `Date`.

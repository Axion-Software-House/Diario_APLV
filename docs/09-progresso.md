# 09 — Progresso da nova arquitetura (handoff)

> Estado da implementação do [`08-plano-implementacao.md`](08-plano-implementacao.md).
> Atualizado em **2026-08-30**. Retome por aqui.

## Onde está

- **Branch de trabalho:** `feat/nova-arquitetura-funcional` (18 commits, ainda **não** mergeado na `main`)
- **Fases 0, 1, 2, 3 e 4 concluídas.** O escopo do plano `08` está implementado.
  O que resta é QA em navegador, validação clínica do conteúdo do Aprender, e o merge na `main`.
- `npm run typecheck && npm run lint && npm run build` limpos em todos os commits.
- Dev server (`npm run dev`) sobe sem erro.
- Nome do produto confirmado: **Diário APLV** ("Lactra" descartado de vez).

### Banco de dados

- Projeto Supabase: **`freyliehlyjciaixbxoh`** (nome `Diario_APLV`, região `sa-east-1`).
- As **9 migrations da Fase 0 já foram aplicadas** no banco (`supabase db push` em 2026-08-30).
- Tipos regenerados (`src/types/database.ts`) — bateram com o que tinha sido escrito à mão.
- O banco **não tinha dados** — o backfill das migrations foi inócuo.
- **`supabase db push` é bloqueado pelo classificador de segurança do Claude Code.** Para novas
  migrations: ou o usuário roda `npx supabase db push` no PowerShell, ou autoriza pontualmente,
  ou adiciona `Bash(npx supabase db push:*)` em `.claude/settings.local.json`.
  Login (`supabase login --token`), `link`, `migration list`, `gen types` e `db dump` funcionam.

## Fase 0 — desacoplar o Diário do TPO ✅

| Commit | O que fez |
|---|---|
| `ba4de0e` | 9 migrations: `child_id NOT NULL` nas tabelas de evento; `protocol_id`/`stage` opcionais; RLS por criança; `exposures` ganha `consumer`/`brand`/`details`; tabelas `product_records`, `environment_records`, `health_records`; `tpo_stages` (escada configurável); `create_onboarding` só cria a criança; `start_tpo` nova; `create_symptom_event` com `child_id` |
| `e76fe4c` | `ProtocolContext` → **`ChildContext`** + `useChild`; `RequireProtocol` → `RequireChild`; todos os services de evento por `child_id`; `useRecordWrite` expõe `childId` + `protocolId`/`stage` nuláveis; `buildReport` aceita TPO nulo |
| `5fd4d20` | migrations aplicadas + tipos regenerados |

**Modelo de dados vigente** (decisão em `08-plano` §3): três níveis —
`children` (sujeito longitudinal) → eventos do diário (`child_id`, `protocol_id` opcional) →
`protocols` (o "TPO", 0..N, 1 ativo). Nomes de tabela `exposures` e `protocols` mantidos;
o vocabulário ("Alimentação", "TPO") vive no domínio/UI.

## Fase 1 — reorganizar a experiência ✅

| Commit | O que fez |
|---|---|
| `ab65969` | `BottomNav` (organism) + `constants/navigation.ts`; `AppTemplate` prop `bottomNav`; 4 abas: **Início / Diário / TPO / Aprender**. Timeline vira `/app/diario`. Aba `/app/tpo`: orientação + "Iniciar um TPO" (`start_tpo`) quando não há TPO; etapa + histórico quando há. `/app/aprender` placeholder. Rotas antigas viram redirects. |
| `8ce6cf2` | Home das **6 ações** (`HOME_ACTIONS`) + "Tudo tranquilo por aqui?" + card "TPO em andamento". Rotas `/app/alimentacao`, `/app/tudo-tranquilo`; stubs `/app/produto`, `/app/ambiente`, `/app/saude`. |
| `37e6879` | `ExposureForm` → "Quem consumiu? Mãe/Criança" + "+ Adicionar detalhes" (marca, ingredientes, quantidade, data/hora, obs). Timeline mostra consumidor + marca. |
| `829255d` | `SymptomForm` progressivo: "O que você percebeu?" → 6 categorias → sintoma+intensidade. `constants/symptoms.ts`: 4 grupos → **6** (`fezes`, `barriguinha`, `pele`, `respiracao`, `comportamento`, `outro`) — **codes inalterados**. "Outro" com campo livre → observação. |
| `7d8a0b7` | Diário: filtros (`Tudo / Alimentação / Sintomas / Fraldas / Outros`) + "+ Novo registro" (`NewRecordSheet`, inclui Observação livre). `useDiary`/`useTimeline` expõem `refresh()`. |
| `7fcb067` | Editar/excluir: `TimelineItem` expande em "Editar"/"Excluir" (menos `stage`); `DiaryEntryModal` edita por tipo; `services` ganham `update*`/`delete*`; `useEntryMutation`. Sintomas: edita hora/vínculo/obs — trocar sintomas é excluir e refazer. |

## Fase 2 — ampliar o Diário ✅

| Commit | O que fez |
|---|---|
| `12b43c5` | Onboarding sem "início do acompanhamento" (era da F0). Motivo/profissional descrevem a criança. |
| `95720cb` | **Produto / Higiene** — `constants/products.ts` (9 categorias), `ProductForm`, `services/products.ts` (CRUD), `useCreateProductRecord`, timeline `kind: 'product'`, editar/excluir. |
| `c687301` | **Ambiente / Visita** — `constants/environments.ts` (6 lugares), `EnvironmentForm`, `services/environments.ts`, timeline `kind: 'environment'`. |
| `1c09f07` | **Saúde** — `/app/saude` hub + `/app/saude/:kind`; `HealthForm` parametrizado; `health_records` com `data` jsonb (medication: `dose`; vaccine: `reaction`; appointment: `guidance`/`questions`; weight: `kg`). `HealthData`/`readHealthData` em `constants/health.ts` (util não importa services). |
| `50647a2` | Relatório: seletor de período (`utils/reportPeriod.ts` — Hoje/7/14/30/Todo/TPO atual), `filterSources`, contagens de produto/ambiente/saúde, resumo por etapa só com TPO. Auditoria de linguagem OK. |

## Fase 3 — Aprender ✅

| Commit | O que fez |
|---|---|
| `b144137` | `constants/learn.ts` (3 seções: Entenda a APLV, Quando procurar ajuda, Sobre o TPO — só as perguntas de cada card); flag `VITE_LEARN_CONTENT_READY` — desligada, cada card mostra a pergunta + "em revisão clínica"; "Quando procurar ajuda" com os 3 níveis visuais; o app não pede autoclassificação IgE/não-IgE; `LearnCard`, `Learn` (hub), `LearnTopic` (`/app/aprender/:topic`); `vite-env.d.ts` + `.env.example` |

**Bloqueado por fora do código:** os textos (`body` de cada `LearnCard` e os sinais de cada
nível de urgência) precisam de validação clínica formal. Quando existirem: preencher os `body`
em `constants/learn.ts` e cadastrar `VITE_LEARN_CONTENT_READY=true`.

## Fase 4 — refino do TPO ✅

| Commit | O que fez |
|---|---|
| `0552fe6` | `useTpoStages` lê a tabela `tpo_stages` (fallback nos constants + cache de sessão); aba TPO mostra explicação da etapa, "Por que esta etapa?" (`why_this_stage`), contagens da etapa e atalhos rápidos; sequência de referência de `tpo_stages`; `Stages`/`StageActions`/`StageHistoryList`/card da Home/relatório passam a usar rótulos e contagem de `tpo_stages` (`buildReport(..., tpoStages)`) |

**Aresta:** `buildTimeline` (`stageEvents`) ainda rotula a linha de mudança de etapa com o
constant `stageLabel` — não thread do `tpo_stages`. Como o seed bate com os constants, só
aparece se o cliente renomear uma etapa no banco. Threadar exige passar labels por `useTimeline`.

## O que falta

### QA do usuário (pendente)
- [ ] Reteste de RLS com 2 usuários nas **12 tabelas** (bateria do M1 em `03-modelo-de-dados.md`)
- [ ] Testar contra o banco: editar/excluir registros; criar produto/ambiente/saúde
- [ ] Breakpoints 375–1440, PWA, impressão do relatório (checklist `06-checklist-qualidade.md`)
- [ ] Se `06` e `05-roadmap` forem reconciliados: apontar para `08`/`09` como autoridade atual

## Como retomar

```powershell
cd C:\Users\Usuario\Desktop\PROJETOS-AXION\Diario_APLV
git checkout feat/nova-arquitetura-funcional
npm install   # se necessário
npm run dev
```

O `.env` local já tem `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` do projeto
`freyliehlyjciaixbxoh`. Nada mais a configurar para rodar.

## Mapa dos arquivos novos (F0–F4)

```
src/
├── contexts/ChildContext.tsx           # criança ativa + TPO ativo
├── hooks/
│   ├── useChild.ts  useStartTpo.ts  useEntryMutation.ts  useTpoStages.ts
│   ├── useCreateProductRecord.ts  useCreateEnvironmentRecord.ts  useCreateHealthRecord.ts
├── routes/RequireChild.tsx
├── constants/
│   ├── navigation.ts   # 4 abas
│   ├── shortcuts.ts    # HOME_ACTIONS (6) + CALM_ACTION + NOTE_ACTION + NEW_RECORD_ACTIONS
│   ├── diaryFilters.ts  products.ts  environments.ts  health.ts  learn.ts
│   └── symptoms.ts     # 6 grupos
├── services/products.ts  environments.ts  health.ts   # + update*/delete* em exposures/diapers/notes/symptoms; listTpoStages em protocols.ts
├── schemas/product.schema.ts  environment.schema.ts
├── components/
│   ├── molecules/LearnCard/
│   └── organisms/BottomNav/  NewRecordSheet/  DiaryEntryModal/  ProductForm/  EnvironmentForm/  HealthForm/
├── pages/
│   ├── Tpo/  Learn/  LearnTopic/  Product/  Environment/  Health/  HealthEntry/
│   └── Timeline/  # agora é o "Diário" (título + filtros + modal)
├── utils/reportPeriod.ts
└── supabase/migrations/20260829120000..20260829120800_*.sql
```

## Limpeza pós-fases (`2ee1d23`, `1c7fb53`)

- `pages/Timeline/` → `pages/Diario/` (componente `Diario`); `git mv` preservou o histórico.
- `buildTimeline` recebe a função de rótulo de etapa; `useTimeline` e o relatório passam a
  de `tpo_stages`. Renomear uma etapa no banco agora reflete na timeline.
- `docs/00`–`07` ganharam avisos de "nova arquitetura" no topo; `08` + `09` são a autoridade.

## Arestas conhecidas

- `services/health.ts` reexporta `HealthData` de `constants/health.ts` (para não vazar `supabase` no util).
- Edição de `symptom_events` não troca os sintomas marcados (por design — excluir e refazer).
- Aprender: nenhum `body` de card preenchido ainda — depende da validação clínica.
- Warnings de CRLF do git ao commitar são esperados (autocrlf); não afetam nada.

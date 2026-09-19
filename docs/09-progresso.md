# 09 — Progresso da nova arquitetura (handoff)

> Estado da implementação do [`08-plano-implementacao.md`](08-plano-implementacao.md).
> Atualizado em **2026-09-19**. Retome por aqui.

## Onde está

- **Mergeado na `main` em 2026-09-16** (commit `ce7924c`) e publicado — o Netlify tem deploy
  contínuo na `main`. https://diario-aplv.netlify.app já roda a nova arquitetura.
- **Fases 0, 1, 2, 3 e 4 concluídas.** O escopo do plano `08` está implementado.
  O que resta é QA em navegador e a validação clínica do conteúdo do Aprender.
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
| `1e452ef` | 9 migrations: `child_id NOT NULL` nas tabelas de evento; `protocol_id`/`stage` opcionais; RLS por criança; `exposures` ganha `consumer`/`brand`/`details`; tabelas `product_records`, `environment_records`, `health_records`; `tpo_stages` (escada configurável); `create_onboarding` só cria a criança; `start_tpo` nova; `create_symptom_event` com `child_id` |
| `065a008` | `ProtocolContext` → **`ChildContext`** + `useChild`; `RequireProtocol` → `RequireChild`; todos os services de evento por `child_id`; `useRecordWrite` expõe `childId` + `protocolId`/`stage` nuláveis; `buildReport` aceita TPO nulo |
| `0d917d6` | migrations aplicadas + tipos regenerados |

**Modelo de dados vigente** (decisão em `08-plano` §3): três níveis —
`children` (sujeito longitudinal) → eventos do diário (`child_id`, `protocol_id` opcional) →
`protocols` (o "TPO", 0..N, 1 ativo). Nomes de tabela `exposures` e `protocols` mantidos;
o vocabulário ("Alimentação", "TPO") vive no domínio/UI.

## Fase 1 — reorganizar a experiência ✅

| Commit | O que fez |
|---|---|
| `dd1411c` | `BottomNav` (organism) + `constants/navigation.ts`; `AppTemplate` prop `bottomNav`; 4 abas: **Início / Diário / TPO / Aprender**. Timeline vira `/app/diario`. Aba `/app/tpo`: orientação + "Iniciar um TPO" (`start_tpo`) quando não há TPO; etapa + histórico quando há. `/app/aprender` placeholder. Rotas antigas viram redirects. |
| `35c03e3` | Home das **6 ações** (`HOME_ACTIONS`) + "Tudo tranquilo por aqui?" + card "TPO em andamento". Rotas `/app/alimentacao`, `/app/tudo-tranquilo`; stubs `/app/produto`, `/app/ambiente`, `/app/saude`. |
| `abf4371` | `ExposureForm` → "Quem consumiu? Mãe/Criança" + "+ Adicionar detalhes" (marca, ingredientes, quantidade, data/hora, obs). Timeline mostra consumidor + marca. |
| `16c99d0` | `SymptomForm` progressivo: "O que você percebeu?" → 6 categorias → sintoma+intensidade. `constants/symptoms.ts`: 4 grupos → **6** (`fezes`, `barriguinha`, `pele`, `respiracao`, `comportamento`, `outro`) — **codes inalterados**. "Outro" com campo livre → observação. |
| `4fa7a71` | Diário: filtros (`Tudo / Alimentação / Sintomas / Fraldas / Outros`) + "+ Novo registro" (`NewRecordSheet`, inclui Observação livre). `useDiary`/`useTimeline` expõem `refresh()`. |
| `ae47552` | Editar/excluir: `TimelineItem` expande em "Editar"/"Excluir" (menos `stage`); `DiaryEntryModal` edita por tipo; `services` ganham `update*`/`delete*`; `useEntryMutation`. Sintomas: edita hora/vínculo/obs — trocar sintomas é excluir e refazer. |

## Fase 2 — ampliar o Diário ✅

| Commit | O que fez |
|---|---|
| `1a10d04` | Onboarding sem "início do acompanhamento" (era da F0). Motivo/profissional descrevem a criança. |
| `b849a5a` | **Produto / Higiene** — `constants/products.ts` (9 categorias), `ProductForm`, `services/products.ts` (CRUD), `useCreateProductRecord`, timeline `kind: 'product'`, editar/excluir. |
| `832abbe` | **Ambiente / Visita** — `constants/environments.ts` (6 lugares), `EnvironmentForm`, `services/environments.ts`, timeline `kind: 'environment'`. |
| `3d57129` | **Saúde** — `/app/saude` hub + `/app/saude/:kind`; `HealthForm` parametrizado; `health_records` com `data` jsonb (medication: `dose`; vaccine: `reaction`; appointment: `guidance`/`questions`; weight: `kg`). `HealthData`/`readHealthData` em `constants/health.ts` (util não importa services). |
| `d1a910c` | Relatório: seletor de período (`utils/reportPeriod.ts` — Hoje/7/14/30/Todo/TPO atual), `filterSources`, contagens de produto/ambiente/saúde, resumo por etapa só com TPO. Auditoria de linguagem OK. |

## Fase 3 — Aprender ✅

| Commit | O que fez |
|---|---|
| `a684614` | `constants/learn.ts` (3 seções: Entenda a APLV, Quando procurar ajuda, Sobre o TPO — só as perguntas de cada card); flag `VITE_LEARN_CONTENT_READY` — desligada, cada card mostra a pergunta + "em revisão clínica"; "Quando procurar ajuda" com os 3 níveis visuais; o app não pede autoclassificação IgE/não-IgE; `LearnCard`, `Learn` (hub), `LearnTopic` (`/app/aprender/:topic`); `vite-env.d.ts` + `.env.example` |

**Bloqueado por fora do código:** os textos (`body` de cada `LearnCard` e os sinais de cada
nível de urgência) precisam de validação clínica formal. Quando existirem: preencher os `body`
em `constants/learn.ts` e cadastrar `VITE_LEARN_CONTENT_READY=true`.

## Fase 4 — refino do TPO ✅

| Commit | O que fez |
|---|---|
| `d472a95` | `useTpoStages` lê a tabela `tpo_stages` (fallback nos constants + cache de sessão); aba TPO mostra explicação da etapa, "Por que esta etapa?" (`why_this_stage`), contagens da etapa e atalhos rápidos; sequência de referência de `tpo_stages`; `Stages`/`StageActions`/`StageHistoryList`/card da Home/relatório passam a usar rótulos e contagem de `tpo_stages` (`buildReport(..., tpoStages)`) |

> (a aresta do rótulo de etapa na timeline foi fechada em `b816782`.)

## O que falta — nenhuma fase, só o que segue

### 1. QA em navegador (precisa de `npm run dev` + duas contas)

**Roteiro do fluxo principal** (uma conta):
- [ ] Cadastrar → onboarding (só a criança: nome, nascimento, alimentação, motivo, profissional)
- [ ] Home das 6 ações → registrar **alimentação** (Mãe e Criança, testar "+ detalhes")
- [ ] **Sintoma** progressivo: categoria → sintoma → intensidade; testar "Outro"; sinal de alarme
- [ ] **Fralda**, **Produto/Higiene**, **Ambiente/Visita**, **Saúde** (os 4 tipos), **Tudo tranquilo**, **Observação** (via Diário → Novo registro)
- [ ] **Diário**: filtros; "Ver opções" num registro → **editar** hora/texto → salvar → **excluir** com confirmação
- [ ] **TPO**: "Iniciar um TPO" → card "TPO em andamento" na Home → aba TPO com etapa/explicação/contagens → **Mudar etapa** (avançar/repetir/retornar) → histórico imutável
- [ ] **Aprender**: 3 seções; cards mostram "em revisão clínica"; "Quando procurar ajuda" com os 3 níveis
- [ ] **Relatório**: trocar de período; imprimir (`window.print`) sem nav/botões
- [ ] Fechar e reabrir o app / logout-login → tudo continua salvo

**RLS (2 contas A e B) — ✅ verificado por script em 2026-09-16.** Rodei um script Node
descartável (`@supabase/supabase-js` + a publishable key, sem service_role) que cria as
contas A e B, faz onboarding das duas, e tenta as invasões clássicas: **13/13 testes
passaram** —
- B só enxerga a própria criança em `children`
- B não lê/altera/exclui a alimentação de A
- B não insere em `children` usando `user_id` de A
- B não insere alimentação no `child_id` de A nem vincula ao `protocol_id` de A
- B não cria protocolo apontando para o `child_id` de A
- B não cria evento de sintoma no `child_id` de A (RPC `create_symptom_event`)
- B não insere item em `symptom_event_items` de A
- B não muda a etapa do TPO de A (RPC `change_stage`)
- Signup cria `profiles` automaticamente

Ficaram 3 contas de teste no projeto (`qa-probe-*@example.com`, `qa-rls-a-*@example.com`,
`qa-rls-b-*@example.com`) — **apagar em Supabase → Authentication → Users** quando quiser
(cascateia crianças/protocolos/eventos). O script não ficou no repo (rodado e apagado; o
`.gitignore` já cobre `*.local.mjs` caso alguém repita o teste).

Não testado por script (precisa da UI): breakpoints, PWA, impressão, teclado/foco — ver abaixo.

**Responsividade / a11y / PWA:**
- [ ] 375 / 390 / 430 / 768 / 1024 / 1440 sem scroll horizontal
- [ ] Navegação por teclado com foco visível; `prefers-reduced-motion`
- [ ] PWA instala e abre em standalone; offline avisa em vez de quebrar

### 2. Conteúdo clínico do Aprender
- Preencher os `body` de cada `LearnCard` em `src/constants/learn.ts` e os sinais de cada
  `URGENCY_LEVEL`, depois `VITE_LEARN_CONTENT_READY=true` no `.env.local` e no Netlify.

### 3. Merge na `main` — ✅ feito em 2026-09-16

Merge commit `ce7924c` (`feat/nova-arquitetura-funcional` → `main`), `typecheck`/`lint`/`build`
verificados na `main` pós-merge, push para `origin/main` feito. O Netlify tem deploy contínuo
na `main`, então https://diario-aplv.netlify.app já está publicando a nova arquitetura.
O branch de trabalho **não existe mais em `origin`** (só `main`); o histórico dele está
preservado dentro do merge.

**Só QA visual e o conteúdo do Aprender continuam pendentes** — ver acima.

## Como retomar

```bash
cd <raiz do repositório>
git checkout main
npm install   # se necessário
npm run dev
```

Tudo o que as fases F0–F4 entregaram já está na `main` — não há branch de trabalho a
recuperar.

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
│   └── Diario/    # o "Diário" (título + filtros + modal); era pages/Timeline/
├── utils/reportPeriod.ts
└── supabase/migrations/20260829120000..20260829120800_*.sql
```

## Limpeza pós-fases (`b816782`, `8198d4f`)

- `pages/Timeline/` → `pages/Diario/` (componente `Diario`); `git mv` preservou o histórico.
- `buildTimeline` recebe a função de rótulo de etapa; `useTimeline` e o relatório passam a
  de `tpo_stages`. Renomear uma etapa no banco agora reflete na timeline.
- `docs/01`, `02`, `03`, `05`, `06` e `07` ganharam avisos de "nova arquitetura" no topo;
  `00` e `04` ficaram de fora na época e foram fechados na auditoria de 2026-09-19.
  `08` + `09` são a autoridade.

## Auditoria de 2026-09-19 (conferência do plano `08` contra o código)

Confrontei cada entregável do plano com o repositório. **Nenhuma lacuna funcional** —
tudo o que as fases F0–F4 prometem existe e compila. Verificado item a item:

- 17 migrations no disco, incluindo as 9 da F0; `src/types/database.ts` regenerado com as
  **13** tabelas e as RPCs `create_onboarding`, `start_tpo`, `create_symptom_event`,
  `change_stage`.
- RLS ligada nas 13 tabelas — atenção: `exposures`, `diaper_records`, `notes` e
  `stage_history` recebem o `enable row level security` dentro de um bloco `do $$`
  dinâmico em `20260820120200_rls.sql`, então um `grep` ingênuo por
  `alter table … enable row level security` **não** as encontra. Não é brecha.
- `HOME_ACTIONS` = 6, `NAV_TABS` = 4, `SYMPTOM_GROUPS` = 6 (codes preservados),
  `PRODUCT_CATEGORIES` = 9, `ENVIRONMENT_PLACES` = 6, `HEALTH_KINDS` = 4,
  `REPORT_PERIODS` = 6, filtros do Diário = 5.
- `update*` + `delete*` presentes nos 7 services de evento; `TimelineItem` bloqueia
  ação em `kind === 'stage'` (histórico do TPO imutável, conforme §4.3).
- Os 10 formulários passam `busy={state === 'saving'}` e o `Button` faz
  `disabled={disabled ?? busy}` — o gate "Salvar desabilitado durante saving" (§4.5) vale
  em todos.
- Auditoria de linguagem (§4.4): o grep sai **vazio** em `src/`.
- `typecheck`, `lint` e `build` limpos; zero `any` explícito.
- Sem `TODO`/`FIXME`/stub pendente em `src/`.

**Divergências que a auditoria corrigiu** (eram só de documentação):

1. Os hashes de commit citados neste arquivo não existiam no repositório — foram
   substituídos pelos reais (`1e452ef`, `065a008`, `dd1411c`, …, merge `ce7924c`).
2. O grep de linguagem do §4.4 não estava no `06-checklist-qualidade.md`; entrou como
   gate permanente.
3. `00-especificacao.md` e `04-design-system.md` não tinham o aviso de nova arquitetura.
4. O plano `08` contava 12 tabelas na bateria de RLS; são 13.
5. `constants/navigation.ts` documentava `/app/diario/novo`, rota que não existe.

**Pendência de conteúdo, não de código:** `p_started_at` continua na assinatura de
`create_onboarding` marcado como "aceito por compatibilidade; ignorado", mas o cliente
já não o envia (`services/protocols.ts`). Some numa próxima migration, sem pressa.

## Arestas conhecidas

- `services/health.ts` reexporta `HealthData` de `constants/health.ts` (para não vazar `supabase` no util).
- Edição de `symptom_events` não troca os sintomas marcados (por design — excluir e refazer).
- Aprender: nenhum `body` de card preenchido ainda — depende da validação clínica.
- Warnings de CRLF do git ao commitar são esperados (autocrlf); não afetam nada.
- `/app/diario/novo` e `/app/tpo/historico` da árvore de rotas do plano (§4.2) **não**
  viraram rotas: "+ Novo registro" é uma folha sobre o Diário e o histórico de etapas é
  seção de `/app/tpo` e `/app/tpo/etapas`. Intencional — o plano já foi anotado.
- O template das telas de registro ainda se chama `ProtocolTemplate` e a página de
  Alimentação ainda mora em `pages/Exposure/`. Só nomenclatura interna: a usuária lê
  "Alimentação" em toda parte. Renomear é cosmético e pode esperar.

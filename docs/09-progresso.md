# 09 — Progresso da nova arquitetura (handoff)

> Estado da implementação do [`08-plano-implementacao.md`](08-plano-implementacao.md).
> Atualizado em **2026-09-19**. Retome por aqui.

## Onde está

- **Mergeado na `main` em 2026-09-16** (commit `ce7924c`). O código está na `main`.
- **Publicado em 2026-09-19** por deploy manual via CLI — https://diario-aplv.netlify.app
  passou a rodar a nova arquitetura. ⚠️ O **deploy contínuo continua quebrado**: o próximo
  commit na `main` não vai ao ar sozinho. Ver §4.
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

### 0. Aplicar as duas migrations de 2026-09-19 ⚠️

As correções da segunda auditoria (ver seção adiante) estão **escritas e testadas, mas não
aplicadas em produção**: `supabase db push` é bloqueado pelo classificador de segurança do
Claude Code. Rode você mesmo, na raiz do repositório:

```bash
npx supabase db push --linked
npx supabase gen types typescript --linked > src/types/database.ts
```

As duas migrations foram validadas num Postgres descartável com as 19 aplicadas em ordem:
aplicam limpo, `change_stage` continua avançando/repetindo/retornando, e os dois defeitos
deixam de reproduzir. `gen types` não deve mudar nada — as migrations mexem em policies,
trigger e check constraints, não em colunas —, mas roda barato e confirma.

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
verificados na `main` pós-merge, push para `origin/main` feito. O branch de trabalho
**não existe mais em `origin`** (só `main`); o histórico dele está preservado dentro do merge.

### 4. Deploy — publicado à mão em 2026-09-19; o contínuo segue quebrado

**Situação atual:** a produção roda F0–F4 desde 2026-09-19, publicada por
`netlify deploy --prod --dir=dist` (deploy `6aae087c64d396df43278553`). Confirmado no ar:
meta description e manifest com "alimentação", bundle `index-Bp8JG43q.js` com todos os
marcadores da nova arquitetura, redirect de SPA respondendo 200 em `/app/aprender` e
`/app/saude/weight`, manifest servido como `application/manifest+json`, headers de
segurança e `sw.js` sem cache — ou seja, o `netlify.toml` foi aplicado.

⚠️ **O que continua quebrado:** o gatilho do Git. `build_settings.repo_url` do site ainda
aponta para `https://github.com/Joaomarcellodev/Diario_APLV`, a localização **antiga**.
Enquanto não for religado, **todo commit na `main` precisa ser publicado à mão**.

#### Como o problema foi diagnosticado (para referência)

Antes deste deploy, o último publicado era de **2026-08-20** — anterior à Fase 0, que começou
em 29/08. Três evidências independentes mostravam a build velha no ar:

| Artefato | Em produção | Na `main` |
|---|---|---|
| `<meta name="description">` | "Registre **exposições**, sintomas e fraldas" | "Registre **alimentação**, sintomas e fraldas" |
| `manifest.webmanifest` | idem, "exposições" | "alimentação" |
| bundle JS (`index-D0h_s7Mn.js`) | contém "Sem sintomas", "Exposição", "Timeline" | — |

O bundle servido não continha **nenhum** marcador da nova arquitetura — "Aprender",
"Tudo tranquilo por aqui", "Produto / Higiene", "Ambiente / Visita", "Quem consumiu" e
"Por que esta etapa?" estavam todos ausentes. A correção do `f6722ae` também não tinha
chegado lá. Ou seja: entre o merge (16/09) e 19/09, **as Fases F0–F4 nunca estiveram no ar.**

Descartado pelo caminho: **não era cache de borda** (a resposta vinha com `age: 0` e
`cache-status: fwd=miss`, busca fresca na origem) e **não era falha de build** — o
`netlify.toml` estava correto e nenhum build chegava a ser disparado.

**Causa, confirmada:** o repositório foi transferido de `Joaomarcellodev/Diario_APLV` para
**`Axion-Software-House/Diario_APLV`** (o `git push` avisava "This repository moved"), mas o
site do Netlify continuou apontando para o endereço antigo. Verificado direto na API:

```bash
npx netlify-cli api getSite --data '{"site_id":"60571ae0-0ed0-4e42-ace0-d52843d4cd0e"}'
# repo_url: https://github.com/Joaomarcellodev/Diario_APLV   ← antigo
# branch: main | dir: dist | último deploy publicado: 2026-08-20
```

O remote local já foi corrigido (`git remote set-url`); **falta corrigir o do site**.

**Para restaurar o deploy contínuo** (precisa do painel do Netlify):
1. Site configuration → **Build & deploy → Continuous deployment** → religar o repositório
   em `Axion-Software-House/Diario_APLV`, branch `main`.
2. Se o repositório **não aparecer na lista**, o GitHub App do Netlify não está instalado na
   organização: um *owner* precisa autorizá-lo em
   `github.com/organizations/Axion-Software-House/settings/installations`, com acesso ao
   `Diario_APLV`. Repositório transferido não leva a autorização junto.
3. Conferir `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` em Environment variables —
   o Vite as embute em tempo de build; sem elas o build **passa** e o app só quebra na hora
   de logar, sem erro no log.
4. **Trigger deploy → Clear cache and deploy site** e conferir se a meta description
   continua dizendo "alimentação".

**Enquanto isso, publicar à mão** (o que foi feito em 19/09):

```bash
npm run build
npx netlify-cli deploy --prod --dir=dist --site 60571ae0-0ed0-4e42-ace0-d52843d4cd0e
```

**Continuam pendentes:** religar o deploy contínuo, o QA visual e o conteúdo do Aprender.

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

## Segunda auditoria de 2026-09-19 — verificação independente e correções

A primeira auditoria conferiu o plano `08` contra o código. Esta rodou o sistema: teste
funcional ponta a ponta contra o Supabase (replicando as chamadas dos services), conferência
do schema remoto e das RPCs, comparação do bundle em produção com o build da `main`, e
reprodução dos defeitos num Postgres descartável com as 19 migrations aplicadas.

**Confirmado funcionando:** cadastro e trigger de `profiles`; onboarding criando só a
criança; os 7 tipos de registro sem TPO ativo; alimentação com consumidor/marca/detalhes;
sintomas com intensidade 1–3, vínculo opcional e duplicata rejeitada; `start_tpo`; registro
durante o TPO carregando `protocol_id` e etapa; avançar/repetir/retornar; segundo TPO ativo
recusado; editar/excluir com cascata; Diário lendo as 8 origens; persistência após
logout/login; as 5 etapas de `tpo_stages` seedadas com explicação e "por que esta etapa";
isolamento entre contas (B não lê, não grava, não muda etapa e não apaga nada de A).
O bundle em produção é **byte-idêntico** (MD5) ao build da `main`.

**Dois defeitos encontrados e corrigidos** — ambos escapavam de uma leitura do código
porque a garantia existia na interface e faltava no banco:

| Defeito | Correção |
|---|---|
| `stage_history` aceitava `delete` e `update` do próprio dono via PostgREST. Dava para apagar um período ou reescrever a etapa de um período já fechado — a imutabilidade prometida em `03` e no `08` §4.3 valia só na UI (`TimelineItem` bloqueia `kind === 'stage'`). A tabela tinha entrado no bloco `do $$` genérico de `20260820120200_rls.sql` e herdado policies abertas; a F0 não a revisitou. | `20260919210000_stage_history_immutable.sql` — `delete using (false)`, `update` só no período aberto, trigger `stage_history_freeze` congelando as colunas estruturais. `change_stage` é SECURITY INVOKER e continua fechando o período corrente. |
| O catálogo `tpo_stages.ordinal` aceita até 20, mas as **9** colunas que guardam a etapa travavam em `check (stage between 1 and 5)` — e a F2 repetiu o limite nas três tabelas novas. Cadastrar uma 6ª etapa era aceito, `change_stage` calculava `v_max = 6` e a mudança estourava com violação de check constraint. A configurabilidade da F4 só funcionava para **renomear** etapa. | `20260919210100_stage_ceiling_follows_catalog.sql` — as 9 colunas passam a `between 1 and 20`, a mesma faixa do catálogo. O teto real continua em `change_stage`, que lê `tpo_stages`. |

Reproduzido num banco de controle com as 17 migrations originais: com 6 etapas no catálogo,
avançar da 5ª falha com `violates check constraint "stage_history_stage_check"`. Com as 19,
o mesmo cenário avança até a 7ª etapa e registra alimentação nela; passar do teto do catálogo
segue recusado com a mensagem amigável de `change_stage`.

**Mais três correções menores:**

1. `ProtocolAside` (painel lateral das telas de registro em ≥1024px) ainda usava
   `STAGES.length` e `stageLabel()` dos constants em vez de `useTpoStages` — renomear uma
   etapa no banco não chegava lá, e com 6+ etapas mostraria "etapa 7 de 5". Era o único
   furo: `Report`, `Stages`, `Tpo` e `StageHistoryList` já injetavam a escada real.
2. `BottomNav` não tinha `@media print`. O relatório não é afetado (nível 2, sem a barra),
   mas imprimir de uma aba de nível 1 levava a navegação junto.
3. `.gitignore`: este arquivo afirmava que `*.local` cobria `*.local.mjs`. Não cobre — a
   extensão vem depois do sufixo. Entrou `*.local.*`, verificado com `git check-ignore`.

**Ainda não verificado:** o QA visual em navegador (responsividade, teclado/foco, PWA,
impressão) continua pendente — a extensão de browser não conectou nesta sessão.

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

# 09 — Progresso da nova arquitetura (handoff)

> Estado da implementação do [`08-plano-implementacao.md`](08-plano-implementacao.md).
> Atualizado em **2026-09-19**. Retome por aqui.

## Onde está

- **Mergeado na `main` em 2026-09-16** (commit `ce7924c`). O código está na `main`.
- **Publicado em 2026-09-19** por deploy manual via CLI — https://diario-aplv.netlify.app
  roda a nova arquitetura **mais as correções da segunda auditoria** (commit `8cbff8b`,
  deploy `6aaf256c5b7bbc905f221b7c`). ✅ O **deploy contínuo foi religado em 2026-09-20**:
  commit na `main` volta a ir ao ar sozinho. Ver §4.
- **Fases 0, 1, 2, 3 e 4 concluídas.** O escopo do plano `08` está implementado.
  O que resta é QA em navegador e a validação clínica do conteúdo do Aprender.
- **Banco em dia:** as 19 migrations aplicadas, incluindo as duas de 2026-09-19 que fecham
  a imutabilidade do histórico do TPO e liberam a escada configurável. Ver §0.
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

### 0. Migrations de 2026-09-19 — ✅ aplicadas e publicadas

`20260919210000` e `20260919210100` foram aplicadas no projeto (`db push` rodado à mão pelo
usuário — o comando é bloqueado pelo classificador de segurança do Claude Code) e
`migration list --linked` mostra `local == remote` nas 19.

Conferido **no banco de produção**, com conta nova e a publishable key (10/10):
`change_stage` avança, repete e retorna; o histórico acumula os 4 períodos com os desfechos
gravados; `delete` no histórico não remove nada; `update` em período fechado não reescreve;
`update` estrutural no período aberto é recusado com *"O histórico de etapas não pode ser
reescrito."*; e alimentação continua editável e excluível — a correção não apertou demais.

`gen types` não mudou o schema: o diff traz só parênteses a mais nos helpers genéricos,
artefato da versão do CLI. Nenhuma tabela, coluna, enum ou RPC mudou, como previsto —
policies, trigger e check constraints não aparecem nos tipos. `src/types/database.ts` ficou
como estava, de propósito.

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

### 4. Deploy — ✅ o contínuo voltou a funcionar em 2026-09-20

**Situação atual:** a produção roda F0–F4 desde 2026-09-19, publicada por
`netlify deploy --prod --dir=dist`. O primeiro deploy do dia (`6aae087c64d396df43278553`)
subiu as fases; o segundo (`6aaf256c5b7bbc905f221b7c`, commit `8cbff8b`) subiu as correções
da segunda auditoria.

Confirmado no ar após o segundo deploy: bundle `index-DwUncOgX.js` **byte-idêntico** (MD5)
ao build local da `main`; `@media print{._bar_…{display:none}}` presente no CSS publicado
(a correção do `BottomNav` chegou); redirect de SPA respondendo 200 em `/app/aprender`,
`/app/saude/weight`, `/app/tpo/etapas`, `/app/produto` e `/app/ambiente`; manifest servido
como `application/manifest+json`; `sw.js` com `no-cache,no-store,must-revalidate`; e
`service_role` sem nenhuma ocorrência no bundle. O `netlify.toml` segue sendo aplicado.

**O gatilho do Git foi religado em 2026-09-20.** `build_settings` agora traz
`repo_url = https://github.com/Axion-Software-House/Diario_APLV` e
`installation_id = 157844636` — a mesma instalação do GitHub App que o site `larmonia` já
usava. Commit na `main` volta a ir ao ar sozinho; **acabou a publicação manual**.

Confirmado no histórico de deploys: `6aaf2ab8` (2026-09-20 00:37) é `GIT (automático)` com
`commit_ref = 01fa3e5`, o primeiro build por Git desde 2026-08-20. O bundle que ele gerou
tem o **mesmo hash** do build local, e as variáveis do Supabase foram embutidas
corretamente (a URL do projeto e a publishable key aparecem no bundle; `service_role`, não)
— era o risco real, porque sem elas o build **passa** e o app só quebra na hora de logar.

> O `commit_ref = 01fa3e5` acima é o hash **como o Netlify registrou na hora**. Os quatro
> commits do topo foram reescritos em 2026-09-20 (ver §5), então esse hash não existe mais
> no repositório — o commit correspondente hoje é `587a10c`. Deploys anteriores a essa data
> apontam para hashes órfãos; é esperado e não afeta nada, já que o que está publicado é o
> conteúdo, não a referência.

Não há webhook nem deploy key no repositório, e está certo assim: a integração é por
**GitHub App**, que recebe os eventos pela instalação e usa token próprio. Procurar webhook
por repositório para saber se está ligado leva à conclusão errada — o sinal é o
`installation_id`.

#### O que tinha quebrado, e por quê

O repositório foi transferido de `Joaomarcellodev/Diario_APLV` para
`Axion-Software-House/Diario_APLV`, e o site do Netlify continuou apontando para o endereço
antigo. Transferência não leva junto o webhook nem a autorização — o repositório some do
lugar em que o Netlify olhava. O GitHub ainda **redireciona** o endereço velho no
navegador e na API, o que faz o link antigo parecer válido; só que não há repositório ali
para instalar gatilho nenhum.

A armadilha no religamento: ao escolher GitHub, o Netlify pergunta de qual conta listar os
repositórios. Ficando no usuário pessoal, `Diario_APLV` não aparece — é preciso escolher a
**organização**.

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

O remote local foi corrigido com `git remote set-url`; o do site, no religamento de 20/09.

**Publicar à mão**, se algum dia for preciso de novo (foi o que se fez em 19/09 e 20/09,
enquanto o gatilho estava quebrado):

```bash
npm run build
npx netlify-cli deploy --prod --dir=dist --site 60571ae0-0ed0-4e42-ace0-d52843d4cd0e
```

**Como conferir o gatilho sem abrir o painel:**

```bash
# repo_url na organização + installation_id preenchido = ligado
npx netlify-cli api getSite --data '{"site_id":"60571ae0-0ed0-4e42-ace0-d52843d4cd0e"}'

# um deploy com commit_ref veio do Git; sem commit_ref, foi manual
npx netlify-cli api listSiteDeploys --data '{"site_id":"60571ae0-0ed0-4e42-ace0-d52843d4cd0e","per_page":5}'
```

**Continuam pendentes:** o QA visual e o conteúdo do Aprender.

### 5. Reescrita do topo do histórico em 2026-09-20

Os quatro commits feitos em 19–20/09 carregavam um trailer `Co-Authored-By` que o dono do
repositório não quer nos commits dele. Foram reescritos com `git filter-branch --msg-filter`
sobre o intervalo `3cd4e12..HEAD` e enviados com `--force-with-lease`. Só a mensagem mudou:
autor, data, conteúdo e ordem seguem iguais.

| Antes | Depois | Commit |
|---|---|---|
| `8325382` | `8be1411` | fix: escada do TPO configurável + histórico imutável |
| `8de1d29` | `8cbff8b` | docs: auditoria independente e as correções |
| `01fa3e5` | `587a10c` | docs: migrations aplicadas e deploy |
| `f8c6953` | `850355d` | docs: deploy contínuo religado |

Nada abaixo de `3cd4e12` foi tocado — os 27 commits da clarinhamartins mantêm os hashes
originais, e por isso todas as referências das Fases F0–F4 neste documento continuam
válidas. **A regra está em `CLAUDE.md` na raiz:** nenhum commit ou PR leva atribuição a
assistente de IA; o autor é só o dono do repositório.

Se você tinha um clone antes de 2026-09-20, o topo divergiu. Com trabalho local a
preservar, `git pull --rebase`; sem nada a preservar,
`git fetch origin && git reset --hard origin/main`.

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

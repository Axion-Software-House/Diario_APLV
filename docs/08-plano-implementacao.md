# 08 — Plano de Implementação (nova arquitetura)

> Este documento traduz o **README FINAL — Arquitetura Funcional do Diário APLV**
> (entregue pelo cliente) em um plano executável sobre a base de código atual.
> Ele **não substitui** `05-roadmap.md` para o histórico dos módulos M0–M12; a
> partir daqui, este é o documento de trabalho.
>
> Situação de partida: os 13 módulos originais estão no ar, o app está em **uso
> controlado** (não lançado), o banco de produção tem **apenas dados de teste**.

---

## 1. O que mudou na visão do produto

| Antes (M0–M12) | Agora (README FINAL) |
|---|---|
| O produto **é** o registro de um TPO. Todo evento pertence a um `protocol`. | O produto é o **acompanhamento longitudinal da criança**. O TPO é **um módulo** dentro dele, ativado só quando existe uma reintrodução orientada. |
| Onboarding cria criança **+ acompanhamento + etapa 1** numa transação. | Onboarding cria **só a criança**. O TPO é iniciado depois, na aba TPO. |
| Home = 8 atalhos numa grade. Sem navegação persistente. | Navegação inferior de 4 abas: **Início · Diário · TPO · Aprender**. Home responde só "o que você quer registrar agora?". |
| 8 atalhos: Exposição, Sintomas, Sem sintomas, Fralda, Observação, Timeline, Etapas, Relatório. | **6 ações**: Alimentação · Sintoma · Fralda · Produto/Higiene · Ambiente/Visita · Saúde. Mais "Tudo tranquilo por aqui" e o card "TPO em andamento". Timeline, Etapas e Relatório saem da Home (viram abas/telas internas). |
| "Exposição": alimento + quantidade. | "Alimentação": **quem consumiu (Mãe/Criança)** + o que foi. Detalhes (marca, ingredientes, quantidade) atrás de **"+ Adicionar detalhes"**. |
| Sintomas: lista de 21 em 4 grupos, tudo numa tela. | Sintomas **progressivos**: "O que você percebeu?" (6 categorias) → sintomas da categoria → intensidade. |
| Observação livre é 1 dos 8 atalhos. | Observação livre sai da Home; entra por **Diário → + Novo registro**. |
| Diário só **cria** registros. | Diário permite **ver detalhes, editar e excluir** (com confirmação). |
| Relatório atrelado ao protocolo. | Relatório **nasce do Diário**, disponível **desde o 1º registro**, com seletor de período (Hoje / 7 / 14 / 30 / Todo / TPO atual). |
| Escada do leite fixa em `constants/stages.ts`. | Sequência do TPO **configurável sem reconstruir o app** (conteúdo/ordem ajustáveis). |
| — | Módulo **Aprender**: cards sobre APLV, IgE × não-IgE, reações, "quando procurar ajuda" (3 níveis), TPO. Conteúdo exige **validação clínica formal** antes de produção. |
| — | Novos registros: **Produto/Higiene**, **Ambiente/Visita**, **Saúde** (Medicamento, Vacina, Consulta, Peso). |

**O que NÃO muda** (e é preservado sem reconstrução): Supabase, Auth, RLS,
persistência, feedback de salvamento, horário automático, timeline unida no
frontend, histórico de etapas imutável, PWA, tokens de design, a regra de
"sem lógica diagnóstica".

### Ordem de prioridade atualizada (README FINAL §37)

```
ACOLHIMENTO → SIMPLICIDADE → REGISTRO RÁPIDO → SEGURANÇA E PERSISTÊNCIA
→ ORGANIZAÇÃO → RELATÓRIO → EDUCAÇÃO → ESTÉTICA
```

A antiga (`SEGURANÇA → PERSISTÊNCIA → ...`) continua valendo como regra de
**engenharia** — nunca desligar RLS, nunca limpar o formulário antes da
confirmação do banco. A nova é a régua de **produto**: em conflito de UX, a
tela mais leve e com menos decisões ganha.

---

## 2. Recomendação de escopo

**Recomendado: entregar a "MVP da nova arquitetura" — Fase 0 + Fase 1 + Fase 2 — e
tratar Fase 3 (Aprender) e Fase 4 (refino do TPO) como uma segunda leva.**

Por quê, no contexto deste projeto:

1. **A base de dados precisa ser desacoplada do TPO uma única vez.** Hoje toda
   tabela de evento tem `protocol_id NOT NULL`. Se fizermos só a Fase 1 (mexer
   na Home e na navegação) sem tocar no modelo, construímos a nova experiência
   em cima da fundação errada e refazemos tudo na Fase 2. A Fase 0 abaixo faz
   esse desacoplamento primeiro — barato agora, porque só há dados de teste.
2. **Fases 1 e 2 formam um produto coerente** para o cliente validar: a família
   registra a rotina inteira (comida, sintoma, fralda, produto, ambiente, saúde),
   vê tudo no Diário, corrige erros, e gera relatório — com ou sem TPO ativo.
3. **Aprender está bloqueado por fora do código**: os textos precisam de
   validação clínica. Construímos a estrutura (aba, cards, os 3 níveis de
   urgência) com conteúdo *placeholder* atrás de uma flag, e o cliente pluga os
   textos revisados depois. Não faz sentido segurar a entrega por isso.
4. **O refino do TPO (Fase 4)** — explicação por etapa, "Por que esta etapa?",
   estrutura editável — é incremento sobre um TPO que já funciona. A parte
   estrutural (tornar a sequência configurável) é pequena e entra já na Fase 0;
   o polimento de conteúdo acompanha o Aprender.

As três opções, para decisão consciente:

| Opção | Entrega | Risco | Quando escolher |
|---|---|---|---|
| **Só Fase 1** | Nova Home + navegação + sintomas progressivos + editar/excluir | Baixo | Se quiser validar a direção visual com o cliente antes de investir no resto |
| **Fase 0+1+2 (recomendado)** | Acima + modelo desacoplado + Produto/Ambiente/Saúde + relatório ampliado | Médio | Padrão: entrega um produto completo e evita retrabalho de migration |
| **Tudo (4 fases)** | Acima + Aprender + TPO configurável com conteúdo | Médio-alto | Só se os textos clínicos já estiverem validados e disponíveis |

O resto deste documento detalha **Fase 0 → Fase 4**, na ordem. Se a decisão for
"só Fase 1", pare depois dela; a Fase 0 ainda é pré-requisito.

---

## 3. Decisão de modelagem de dados

> Decisão tomada aqui (o cliente delegou). Justificativa junto.

### 3.1 Modelo de contêineres

```
children                          ← o sujeito longitudinal. Sempre existe.
  ├── diary events                 ← child_id NOT NULL
  │     (exposures, symptom_events,   protocol_id / stage NULLABLE
  │      diaper_records, notes,       (preenchidos só quando o evento
  │      product_records,              acontece durante um TPO ativo)
  │      environment_records,
  │      health_records)
  └── protocols (0..N, no máx. 1 'active')   ← o "TPO": uma reintrodução guiada
        └── stage_history (1..N, imutável)    ← ordinais numa sequência configurável
```

**Três níveis, não dois.** A alternativa — um contêiner intermediário
"acompanhamento" entre `children` e `protocols` — foi descartada: nada no README
FINAL precisa dele. O acompanhamento longitudinal **é** a criança; o TPO **é** o
`protocol`. Um nível a menos é uma rota, um contexto e uma guarda a menos.

**Por que manter os nomes de tabela `exposures` e `protocols`.** O README FINAL
diz, em §34, "adaptação e expansão, não reconstrução". Renomear `exposures` →
`food_entries` e `protocols` → `tpo` tocaria RLS, FKs, três RPCs, os tipos
gerados e ~20 arquivos de frontend, sem ganho funcional. A tradução de
vocabulário acontece na **camada de domínio e de UI**: a tabela é `exposures`,
o tipo é `FoodEntry`, a tela se chama "Alimentação". Onde o termo "exposição"
aparecer para a usuária hoje, ele sai.

### 3.2 Migrations da Fase 0

Numeração seguindo o padrão `supabase/migrations/AAAAMMDDHHMMSS_nome.sql`.
Todas com dados de teste apenas → backfill simples, sem downtime.

| Migration | Conteúdo |
|---|---|
| `..._decouple_events_from_protocol.sql` | Em `exposures`, `symptom_events`, `diaper_records`, `notes`: adiciona `child_id uuid references children(id) on delete cascade`; backfill `child_id` a partir de `protocols.child_id`; `set not null` em `child_id`; `drop not null` em `protocol_id` e `stage`; novo índice `(child_id, occurred_at desc)`. |
| `..._rls_child_scope.sql` | Novo uso de `owns_child(child_id)` nas policies de `insert`/`update` das 4 tabelas + das 3 novas. Policy de `protocol_id` vira `(protocol_id is null or public.owns_protocol(protocol_id))`. `select`/`delete` seguem `user_id = auth.uid()`. |
| `..._food_entry_fields.sql` | Em `exposures`: enum `food_consumer` (`mother` \| `child`), coluna `consumer food_consumer not null default 'child'`; `brand text`; `details text`. `amount` continua, vira detalhe secundário. |
| `..._product_records.sql` | Tabela `product_records` (ver §3.3) + RLS + índice. |
| `..._environment_records.sql` | Tabela `environment_records` + RLS + índice. |
| `..._health_records.sql` | Tabela `health_records` (ver §3.3) + RLS + índice. |
| `..._tpo_stages.sql` | Tabela de referência `tpo_stages(ordinal, label, short_explanation, why_this_stage)`; seed com as 5 etapas da escada do leite. `change_stage` RPC: troca o limite fixo `> 5` por `(select max(ordinal) from tpo_stages)`. |
| `..._onboarding_child_only.sql` | `create_onboarding` passa a criar **só a criança** (nome, nascimento, feeding, reason, professional em `children`). Nova RPC `start_tpo(p_child_id, p_started_at, p_note)` cria `protocol` (`status='active'`, `current_stage=1`) + primeira linha de `stage_history`. |
| `..._child_journey_fields.sql` | Move `reason` e `professional` de `protocols` para `children` (nullable). `protocols.reason/professional` continuam existindo para descrever aquele TPO específico, mas o "motivo do acompanhamento" da criança vive em `children`. |

> Regra mantida de `03-modelo-de-dados.md`: **migration aplicada nunca é editada**.
> O reteste de RLS do M1 (`03-modelo-de-dados.md` §"Teste de RLS") é refeito por
> completo ao fim da Fase 0, incluindo as 3 tabelas novas.

### 3.3 Tabelas novas (formato resumido)

```sql
-- Produto / Higiene / Cosméticos  (README FINAL §10)
create table public.product_records (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  child_id     uuid not null references public.children(id) on delete cascade,
  protocol_id  uuid references public.protocols(id) on delete set null,
  stage        smallint,
  occurred_at  timestamptz not null,
  category     text not null,          -- catálogo em constants/products.ts
  is_new       boolean,                -- "é um produto novo?"
  name         text,
  brand        text,
  note         text,
  created_at   timestamptz not null default now()
);

-- Ambiente / Visita  (README FINAL §11)
create table public.environment_records (
  id, user_id, child_id not null, protocol_id, stage, occurred_at not null,
  place        text not null,          -- catálogo em constants/environments.ts
  different    text,                   -- "teve algo diferente do habitual?"
  note         text,
  created_at
);

-- Saúde: medicamento | vacina | consulta | peso  (README FINAL §12–16)
create table public.health_records (
  id, user_id, child_id not null, protocol_id, stage, occurred_at not null,
  kind         text not null,          -- 'medication'|'vaccine'|'appointment'|'weight'
  title        text,                   -- nome do medicamento/vacina, especialidade
  data         jsonb not null default '{}',  -- dose, reação, orientações, dúvidas, peso
  note         text,
  created_at
);
```

**Por que `health_records` é uma tabela só com `jsonb data`, e não quatro
tabelas.** Os quatro tipos têm campos diferentes (peso: número + data; consulta:
especialidade, orientações, dúvidas; medicamento: nome, dose; vacina: nome,
reação). O app **só registra e relê** esses dados — nunca calcula em cima deles
(não há cálculo de dose, não há curva de crescimento no MVP; §16 diz que curva
"não é prioridade do fluxo inicial"). Uma tabela evita 4 migrations, 4 services e
4 policies. O trade-off — perder validação por coluna — é aceitável para registro
descritivo. Se a curva de crescimento entrar no futuro, `weight` ganha tabela
própria então.

### 3.4 Impacto no frontend da Fase 0

Núcleo do retrabalho — feito uma vez:

| Arquivo | Mudança |
|---|---|
| `contexts/ProtocolContext.tsx` | Vira `ChildContext`: resolve a **criança ativa** (sempre existe pós-onboarding) e, separadamente, o **TPO ativo** (`protocol` \| `null`). |
| `routes/RequireProtocol.tsx` | Vira `RequireChild` — libera `/app/*` com criança, sem exigir protocolo. |
| `routes/index.tsx` | Nova árvore de rotas (§4.2). |
| `hooks/useRecordWrite.ts` | `RecordContext` passa a expor `childId` (obrigatório) e `protocolId`/`stage` (`null` quando não há TPO ativo). |
| `hooks/useDiary.ts` + `services/diary.ts` | `loadDiary(childId)` em vez de `loadDiary(protocolId)`; busca por `child_id`; inclui as 3 novas origens. |
| `utils/timeline.ts` | `TimelineSources` e `buildTimeline` ganham `productRecords`, `environmentRecords`, `healthRecords`; `stage` do evento passa a ser `number \| null`. |
| `utils/report.ts` | `buildReport` recebe `child` + `protocol \| null` + intervalo de datas; agrupa por etapa só quando há TPO. |
| `services/*.ts`, `hooks/useCreate*.ts` | Assinaturas recebem `childId`; `protocolId`/`stage` opcionais. |
| `services/protocols.ts` | `getActiveProtocol` → `getActiveChild` + `getActiveTpo`; novo `startTpo`. |
| tipos gerados | `npx supabase gen types typescript --linked > src/types/database.ts` depois de cada `db push`. |

---

## 4. Fases de implementação

Cada fase termina com `npm run typecheck && npm run lint && npm run build`
limpos e o critério de aceite marcado. Um commit por entregável, prefixo da
fase (`F1: nova navegação inferior`).

### Fase 0 — Fundação: desacoplar o Diário do TPO

**Objetivo:** o modelo de dados e o roteamento passam a tratar a criança como o
sujeito e o TPO como opcional. Nenhuma tela nova ainda — o app continua com a
aparência atual, mas roda sem protocolo ativo.

**Backend**
- Migrations de §3.2 aplicadas em ordem, tipos regenerados.
- RPCs reescritas: `create_onboarding` (só criança), `start_tpo` (nova),
  `create_symptom_event` (aceita `p_child_id`, `p_protocol_id` opcional; lê
  `stage` do protocolo só se houver), `change_stage` (limite dinâmico).
- Reteste completo de RLS (bateria do M1 + 3 tabelas novas).

**Frontend**
- `ChildContext`, `RequireChild`, `useRecordWrite`, `useDiary`, `services/*`
  ajustados (§3.4).
- Onboarding: remove a etapa de "início / motivo do acompanhamento" como criação
  de protocolo; `reason`/`professional` viram campos da criança.
- Telas existentes continuam funcionando: se há TPO ativo, registram `stage`; se
  não, registram sem.

**Aceite**
- [ ] Criar conta → onboarding → cai na Home **sem** nenhum TPO ativo.
- [ ] Registrar exposição, sintoma, fralda e nota sem TPO → aparecem na timeline.
- [ ] Bateria de RLS 100% verde nas **13** tabelas (`select tablename, rowsecurity from pg_tables where schemaname='public'`)
      — as 9 originais + `product_records`, `environment_records`, `health_records` e
      `tpo_stages` (catálogo: só `select` para autenticado).
- [ ] Usuário B não lê nem escreve nada de A, nem dentro do `child_id` de A.
- [ ] `npm run build` limpo, zero `any`.

### Fase 1 — Reorganizar a experiência (README FINAL Fase 1)

**Objetivo:** a nova casca do app — navegação, Home, sintomas progressivos,
editar/excluir.

**1.1 Navegação inferior**
- Novo `components/organisms/BottomNav/` — 4 abas: Início (`/app`), Diário
  (`/app/diario`), TPO (`/app/tpo`), Aprender (`/app/aprender`). Alvo ≥
  `--touch-min`, rótulo + ícone, item ativo com destaque não-só-cor.
- `AppTemplate` ganha `bottomNav?: boolean`; telas de registro (nível 2) abrem
  sem nav, com "Voltar" — já é o comportamento do `backTo`.
- `constants/shortcuts.ts` → dividido em `HOME_ACTIONS` (as 6) e navegação.

**1.2 Home / Início** (README FINAL §4)
- Pergunta única no topo: "O que você quer registrar agora?".
- 6 `ActionTile`: Alimentação, Sintoma, Fralda, Produto / Higiene, Ambiente /
  Visita, Saúde.
- Abaixo: botão "Tudo tranquilo por aqui?" (o atual `NoSymptoms`, renomeado).
- Abaixo: card **"TPO em andamento"** — só renderiza se `activeTpo != null`;
  mostra etapa atual, dia, botão "Continuar" → `/app/tpo`.
- Sai da Home: Timeline (vira aba Diário), Etapas e Relatório (viram telas
  dentro de Diário/TPO).

**1.3 Alimentação** (README FINAL §5) — evolui `ExposureForm` → `FoodForm`
- Passo 1: "Quem consumiu?" → `Mãe` \| `Criança` (chips).
- Passo 2: "O que foi?" → campo curto (`food`). **Salvar já habilitado aqui.**
- "+ Adicionar detalhes" (colapsado): marca, ingredientes/observação, quantidade
  (`amount`), editar data/hora.
- Horário automático, editável.

**1.4 Sintomas progressivos** (README FINAL §6–7) — reescreve `SymptomForm`
- `constants/symptoms.ts`: os grupos passam de 4 para **6** — Fezes, Barriguinha,
  Pele, Respiração, Comportamento/estado geral, Outro. **Os `code` não mudam**
  (registros antigos os referenciam); só a atribuição de `group`.
- Passo 1: "O que você percebeu?" → 6 chips.
- Passo 2: sintomas daquela categoria; toque na **intensidade** (Leve/Moderado/
  Intenso) seleciona. "Outro" abre campo curto.
- Depois: data/hora automática, observação opcional, **relação opcional com uma
  alimentação anterior** (lista "Hoje 08:30 — Bolo simples / Ontem 19:10 — … /
  Não relacionar"). Cálculo de intervalo mantido; **nunca** "causado por".
- Sinais de alarme mantêm o `SafetyAlert` (orientação, não diagnóstico).
- Emojis de intensidade: **não usar** (README FINAL §7: "se poluírem, não usar").
- Mensagem fixa mantida.

**1.5 Diário** (README FINAL §18) — evolui `Timeline` → `Diario`
- Timeline unida (já existe), agora incluindo todas as origens.
- Filtros simples: `Tudo · Alimentação · Sintomas · Fraldas · Outros`.
- "+ Novo registro" → folha com as 6 ações + Observação livre.
- Cada item: expandir → ver detalhes → **Editar** / **Excluir**. Excluir passa
  por `Modal` de confirmação. (§4.3 detalha o transversal.)

**1.6 Observação livre** (README FINAL §17)
- Sai da Home. Acesso por Diário → + Novo registro → Observação. `NoteForm` e
  a rota permanecem; só muda o ponto de entrada.

**Aceite Fase 1**
- [ ] Navegação inferior visível em Início / Diário / TPO / Aprender; some nas
      telas de registro.
- [ ] Home mostra 6 ações + "Tudo tranquilo" + (condicional) card do TPO. Nada
      de dashboard técnico.
- [ ] Alimentação: "Mãe/Criança" → "o que foi" → Salvar, sem abrir detalhes,
      em menos de 30 s.
- [ ] Sintoma: "percebi" → categoria → sintoma+intensidade → Salvar, sem
      formulário longo.
- [ ] Diário lista tudo em ordem, filtra, e permite editar e excluir com
      confirmação.
- [ ] Registro editado/excluído reflete na timeline e no relatório.
- [ ] 375 px sem scroll horizontal; alvos ≥ 48 px.

### Fase 2 — Ampliar o Diário (README FINAL Fase 2)

**2.1 Produto / Higiene / Cosméticos** (§10)
- `constants/products.ts` — catálogo: Sabonete, Hidratante, Lenço umedecido,
  Fralda, Pomada, Shampoo, Protetor solar, Perfume/Colônia, Outro.
- `ProductForm`: "O que foi usado?" → "É um produto novo?" (Sim/Não) → Salvar.
  Detalhes opcionais: nome, marca, data/hora, observação.
- `service` + `useCreateProductRecord` + rota `/app/produto`.

**2.2 Ambiente / Visita** (§11)
- `constants/environments.ts` — Casa de familiares/amigos, Escola/Creche,
  Restaurante, Festa/Evento, Viagem/Passeio, Outro.
- `EnvironmentForm`: "Onde vocês estiveram?" → "Teve algo diferente do habitual?"
  (campo opcional) → Salvar. Data/hora automática.
- `service` + hook + rota `/app/ambiente`.

**2.3 Saúde** (§12–16)
- Tela `Saude` com 4 sub-ações: Medicamento, Vacina, Consulta, Peso.
- Um `HealthForm` parametrizado por `kind`, gravando em `health_records`:
  - **Medicamento**: nome + horário; detalhes: dose, observação. *Não sugerir
    medicamento nem dose.*
  - **Vacina**: nome + data/hora; opcional: reação percebida, observação.
  - **Consulta**: especialidade, data, principais orientações, dúvidas,
    observação. *Não é prontuário.*
  - **Peso**: peso + data.
- `service` + `useCreateHealthRecord` + rotas `/app/saude`, `/app/saude/:kind`.

**2.4 Relatório ampliado** (§19)
- Seletor de período: `Hoje · 7 dias · 14 dias · 30 dias · Todo o acompanhamento
  · TPO atual`. Disponível **desde o 1º registro** (nada de exigir 30 dias).
- `buildReport` consolida as 11 origens + observações.
- Resumo por etapa **só aparece quando há TPO** (ou no modo "TPO atual").
- **Auditoria de linguagem** (§4.4) — obrigatória antes de fechar a fase.

**Aceite Fase 2**
- [ ] Produto, Ambiente e as 4 telas de Saúde salvam e aparecem no Diário.
- [ ] Cada um começa a 1 toque da Home (Saúde a 2: Home → Saúde → tipo).
- [ ] Relatório abre com qualquer período, inclusive com 1 só registro.
- [ ] Relatório não contém nenhum termo da lista proibida (§4.4).
- [ ] Relatório imprime limpo (`@media print`, sem nav/botões).
- [ ] Bateria de RLS verde nas **13** tabelas.

### Fase 3 — Educação: Aprender (estrutura pronta, conteúdo por vir)

**Objetivo:** a aba Aprender existe, navegável, com o layout dos 3 níveis de
urgência — mas o **conteúdo clínico fica atrás de uma flag** até validação formal.

- `constants/learn.ts` — cards em estrutura de dados: `{ id, title, body,
  clinicallyValidated: boolean }`. Nada de texto clínico "solto" no JSX.
- `pages/Learn/` com as seções: Entenda a APLV · IgE × não-IgE · Reações
  imediatas × tardias · Quando procurar ajuda (3 níveis: *Observe e registre* /
  *Fale com a equipe assistente* / *Procure atendimento imediatamente*) · TPO.
- Flag `import.meta.env.VITE_LEARN_CONTENT_READY` (ou campo por card): enquanto
  `false`, o card mostra um aviso "conteúdo em validação clínica" em vez do
  texto. Em produção, cards não-validados ficam **ocultos**, não meio-prontos.
- O app **não** pede que a mãe se classifique como IgE / não-IgE (§26).
- "Quando procurar ajuda": os textos, sintomas e recomendações **não vão para
  produção sem validação clínica formal** (§27). A UI já deixa o espaço pronto.

**Aceite Fase 3**
- [ ] Aba Aprender navegável, cards em 3 níveis visuais para "quando procurar
      ajuda".
- [ ] Com a flag desligada, nenhum texto clínico não-validado aparece.
- [ ] Nenhuma tela pede autoclassificação clínica.

### Fase 4 — Refino do TPO (README FINAL §20–24, 28)

**Objetivo:** o módulo TPO deixa de ser "as 5 etapas fixas" e passa a ser um
fluxo guiado com orientação e conteúdo por etapa, sobre a estrutura configurável
já criada na Fase 0.

**4.1 Orientação inicial** (§21)
- Tela da aba TPO quando **não há** TPO ativo: o que é, para que serve, cenários
  domiciliar × supervisionado, "a decisão depende do caso", "o app não define
  quando/como iniciar". Mensagem obrigatória: *"O plano do TPO deve seguir a
  orientação da equipe assistente responsável pela criança."*
- Botão "Iniciar TPO" → chama `start_tpo`.

**4.2 Etapas e etapa atual** (§22–23)
- Lê `tpo_stages` (tabela seedada na Fase 0) via `useTpoStages`.
- Sequência de referência mostrada como **referência visual**, com a ressalva de
  §22 ("não é protocolo universal; ordem, alimento, quantidade e supervisão
  variam").
- Etapa atual: nome, breve explicação, "Por que esta etapa?", dia atual,
  exposições/sintomas/registros-sem-sintoma **daquela etapa**. Ações: registrar
  alimentação, registrar sintoma, "Tudo tranquilo" — **reusando os componentes
  do Diário** (§23: "evitar duplicação").

**4.3 Mudança de etapa** (§24) — já existe (`StageActions` + `change_stage`);
manter a confirmação e a imutabilidade do histórico. Só migra para ler os
rótulos de `tpo_stages`.

**4.4 Relatório do TPO** (§24, §19 "TPO atual") — o relatório geral no modo
"TPO atual": filtra pelo período do protocolo, mostra o resumo por etapa.

**4.5 Aprender — TPO** (§28) — os cards de TPO no módulo Aprender, mesma flag de
validação clínica da Fase 3.

**Aceite Fase 4**
- [ ] Sem TPO ativo, a aba TPO mostra a orientação inicial + "Iniciar TPO".
- [ ] Com TPO ativo, a etapa atual mostra explicação e os registros da etapa.
- [ ] Editar `tpo_stages` no banco muda o texto no app sem deploy.
- [ ] Avançar/repetir/retornar continua atrás da confirmação e não apaga
      histórico.

---

## 4-bis. Detalhes transversais

### 4.2 Nova árvore de rotas

```
/                       → /app
/login  /register       públicas
/onboarding             protegida — sem criança
/app                    Início (Home, 6 ações)
/app/alimentacao        registro
/app/sintomas           registro (progressivo)
/app/tudo-tranquilo     ex-"sem-sintomas"
/app/fralda             registro
/app/produto            registro
/app/ambiente           registro
/app/saude              hub das 4 sub-ações
/app/saude/:kind        registro de saúde
/app/diario             Diário (timeline + filtros + novo registro)
                        ↳ "+ Novo registro" ficou como folha no próprio /app/diario
                          (NewRecordSheet), sem rota própria — ver nota abaixo
/app/observacao         registro de nota
/app/relatorio          Relatório (seletor de período)
/app/tpo                TPO (orientação inicial OU etapa atual)
/app/tpo/etapas         mudança de etapa (ex-/app/etapas) + histórico de etapas
                        ↳ o histórico ficou como seção dentro de /app/tpo e
                          /app/tpo/etapas, sem rota própria — ver nota abaixo
/app/aprender           Aprender (hub de cards)
/app/aprender/:topic    card/seção
/dev                    catálogo do Design System (só DEV)
*                       NotFound
```

Redirects de compatibilidade para as rotas antigas (`/app/exposicao`,
`/app/timeline`, `/app/etapas`, `/app/sem-sintomas`) por uma versão, já que o app
está em uso controlado e pode haver atalho salvo na tela inicial.

> **Nota de implementação (F1/F4).** `/app/diario/novo` e `/app/tpo/historico` não
> viraram rotas. "+ Novo registro" abre como folha (`NewRecordSheet`) sobre o Diário
> e o histórico de etapas é uma seção de `/app/tpo` e `/app/tpo/etapas`. A intenção
> do plano — chegar aos dois de dentro da respectiva aba — está atendida; uma rota a
> menos é um estado a menos para a usuária perder com o "voltar" do navegador.

### 4.3 Editar e excluir (transversal — Fase 1)

- **RLS já permite** `update`/`delete` para o dono (`user_id = auth.uid()`) em
  todas as tabelas — nada a mudar no banco.
- Cada `service` ganha `update<X>(id, patch)` e `delete<X>(id)`.
- `symptom_events`: editar é mais complexo (evento + itens). MVP: permitir editar
  `occurred_at`, `note` e o vínculo com alimentação; **trocar sintomas = excluir
  e recriar**. Excluir cascateia os itens (FK `on delete cascade`).
- Novo `useRecordMutation` (irmão de `useRecordWrite`) com o mesmo ciclo
  `idle → saving → success/error`.
- Excluir **sempre** por `Modal` de confirmação. Texto neutro: "Excluir este
  registro? Esta ação não pode ser desfeita."
- Após editar/excluir: `useDiary` refaz a leitura (o relatório usa a mesma
  fonte, então acompanha).
- `stage_history` **não** é editável nem apagável pela usuária — o histórico do
  TPO segue imutável (`03-modelo-de-dados.md`).

### 4.4 Linguagem e conteúdo clínico (transversal — guarda permanente)

Auditar em cada fase, obrigatório antes de fechar a Fase 2:

| Proibido (README FINAL §19, §31) | Usar em vez |
|---|---|
| "APLV confirmada / descartada" | "padrão registrado" |
| "teste positivo / negativo", "etapa aprovada" | "registros do período", "sem sintomas registrados" |
| "gatilho confirmado", "reação ao alimento", "causado por", "provocado por" | "intervalo após alimentação", "distância no tempo" |
| "Classifique o sintoma / o gatilho" | "O que você percebeu?", "Quanto chamou sua atenção?" |
| "Registrar evento clínico" | "O que você quer registrar agora?" |
| pedir classificação IgE / não-IgE | (nunca; só explicar a diferença) |

- "Tudo tranquilo por aqui" **nunca** vira "teste negativo" nem "etapa aprovada"
  (§8).
- O relatório é **descritivo**. Abre e fecha com o `REPORT_DISCLAIMER`.
- `grep` de verificação a adicionar ao `06-checklist-qualidade.md`:
  `grep -rniE "confirmad|descartad|positiv|negativ|gatilho|causad|provocad" src/ | grep -v node_modules`
  — revisar cada ocorrência.

### 4.5 Regra de carga cognitiva (README FINAL §30 — aceite de toda tela nova)

Para **cada** fluxo novo, validar (§36):
- [ ] no máximo **3 decisões importantes** por tela;
- [ ] nenhum formulário longo expandido de cara — detalhes atrás de "+ Adicionar
      detalhes";
- [ ] data/hora automática, editável;
- [ ] texto livre sempre opcional quando possível;
- [ ] "Salvar" claro e acessível, e **desabilitado durante `saving`**;
- [ ] começa a 1 toque da Home (2 para sub-itens de Saúde);
- [ ] confirmação de salvamento visível;
- [ ] o dado aparece no Diário e sobrevive a fechar/reabrir;
- [ ] dá para corrigir um erro (editar/excluir);
- [ ] o relatório reflete o registro.

### 4.6 Design (README FINAL §32)

Os tokens atuais (`--color-primary #6f57e8`, fundo lilás claro) **já atendem**:
claro, calmo, não-hospitalar. Ajustes:
- Confirmar que **vermelho** (`--color-danger`) aparece só em erro, alerta de
  segurança validado e confirmação de exclusão — não em estado neutro.
- Sem fundo escuro, sem excesso de vermelho/preto, sem alertas visuais
  constantes.
- `SafetyAlert` mantém ícone + texto (cor nunca é o único sinal).
- `prefers-reduced-motion` respeitado (já é).

---

## 5. Catálogos e enums novos

| Onde | Item | Valores |
|---|---|---|
| enum SQL `food_consumer` | quem consumiu | `mother` · `child` |
| `constants/products.ts` (texto) | categoria de produto | Sabonete · Hidratante · Lenço umedecido · Fralda · Pomada · Shampoo · Protetor solar · Perfume/Colônia · Outro |
| `constants/environments.ts` (texto) | lugar | Casa de familiares/amigos · Escola/Creche · Restaurante · Festa/Evento · Viagem/Passeio · Outro |
| `health_records.kind` (texto) | tipo de registro de saúde | `medication` · `vaccine` · `appointment` · `weight` |
| `tpo_stages` (linhas) | etapas do TPO | seed: Preparação assada · Derivado aquecido · Queijo · Iogurte · Leite |
| `constants/symptoms.ts` | grupos (4 → 6) | Fezes · Barriguinha · Pele · Respiração · Comportamento/estado geral · Outro |

Regra mantida: catálogo é **texto em `constants/`** (evolui sem migration);
**enum** só onde a lista é curta, fechada e estrutural. Nunca remover um `code`
já gravado em produção.

---

## 6. Riscos e pontos de atenção

1. **Retrabalho da Fase 0 é o maior risco de cronograma.** É a única parte que
   mexe em contexto, rotas e todos os services de uma vez. Fazer primeiro,
   fechar o aceite, e só então abrir a Fase 1.
2. **`symptom_events` editável** é a feature mais espinhosa do "editar/excluir".
   O plano corta escopo aqui de propósito (trocar sintomas = excluir e recriar).
3. **Aprender depende de terceiros** (validação clínica). A flag garante que a
   ausência de conteúdo não bloqueia deploy.
4. **Tipos gerados** (`src/types/database.ts`) precisam ser regenerados após
   **cada** `supabase db push` — se esquecer, o `typecheck` quebra e é o sinal.
5. **Rotas antigas salvas na tela inicial** (PWA já instalado em uso controlado)
   — manter redirects por uma versão.
6. **`06-checklist-qualidade.md` e `05-roadmap.md`** ficam desatualizados frente
   a este plano. Ao fim da Fase 2, reconciliar os dois (como foi feito em
   2026-08-20) ou marcá-los como históricos e apontar para este arquivo.

## 7. Decisões ainda em aberto (do cliente)

- **Onboarding — campos**: confirmado que "motivo do acompanhamento" e
  "profissional" passam a descrever a **criança** (não um TPO). Falta o cliente
  dizer se quer algum campo a mais no onboarding novo (ex.: tipo de suspeita).
- **Catálogo de alimentação atual** (`feeding.ts`) segue **provisório sem
  validação clínica** (pendência herdada de `docs/README.md`).
- **Conteúdo de Aprender e de "quando procurar ajuda"**: bloqueado em validação
  clínica formal.
- **Nome do produto**: "Diário APLV" na interface; "Lactra" da especificação
  original segue como decisão de marca em aberto.

---

## 8. Sequência de commits sugerida

```
F0: migrations de desacoplamento evento↔protocolo + RLS por criança
F0: RPCs create_onboarding (só criança) e start_tpo
F0: ChildContext e RequireChild no lugar de ProtocolContext
F0: services e hooks de escrita recebem childId
F0: reteste completo de RLS (13 tabelas)
F1: navegação inferior de 4 abas
F1: nova Home com 6 ações + card do TPO
F1: Alimentação com Mãe/Criança e "+ adicionar detalhes"
F1: sintomas progressivos em 6 categorias
F1: Diário com filtros
F1: editar e excluir registro com confirmação
F2: registro de Produto / Higiene
F2: registro de Ambiente / Visita
F2: registro de Saúde (medicamento, vacina, consulta, peso)
F2: relatório com seletor de período
F2: auditoria de linguagem do relatório
F3: aba Aprender com estrutura de cards e flag de conteúdo
F4: TPO — orientação inicial e "iniciar TPO"
F4: TPO — etapa atual com explicação e registros da etapa
F4: TPO — etapas lidas de tpo_stages
F4: relatório do TPO
```

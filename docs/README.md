# Diário APLV — Documentação de Desenvolvimento

> Diário APLV — acompanhamento simples, registro seguro.

Documentação de desenvolvimento do Diário APLV.

**Autoridade atual: [`08-plano-implementacao.md`](08-plano-implementacao.md) +
[`09-progresso.md`](09-progresso.md).** O cliente redefiniu o produto em 2026-08-29
(acompanhamento longitudinal, TPO como módulo) e a implementação foi feita nas Fases
F0–F4 sobre a base M0–M12. Em qualquer divergência entre os documentos, valem o 08/09
e as migrations em `../supabase/migrations/`.

Os documentos `00`–`06` descrevem a **construção original M0–M12** e continuam úteis
como referência do porquê de cada decisão — mas onde falam de schema, rotas, contexto
ou telas, o 08/09 é mais atual (ver os avisos no topo de cada um).

## Índice

| Documento | Conteúdo |
|---|---|
| [07-visao-geral.md](07-visao-geral.md) | **Comece aqui.** O que é o produto, o que faz e o que foi construído |
| [08-plano-implementacao.md](08-plano-implementacao.md) | **Documento de trabalho atual.** Plano para a nova arquitetura funcional (README FINAL do cliente) sobre a base M0–M12 |
| [09-progresso.md](09-progresso.md) | **Handoff.** Estado da implementação do plano 08 — o que está feito, o que falta, como retomar |
| [00-especificacao.md](00-especificacao.md) | Especificação original do cliente |
| [01-decisoes.md](01-decisoes.md) | Stack, dependências aprovadas, regras não negociáveis |
| [02-arquitetura.md](02-arquitetura.md) | Camadas, Atomic Design, rotas, fluxo de dados, erros |
| [03-modelo-de-dados.md](03-modelo-de-dados.md) | Schema, enums, RLS, catálogos, tipos |
| [04-design-system.md](04-design-system.md) | Tokens, tipografia, espaçamento, componentes |
| [05-roadmap.md](05-roadmap.md) | Histórico: sequência dos 13 módulos M0–M12 e UX do produto original |
| [06-checklist-qualidade.md](06-checklist-qualidade.md) | Definition of Done e checklist de entrega |
| [modulos/](modulos/) | Um arquivo por módulo M0–M12: escopo, entregáveis, aceite |

## Sequência dos módulos (construção original M0–M12)

> Esta base está completa e no ar. A evolução seguinte (nova arquitetura
> funcional) está nas Fases F0–F4 — ver [`09-progresso.md`](09-progresso.md).

| # | Módulo | Status |
|---|---|---|
| [M0](modulos/M00-fundacao.md) | Fundação | ✅ concluído |
| [M1](modulos/M01-supabase.md) | Supabase, schema e RLS | ✅ concluído |
| [M2](modulos/M02-auth.md) | Auth e rotas protegidas | ✅ concluído |
| [M3](modulos/M03-onboarding.md) | Onboarding | ✅ concluído |
| [M4](modulos/M04-shell-dashboard.md) | Shell + Dashboard | ✅ concluído |
| [M5](modulos/M05-exposicao.md) | Exposição | ✅ concluído |
| [M6](modulos/M06-sintomas.md) | Sintomas rápidos | ✅ concluído |
| [M7](modulos/M07-timeline.md) | Timeline essencial | ✅ 🏁 **Marco de Uso Real** |
| [M8](modulos/M08-fralda-notas.md) | Fralda e observações | ✅ concluído |
| [M9](modulos/M09-etapas.md) | Etapas da escada | ✅ concluído |
| [M10](modulos/M10-relatorio.md) | Relatório e impressão | ✅ concluído |
| [M11](modulos/M11-design-system.md) | Design System | ✅ concluído |
| [M12](modulos/M12-pwa-qa.md) | PWA e QA final | ✅ concluído |

Os aceites que dependem de conferência em navegador seguem desmarcados nos
arquivos de módulo. São a única coisa entre o código de hoje e o MVP liberado.

## Reconciliação de 2026-08-20

O roadmap novo reordenou os módulos e fechou decisões que estavam pendentes.
O que mudou nos outros documentos:

| Antes | Agora |
|---|---|
| Design System no M1 | **M11** — funcional antes de bonito |
| Supabase no M2 | **M1** — segurança é a prioridade nº 1 |
| 6 etapas genéricas | **5 etapas nomeadas** (pendência clínica resolvida) |
| Catálogo de sintomas proposto | **21 sintomas em 4 categorias**, fechado |
| View SQL `timeline_events` | **união no frontend**, sem view |
| `symptom_items` | `symptom_event_items` |
| `has_symptoms` | `no_symptoms` |
| `exposures.description` + `amount` texto | `food` + `amount` enum de 4 opções |
| Fralda com booleanos | `blood` (3 níveis) · `mucus` (4) · `consistency` (5) |
| SQL colado no editor | **migrations versionadas** via Supabase CLI |
| React Bits no M12 | fora do MVP |

Correção de segurança encontrada na reconciliação: as policies antigas
(`user_id = auth.uid()` apenas) permitiam que um usuário escrevesse **dentro do
acompanhamento de outra família**. Reproduzido em Postgres e corrigido com as
funções de posse `owns_*`. Detalhes em [03-modelo-de-dados.md](03-modelo-de-dados.md).

## Pendências

1. **Alimentação atual da criança** — o roadmap pede o campo mas não define as opções.
   Catálogo provisório em `src/constants/feeding.ts` (5 opções). **Continua provisório**:
   foi para produção sem validação clínica.
2. **Fotos** — assumido **fora do MVP**.
3. **Hospedagem** — resolvido: **Netlify** com deploy contínuo na `main`, publicando
   em https://diario-aplv.netlify.app. Nada pendente aqui.
4. ~~**Editar e apagar registro**~~ — resolvido na **Fase 1** (`ae47552`): o Diário
   expande cada registro em "Editar"/"Excluir", com confirmação. O histórico de etapas
   do TPO segue imutável, por design.
5. **Conteúdo clínico do Aprender** — os `body` dos cards em `src/constants/learn.ts` e
   os sinais de cada nível de urgência dependem de **validação clínica formal**. Até lá,
   `VITE_LEARN_CONTENT_READY` fica desligada e os cards mostram "em revisão clínica".
6. **QA em navegador** — o roteiro do fluxo principal, responsividade, teclado/foco, PWA
   e impressão continuam por conferir. Lista em [`09-progresso.md`](09-progresso.md).

## Como usar

1. Leia [`09-progresso.md`](09-progresso.md) para o estado atual, depois
   [`08-plano-implementacao.md`](08-plano-implementacao.md) para o desenho da nova arquitetura.
2. `02-arquitetura.md` e `03-modelo-de-dados.md` explicam o porquê das camadas e do schema —
   com os avisos de "nova arquitetura" no topo.
3. Ao fim de cada entrega: `npm run typecheck && npm run lint && npm run build`.
4. Um commit por entregável (`F3: aba Aprender ...`, `M06: adiciona SymptomForm`).

# Diário APLV — Documentação de Desenvolvimento

> Diário APLV — acompanhamento simples, registro seguro.

Plano de construção do Diário APLV. A ordem dos módulos é **linear**: cada módulo
entrega algo funcional e é pré-requisito do próximo.

**`05-roadmap.md` é a autoridade.** Foi aprovado pelo cliente; os demais documentos
foram reconciliados contra ele. Em qualquer divergência, o roadmap ganha.

## Índice

| Documento | Conteúdo |
|---|---|
| [07-visao-geral.md](07-visao-geral.md) | **Comece aqui.** O que é o produto, o que faz e o que foi construído |
| [08-plano-implementacao.md](08-plano-implementacao.md) | **Documento de trabalho atual.** Plano para a nova arquitetura funcional (README FINAL do cliente) sobre a base M0–M12 |
| [00-especificacao.md](00-especificacao.md) | Especificação original do cliente |
| [01-decisoes.md](01-decisoes.md) | Stack, dependências aprovadas, regras não negociáveis |
| [02-arquitetura.md](02-arquitetura.md) | Camadas, Atomic Design, rotas, fluxo de dados, erros |
| [03-modelo-de-dados.md](03-modelo-de-dados.md) | Schema, enums, RLS, catálogos, tipos |
| [04-design-system.md](04-design-system.md) | Tokens, tipografia, espaçamento, componentes |
| [05-roadmap.md](05-roadmap.md) | **Autoridade.** Sequência dos 13 módulos e UX do produto |
| [06-checklist-qualidade.md](06-checklist-qualidade.md) | Definition of Done e checklist de entrega |
| [modulos/](modulos/) | Um arquivo por módulo: escopo, entregáveis, aceite |

## Sequência dos módulos

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
3. **Hospedagem** — resolvido: **Netlify**, configurado em `netlify.toml`. Falta
   conectar o repositório e cadastrar as variáveis de ambiente (ver README).
4. **Editar e apagar registro** — está na lista de cortes de escopo do roadmap
   (item 5) e foi cortado. O `00-especificacao.md` pede "validar edição; exclusão"
   na qualidade mínima, então é a primeira coisa a entrar depois do MVP.

## Como usar

1. Leia `05-roadmap.md` inteiro, depois `02-arquitetura.md` e `03-modelo-de-dados.md`.
2. Trabalhe um módulo por vez, do M0 ao M12. O critério de aceite é a porta do próximo.
3. Ao fim de cada módulo: `npm run typecheck && npm run lint && npm run build`.
4. Um commit por entregável, no formato `M06: adiciona SymptomForm`.

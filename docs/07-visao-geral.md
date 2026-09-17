# 07 — Visão Geral

> Documentação geral do Diário APLV: o que é, para que serve e o que foi construído.
>
> **Nota (nova arquitetura F0+).** O produto e a stack seguem como descritos aqui, mas
> a experiência foi reorganizada: navegação de 4 abas (Início/Diário/TPO/Aprender), Home
> de 6 ações, o TPO virou um módulo opcional, e entraram registros de Produto/Higiene,
> Ambiente/Visita e Saúde, além de editar/excluir. Estado atual em
> [`09-progresso.md`](09-progresso.md).

## O que é

O Diário APLV é uma aplicação web responsiva, com comportamento de PWA instalável,
para famílias que acompanham uma criança em **reintrodução de leite e derivados** —
o processo conhecido como *escada do leite*, na suspeita ou no diagnóstico de alergia
à proteína do leite de vaca.

Ele faz três coisas, e só três:

1. **Registra** o que aconteceu, com o mínimo de esforço possível.
2. **Organiza** tudo numa linha do tempo única.
3. **Imprime** um relatório para levar à consulta.

> [!IMPORTANT]
> O Diário APLV registra fatos e organiza. Ele **não** estabelece diagnóstico de APLV,
> não classifica gravidade, não sugere conduta e não recomenda avançar ou parar uma etapa.
> Nenhuma tela conclui, interpreta ou recomenda. A interpretação é sempre do profissional
> de saúde responsável.

Esse limite não é um aviso legal colado no rodapé: é regra de arquitetura. Não existe
regra automática de avanço de etapa em lugar nenhum do código, e o relatório apresenta
intervalos de tempo entre registros sem jamais nomeá-los como causa.

## O objetivo

Quem acompanha uma criança em reintrodução precisa responder a uma pergunta simples na
consulta: *o que aconteceu, e quando?* Na prática, o registro compete com o colo, a mamada
e a noite mal dormida. Se registrar custa caro, não se registra — e a consulta vira memória
aproximada.

Daí a meta objetiva do produto: **registrar exposição, sintoma ou fralda em menos de 30
segundos**, com o mínimo de digitação. Todas as decisões de interface derivam dela:

- Qualquer ação principal a **no máximo 1 toque** da Home
- Digitação é exceção — botão, chip ou seletor antes de teclado
- Horário atual preenchido automaticamente em todo evento, sempre editável
- Observação sempre opcional
- O formulário só limpa depois da confirmação do banco

Mensagem fixa na tela de sintomas — porque um diário de sintomas induz vigilância, e quem
procura, acha:

> Registre apenas o que realmente observar. Não é necessário procurar sintomas.

## O percurso de uso

```
Cadastro / entrada → Onboarding → Home → Registro → Timeline → Relatório
```

O **onboarding** acontece uma vez: nome e nascimento da criança, alimentação atual, motivo
do acompanhamento, profissional de saúde (opcional) e data de início. Cria criança,
acompanhamento e primeira etapa numa única transação. Enquanto não existe acompanhamento
ativo, o app leva de volta ao onboarding; enquanto não existe sessão, leva ao login.

Da Home saem os oito atalhos:

| Atalho | O que faz | Rota |
|---|---|---|
| Exposição | O que foi consumido, em que quantidade | `/app/exposicao` |
| Sintomas | Marcar sintomas por toque, com intensidade | `/app/sintomas` |
| Sem sintomas | Registrar que está tudo bem | `/app/sem-sintomas` |
| Fralda | Sangue, muco e consistência | `/app/fralda` |
| Observação | Anotação livre | `/app/observacao` |
| Timeline | Tudo em ordem | `/app/timeline` |
| Etapas | Avançar, repetir, retornar | `/app/etapas` |
| Relatório | Levar à consulta | `/app/relatorio` |

## O que se registra

**Exposição** — alimento (campo livre, com sugestão das exposições recentes), quantidade em
quatro toques (pequena · habitual · maior que o habitual · não sei), horário e observação
opcional.

**Sintomas** — catálogo fechado de **21 sintomas em 4 grupos**: gastrointestinais e fezes (10),
pele (4), respiratórios e estado geral (6) e outros (1). O toque na **intensidade**
(Leve · Moderada · Intensa) é o que seleciona o sintoma, cortando um passo por marcação.
Seis sintomas são marcados como sinais de alerta (sangue nas fezes, urticária, inchaço,
dificuldade para respirar, palidez importante, sonolência ou prostração) e disparam uma
orientação de cuidado — encaminhamento, não diagnóstico nem classificação de gravidade.
Um evento de sintomas pode ser **vinculado a uma exposição**; o vínculo é opcional e alimenta
a temporalidade do relatório.

**Sem sintomas** — registro de um toque, com valor próprio: a ausência de sintomas é informação
clínica, e sem ela o diário só mostra os dias ruins. No banco é o mesmo evento, com
`no_symptoms = true` e nenhum item.

**Fralda** — três seletores por toque: sangue (3 níveis), muco (4) e consistência (5).

**Observação** — texto livre com horário, para o que não cabe nos formulários acima.

## A escada do leite

Cinco etapas nomeadas, da forma menos alergênica até o leite in natura:

| # | Etapa |
|---|---|
| 1 | Preparação assada |
| 2 | Derivado aquecido |
| 3 | Queijo |
| 4 | Iogurte |
| 5 | Leite |

Três ações — **avançar**, **repetir**, **retornar** — todas atrás da mesma confirmação:
*avance apenas se estiver seguindo o plano definido pela equipe assistente*. Não existe avanço
automático: a decisão é clínica e humana, e o app apenas a registra.

O histórico é **imutável**. Mudar de etapa nunca sobrescreve: fecha o período corrente com data
de fim e desfecho (avançou · repetiu · retornou · pausou) e insere uma linha nova. Além disso,
**todo evento guarda a etapa vigente no momento do registro** — é o que permite ao relatório
agrupar por etapa mesmo depois de a família ter avançado.

## Timeline e relatório

As cinco origens do diário — exposições, eventos de sintomas, fraldas, observações e mudanças
de etapa — são buscadas em paralelo e unidas **no frontend**, ordenadas por `occurred_at`.
Não existe tabela nem view de timeline no banco: a união teria que acontecer no cliente de
qualquer forma para o relatório.

O relatório, impresso a partir do navegador, tem cinco seções:

1. **Criança e acompanhamento** — nome, nascimento, alimentação, período, etapa atual, motivo, profissional
2. **Registros no período** — contagens por tipo
3. **Resumo por etapa** — dias vividos, número de períodos e contagens por etapa
4. **Temporalidade** — intervalo entre cada sintoma e a exposição vinculada, rotulado como *distância no tempo*, nunca como causa
5. **Registros em ordem** — a timeline completa

Abre e fecha com o mesmo aviso de que organiza dados e não estabelece diagnóstico.

## Arquitetura

| Camada | Escolha |
|---|---|
| UI | React 19 + TypeScript 6 (strict, sem `any`) |
| Build | Vite 8 + vite-plugin-pwa |
| Backend | Supabase — PostgreSQL, Auth e Row Level Security |
| Roteamento | React Router 7 |
| Formulários | React Hook Form + Zod |
| Datas | date-fns (pt-BR) |
| Ícones | Lucide React |
| Estilo | CSS Modules + design tokens em custom properties |
| Qualidade | oxlint + Prettier + `tsc -b` |
| Hospedagem | Netlify, deploy contínuo a partir da `main` |

Fluxo de dados único, sem atalhos:

```
page → hook → service → supabase-js → PostgreSQL (RLS)
```

`supabase.from(...)` dentro de `components/` é proibido. A página conhece a rota e orquestra
hooks; o hook carrega o estado (`idle` · `saving` · `success` · `error`); o service é a única
camada que fala com o Supabase.

Componentes em Atomic Design: átomos → moléculas → organismos → templates, com catálogo vivo
em `/dev` — carregado sob demanda e apenas em desenvolvimento.

**PWA**: service worker com atualização por aviso, instalável, orientação retrato. O cache
guarda **somente o app** — nada de respostas do Supabase. Dado de saúde não fica guardado no
aparelho, e uma resposta velha de banco é pior do que um aviso honesto de "sem conexão".

## Modelo de dados

```
auth.users
   └── profiles (1:1)
         └── children (1:N)
               └── protocols (1:N)          "acompanhamento"
                     ├── stage_history (1:N)
                     ├── exposures (1:N)
                     ├── symptom_events (1:N) ── symptom_event_items (1:N)
                     ├── diaper_records (1:N)
                     └── notes (1:N)
```

Nove tabelas. Toda tabela filha carrega `user_id` denormalizado — RLS simples e rápida, sem
JOIN recursivo em cada policy. Todo evento carrega `occurred_at` e `stage`.

Seis enums no banco, um para cada lista curta e fechada: `protocol_status`, `stage_outcome`,
`exposure_amount`, `diaper_blood`, `diaper_mucus`, `diaper_consistency`. Os catálogos de
sintomas e de alimentação ficam em `src/constants/` como texto — crescem sem migration, e um
código já usado em produção nunca é removido.

Oito migrations versionadas, aplicadas em ordem e nunca editadas depois de aplicadas. Três
operações atômicas vivem como funções no banco — `create_onboarding`, `create_symptom_event` e
`change_stage` — mais o trigger `handle_new_user`, que cria o perfil no cadastro.

Detalhe completo em [`03-modelo-de-dados.md`](03-modelo-de-dados.md).

## Segurança dos dados

São dados de saúde de uma criança. A ordem de prioridade do projeto é explícita:

```
SEGURANÇA DOS DADOS → PERSISTÊNCIA → REGISTRO EM POUCOS TOQUES
→ TIMELINE → RELATÓRIO → DESIGN → ANIMAÇÕES
```

- **RLS ligada nas 9 tabelas**, nunca desativada para ganhar velocidade de desenvolvimento:
  36 policies apoiadas em 4 funções de posse.
- **Dupla checagem de posse**: cada policy verifica que a linha é minha **e** que o registro-pai
  também é meu. Só `user_id = auth.uid()` deixaria alguém que descobrisse um `protocol_id` alheio
  inserir registros dentro do acompanhamento de outra família — a chave estrangeira não verifica
  dono. A falha foi reproduzida em Postgres e corrigida com as funções `owns_*`.
- **Só a publishable key vai para o frontend.** A service role key nunca entra no repositório nem
  no painel de deploy: qualquer variável com prefixo `VITE_` é embutida no bundle.
- **Nada indexado**: `X-Robots-Tag: noindex, nofollow`, referrer restrito, `nosniff`,
  `X-Frame-Options: DENY`, HSTS e câmera, microfone e geolocalização desligados por
  Permissions-Policy.
- **Nenhum dado pessoal além do necessário** — fotos, por exemplo, ficaram fora do MVP.

## O que foi construído

13 módulos lineares. Cada um entrega algo funcional, e seu critério de aceite é a porta do
seguinte. O M1 vem antes do design justamente porque segurança precede acabamento.

| # | Módulo | O que entregou | Status |
|---|---|---|---|
| M0 | Fundação | Vite, TS estrito, aliases, lint, formatação, estrutura | ✅ |
| M1 | Supabase, schema e RLS | 6 enums, 9 tabelas, 36 policies, trigger de perfil | ✅ |
| M2 | Auth e rotas protegidas | Cadastro, entrada, sessão persistente, rotas públicas e protegidas | ✅ |
| M3 | Onboarding | Criança + acompanhamento + primeira etapa em uma transação | ✅ |
| M4 | Shell e Dashboard | Home com os 8 atalhos, etapa atual, contexto do acompanhamento | ✅ |
| M5 | Exposição | Formulário rápido, quantidade por toque, sugestão de recentes | ✅ |
| M6 | Sintomas rápidos | 21 sintomas, intensidade por toque, alertas, vínculo, "sem sintomas" | ✅ |
| M7 | Timeline essencial | União das cinco origens no cliente, em ordem — 🏁 marco de uso real | ✅ |
| M8 | Fralda e observações | Três seletores da fralda e anotação livre | ✅ |
| M9 | Etapas da escada | Avançar, repetir, retornar com confirmação; histórico imutável | ✅ |
| M10 | Relatório e impressão | Resumo por etapa, temporalidade e timeline no documento de consulta | ✅ |
| M11 | Design System | Tokens, componentes, animações discretas, catálogo em `/dev` | ✅ |
| M12 | PWA e QA final | Manifest, service worker, instalação, aviso de versão, estado offline | ✅ |

O código dos 13 módulos está escrito e no ar em <https://diario-aplv.netlify.app>. O que
continua desmarcado nos arquivos de módulo são os **critérios de aceite que exigem conferência
manual em navegador** — toque nos breakpoints de 375 a 1440 px, instalação do PWA, impressão do
relatório. São a única coisa entre o estado de hoje e o MVP liberado para uso.

## Fora do MVP, e conscientemente

O diário, hoje, só **cria** registros. Ficaram deliberadamente para depois:

- Corrigir e apagar registro — primeiro item a entrar depois do MVP, porque a especificação
  original o pedia
- Redefinir senha
- Pausar ou encerrar o acompanhamento
- Editar os dados da criança
- Acompanhar mais de uma criança
- Fotos de fralda (e, com elas, o Supabase Storage)
- Estratégia offline-first com IndexedDB

### Pendências conhecidas

1. O catálogo de **alimentação atual** (5 opções em `src/constants/feeding.ts`) foi para produção
   como provisório: a especificação pede o campo mas não define as opções, e elas não passaram por
   validação clínica.
2. A especificação original batiza o produto de **Lactra**; a interface hoje se chama
   **Diário APLV**. É uma decisão de marca em aberto, não um erro de implementação.

## Rodar e publicar

```bash
git clone git@github.com:Joaomarcellodev/Diario_APLV.git
cd Diario_APLV
npm install
cp .env.example .env.local   # chaves do seu projeto Supabase
npm run dev
```

O Vite só expõe variáveis com prefixo `VITE_`: `VITE_SUPABASE_URL` e
`VITE_SUPABASE_PUBLISHABLE_KEY`. O banco sobe com `npx supabase db push` e os tipos saem dele com
`npx supabase gen types typescript --linked`.

| Script | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Typecheck + build de produção |
| `npm run preview` | Serve o build |
| `npm run typecheck` | `tsc -b --noEmit` |
| `npm run lint` | oxlint |
| `npm run format` | Prettier |

A publicação é contínua: todo push na `main` dispara build no Netlify e publica. Build, publish,
redirect de SPA e cabeçalhos de segurança vêm do `netlify.toml`. Fora do repositório restam apenas
cadastrar as duas variáveis de ambiente antes do primeiro build e liberar a URL em
Authentication → URL Configuration no Supabase.

# Diário APLV

> Acompanhamento simples, registro seguro.

Diário de registro rápido para famílias em reintrodução de leite e derivados —
a **escada do leite**. Registra exposições, sintomas, fraldas e observações em
poucos toques e organiza tudo em uma linha do tempo e em um relatório para levar
à consulta.

> [!IMPORTANT]
> O Diário APLV **registra fatos e organiza**. Ele não estabelece diagnóstico de
> APLV, não classifica gravidade, não sugere conduta e não recomenda avançar ou
> parar uma etapa. A interpretação é sempre do profissional de saúde responsável.

## Por que existe

Quem acompanha uma criança em reintrodução precisa responder a uma pergunta simples
na consulta: _o que aconteceu, e quando?_ Na prática, o registro compete com o colo,
a mamada e a noite mal dormida. Se registrar custa caro, não se registra — e a
consulta vira memória aproximada.

O produto tem uma meta objetiva: **registrar exposição, sintoma ou fralda em menos
de 30 segundos**, com o mínimo de digitação possível.

## Princípios

- Qualquer ação principal a **no máximo 1 toque** da Home
- Digitação é exceção — prefira botão, chip ou seletor
- Horário atual preenchido automaticamente em todo evento, sempre editável
- Observação sempre opcional
- Feedback de salvamento imediato; o formulário só limpa após confirmação do banco
- Nenhuma tela conclui, interpreta ou recomenda

Mensagem fixa na tela de sintomas:

> Registre apenas o que realmente observar. Não é necessário procurar sintomas.

## Stack

| Camada      | Escolha                                              |
| ----------- | ---------------------------------------------------- |
| UI          | React 19 + TypeScript 6 (strict, sem `any`)          |
| Build       | Vite 8                                               |
| Backend     | Supabase — PostgreSQL + Auth + Row Level Security    |
| Roteamento  | React Router 7                                       |
| Formulários | React Hook Form + Zod                                |
| Datas       | date-fns (pt-BR)                                     |
| Ícones      | Lucide React                                         |
| Estilo      | CSS Modules + design tokens em CSS custom properties |
| Lint        | oxlint + Prettier                                    |

Arquitetura em Atomic Design, com uma regra de fluxo única:

```
page → hook → service → supabase-js → PostgreSQL (RLS)
```

`supabase.from(...)` dentro de `components/` é proibido.

## Segurança dos dados

São dados de saúde de uma criança. A prioridade nº 1 do projeto, acima de qualquer
funcionalidade:

```
SEGURANÇA DOS DADOS → PERSISTÊNCIA → REGISTRO EM POUCOS TOQUES
→ TIMELINE → RELATÓRIO → DESIGN → ANIMAÇÕES
```

- **RLS ligada nas 9 tabelas**, nunca desativada para ganhar velocidade de desenvolvimento
- Cada família só enxerga e escreve nos próprios dados
- As policies fazem **duas** checagens, não uma: a linha é minha **e** o registro-pai
  também é meu. Só `user_id = auth.uid()` deixaria um usuário que descobrisse um
  `protocol_id` alheio inserir registros dentro do acompanhamento de outra família,
  já que a chave estrangeira não verifica dono
- Somente a _publishable key_ vai para o frontend; a _service role key_ nunca
- Nenhum dado pessoal coletado além do necessário (fotos, por exemplo, estão fora do MVP)

## Rodando localmente

```bash
git clone git@github.com:Joaomarcellodev/Diario_APLV.git
cd Diario_APLV
npm install
cp .env.example .env.local     # preencha com as chaves do seu projeto Supabase
npm run dev
```

O Vite só expõe variáveis com o prefixo `VITE_`. Se copiou do painel do Supabase
no formato `NEXT_PUBLIC_*`, renomeie.

### Banco

As migrations são versionadas em `supabase/migrations/` e aplicadas em ordem:

```bash
npx supabase login
npx supabase link --project-ref <seu-ref>
npx supabase db push
npx supabase gen types typescript --linked > src/types/database.ts
```

Migration já aplicada **nunca** é editada — mudança vira migration nova.

## Scripts

| Script              | O que faz                      |
| ------------------- | ------------------------------ |
| `npm run dev`       | Servidor de desenvolvimento    |
| `npm run build`     | Typecheck + build de produção  |
| `npm run preview`   | Serve o build                  |
| `npm run typecheck` | `tsc -b --noEmit`              |
| `npm run lint`      | oxlint                         |
| `npm run format`    | Prettier (não toca em `docs/`) |

## Estrutura

```
docs/                  plano de construção — comece por 05-roadmap.md
supabase/migrations/   schema versionado (enums, tabelas, RLS, trigger)
src/
├── components/        atoms · molecules · organisms · templates
├── pages/             conhecem rota e orquestram hooks
├── hooks/             estado idle | saving | success | error
├── services/          única camada que fala com o Supabase
├── constants/         catálogos: etapas, sintomas, fralda, exposição
├── contexts/          Auth e acompanhamento ativo
├── schemas/           validação Zod
├── types/             database (gerado) · domain (UI)
├── utils/             datas, timeline, temporalidade
└── styles/            tokens.css é a fonte única de valores visuais
```

## Progresso

O plano tem 13 módulos lineares — o critério de aceite de cada um é a porta do
próximo. Detalhes em [`docs/`](docs/).

| #   | Módulo                  | Status                              |
| --- | ----------------------- | ----------------------------------- |
| M0  | Fundação                | ✅                                  |
| M1  | Supabase, schema e RLS  | ✅ migrations aplicadas e validadas |
| M2  | Auth e rotas protegidas | ✅                                  |
| M3  | Onboarding              | ✅                                  |
| M4  | Shell + Dashboard       | ✅                                  |
| M5  | Exposição               | ✅                                  |
| M6  | Sintomas rápidos        | ✅                                  |
| M7  | Timeline essencial      | ✅ 🏁 marco de uso real             |
| M8  | Fralda e observações    | ✅                                  |
| M9  | Etapas da escada        | ✅                                  |
| M10 | Relatório e impressão   | ✅                                  |
| M11 | Design System           | ✅ catálogo em `/dev`               |
| M12 | PWA e QA final          | ✅                                  |

Os critérios de aceite que dependem de conferência em navegador seguem
desmarcados em `docs/modulos/` e em `docs/06-checklist-qualidade.md` — são a
única coisa entre o código de hoje e o MVP liberado.

### Fora do MVP, e conscientemente

O diário só **cria** registros. Corrigir e apagar registro, redefinir senha,
pausar ou encerrar o acompanhamento, editar os dados da criança e acompanhar
mais de uma criança ficaram para depois do MVP.

Validado o M7, o app já entra em uso controlado: entrar, registrar exposição,
registrar sintomas em poucos toques, registrar ausência de sintomas, fechar,
voltar e encontrar tudo salvo. Design system, animações e PWA vêm depois.

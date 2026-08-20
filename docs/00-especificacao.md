# ATUALIZAÇÃO DE ARQUITETURA E IDENTIDADE

## Nome da aplicação

**Lactra**

### Conceito do nome

Nome curto, simples e memorável, derivado da ideia de lactação/leite,
sem utilizar "APLV" como nome principal do produto.

### Assinatura sugerida

**Lactra --- acompanhamento simples, registro seguro.**

O nome do produto na interface deve ser **Lactra**. "APLV/TPO" pode
aparecer apenas como descrição funcional.

---

## Plataforma

A aplicação será uma **aplicação web responsiva com comportamento PWA**.

Ela deve funcionar bem: - no navegador do celular; - em tablet; - em
desktop; - instalada na tela inicial quando o navegador permitir.

A prioridade de design continua sendo mobile-first, pois o principal uso
será o registro rápido pelo responsável.

Breakpoints mínimos a validar: - 375px; - 390px; - 430px; - 768px; -
1024px; - 1440px.

No desktop, não simplesmente esticar os formulários. Usar container
centralizado e largura confortável de leitura.

---

## Stack oficial

A stack do projeto fica definida como:

```text
React
TypeScript
Vite
Supabase
PostgreSQL (Supabase)
Supabase Auth
Supabase Storage, se houver fotos
React Bits Pro para recursos visuais e microinterações
PWA / Service Worker
IndexedDB posteriormente para estratégia offline-first
```

Sugestões complementares, sem tornar obrigatórias: - React Router; -
React Hook Form; - Zod; - date-fns; - Lucide React; - TanStack Query,
apenas se o desenvolvedor considerar necessário.

Evitar adicionar dependências sem necessidade.

---

## TypeScript

Todo o frontend deve ser escrito em TypeScript.

Evitar `any`.

Criar tipos/interfaces para as entidades principais:

```text
User
Child
Protocol
StageHistory
Exposure
SymptomEvent
SymptomItem
DiaperRecord
Note
TimelineEvent
```

Os tipos devem refletir o schema do Supabase.

Se possível, gerar os tipos diretamente a partir do banco Supabase.

---

## React Bits Pro

A interface poderá utilizar componentes e efeitos do **React Bits Pro**.

Objetivo: - melhorar acabamento visual; - criar transições suaves; -
melhorar feedback das ações; - tornar a experiência moderna; - preservar
simplicidade e legibilidade.

O React Bits deve ser usado com moderação.

### Bons usos no Lactra

- entrada suave dos cards;
- transição entre etapas;
- feedback visual após salvar um registro;
- progresso da escada do leite;
- estados vazios;
- pequenos destaques;
- modal;
- microinterações nos botões;
- animação discreta da timeline.

### Evitar

- fundos excessivamente animados;
- partículas;
- efeitos 3D;
- textos difíceis de ler;
- animações longas;
- movimentos que atrapalhem o registro;
- qualquer efeito que faça o produto parecer entretenimento.

Regra: \> React Bits deve melhorar a experiência, não chamar mais
atenção que a informação clínica.

Sempre respeitar `prefers-reduced-motion`.

---

# Arquitetura Atomic Design

O frontend deve seguir **Atomic Design**.

Estrutura sugerida:

```text
src/
├── components/
│   ├── atoms/
│   │   ├── Button/
│   │   ├── Input/
│   │   ├── Select/
│   │   ├── Checkbox/
│   │   ├── Chip/
│   │   ├── Badge/
│   │   ├── Icon/
│   │   ├── Textarea/
│   │   ├── Spinner/
│   │   └── Divider/
│   │
│   ├── molecules/
│   │   ├── FormField/
│   │   ├── SymptomChip/
│   │   ├── StageProgress/
│   │   ├── TimelineItem/
│   │   ├── StatCard/
│   │   ├── SafetyAlert/
│   │   ├── EmptyState/
│   │   └── ExposureSelector/
│   │
│   ├── organisms/
│   │   ├── Header/
│   │   ├── ExposureForm/
│   │   ├── SymptomForm/
│   │   ├── DiaperForm/
│   │   ├── Timeline/
│   │   ├── StageOverview/
│   │   ├── MilkLadder/
│   │   ├── ReportSummary/
│   │   └── AuthForm/
│   │
│   └── templates/
│       ├── AuthTemplate/
│       ├── AppTemplate/
│       ├── ProtocolTemplate/
│       └── ReportTemplate/
│
├── pages/
│   ├── Login/
│   ├── Register/
│   ├── Onboarding/
│   ├── Dashboard/
│   ├── Protocol/
│   └── Report/
│
├── hooks/
│   ├── useAuth.ts
│   ├── useProtocol.ts
│   ├── useTimeline.ts
│   └── useOnlineStatus.ts
│
├── services/
│   ├── supabase.ts
│   ├── auth.service.ts
│   ├── protocol.service.ts
│   ├── exposure.service.ts
│   ├── symptom.service.ts
│   ├── diaper.service.ts
│   └── report.service.ts
│
├── types/
│   ├── database.ts
│   ├── domain.ts
│   └── index.ts
│
├── utils/
│   ├── dates.ts
│   ├── timeline.ts
│   ├── symptomCodes.ts
│   └── report.ts
│
├── constants/
│   ├── stages.ts
│   └── symptoms.ts
│
├── routes/
│   └── index.tsx
│
├── styles/
│   ├── tokens.css
│   └── global.css
│
├── App.tsx
└── main.tsx
```

---

## Regra de responsabilidade dos componentes

### Atoms

Não conhecem regras de negócio.

Exemplos: `Button`, `Chip`, `Input`, `Badge`.

### Molecules

Combinam atoms e executam interações pequenas.

Exemplo: `SymptomChip`.

### Organisms

Representam blocos funcionais completos.

Exemplo: `SymptomForm`.

### Templates

Definem estrutura visual das páginas.

### Pages

Conectam: - rotas; - dados; - hooks; - serviços; - templates.

Evitar chamadas diretas ao Supabase dentro de atoms/molecules.

---

# Rotas

Estrutura sugerida:

```text
/login
/register
/onboarding
/app
/app/protocol/:protocolId
/app/report/:protocolId
```

Rotas `/app/*` devem ser protegidas.

Usuário não autenticado deve ser redirecionado para `/login`.

---

# Design System

Criar tokens básicos desde o início.

```css
--color-primary: #6f57e8;
--color-background: #f7f5fb;
--color-surface: #ffffff;
--color-text: #262432;
--color-muted: #747181;
--color-border: #e8e4f0;
--color-danger: #b63b53;
--color-success: #3f8e63;
```

Também padronizar: - spacing; - radius; - shadows; - typography; -
animation durations.

Componentes React Bits devem respeitar esses tokens.

---

# Responsividade

## Mobile

Fluxo em uma coluna.

Botões principais devem ocupar largura confortável e possuir área de
toque adequada.

Timeline vertical.

Formulários simples.

## Tablet/Desktop

Usar container centralizado.

Sugestão:

```text
max-width geral: 1100–1200px
max-width de formulários: 680–760px
```

Em telas maiores, o protocolo pode usar duas colunas:

```text
┌──────────────────────────────┬─────────────────────────┐
│ Registro                     │ Resumo da etapa         │
│                              │                         │
│ Exposição                    │ Timeline recente        │
│ Sintomas                     │                         │
│ Fralda                       │                         │
└──────────────────────────────┴─────────────────────────┘
```

No mobile, voltar automaticamente para uma coluna.

---

# Estado da aplicação

Para este MVP, evitar Redux.

Usar: - estado local do React; - Context apenas para
autenticação/contexto realmente global; - hooks próprios; - Supabase
como fonte persistente.

Se necessário para consultas/cache, usar TanStack Query, mas não é
obrigatório.

---

# Estratégia de banco

O Supabase será a fonte de verdade.

Fluxo inicial:

```text
React
↓
services
↓
Supabase JS
↓
PostgreSQL
```

Todas as tabelas continuam seguindo o modelo definido anteriormente no
README.

RLS é obrigatório.

---

# Estratégia de persistência

Prioridade da primeira entrega:

```text
usuário salva
↓
Supabase
↓
confirmação de sucesso
↓
timeline atualizada
```

Assim, fechar navegador, sair da conta ou trocar de aparelho não deve
apagar o histórico.

A segunda camada poderá adicionar IndexedDB:

```text
React
↓
IndexedDB
↓
fila de sincronização
↓
Supabase
```

Não bloquear a primeira versão por causa do offline completo.

---

# Feedback de salvamento

Toda ação deve possuir estado:

```text
idle
loading
success
error
```

Exemplo:

Ao tocar em "Salvar sintoma":

```text
Salvando...
↓
Registro salvo
```

Não limpar o formulário antes da confirmação do Supabase.

Em erro: \> Não foi possível salvar. Tente novamente.

---

# Tratamento de erros

Criar tratamento centralizado para: - sessão expirada; - erro de rede; -
erro Supabase; - validação; - registro não encontrado.

Nunca exibir mensagens técnicas do banco diretamente para a usuária.

---

# Validação

Preferência: **Zod + React Hook Form**.

Schemas:

```text
childSchema
protocolSchema
exposureSchema
symptomSchema
diaperSchema
noteSchema
```

Validação também deve existir no banco sempre que possível.

---

# Relatório responsivo

A página do relatório deve possuir dois modos:

### Tela

Interface responsiva e agradável.

### Impressão

CSS `@media print`.

Ocultar: - navegação; - botões; - elementos interativos.

Exibir: - cabeçalho; - resumo; - etapas; - sintomas; - temporalidade; -
fraldas; - timeline; - aviso clínico.

MVP: `window.print()`.

---

# Segurança

Obrigatório: - Supabase Auth; - RLS; - HTTPS; - usuário acessa apenas
seus próprios dados; - anon key no frontend; - service role nunca no
frontend; - nenhuma tabela sensível aberta anonimamente.

Como o app lida com dados de saúde, coletar somente o necessário.

---

# Convenções

Componentes:

```text
PascalCase
```

Hooks:

```text
useCamelCase
```

Services:

```text
camelCase.service.ts
```

Types:

```text
PascalCase
```

Constantes:

```text
UPPER_SNAKE_CASE
```

Evitar componentes gigantes.

Se um componente acumular responsabilidades, quebrar seguindo Atomic
Design.

---

# Qualidade mínima

Antes da entrega:

```bash
npm run build
```

deve finalizar sem erros.

Também validar: - TypeScript sem erros; - console sem erros
relevantes; - mobile; - desktop; - login/logout; - persistência; -
RLS; - relatório; - edição; - exclusão.

---

# Ordem recomendada de construção

```text
1. Vite + React + TypeScript
2. Estrutura Atomic Design
3. Tokens/design system
4. Supabase
5. Schema SQL
6. RLS
7. Auth
8. Onboarding
9. Dashboard/protocolo
10. Exposição
11. Sintomas
12. Sem sintomas
13. Fralda
14. Timeline
15. Etapas
16. Relatório
17. Responsividade
18. React Bits / microinterações
19. PWA
20. Testes finais
```

A interface funcional deve vir antes das animações.

---

# Definição final do produto

**Lactra** é uma aplicação web responsiva/PWA de acompanhamento
estruturado da reintrodução materna de proteína do leite.

Tecnologia:

```text
React + TypeScript + Supabase + Atomic Design + React Bits Pro
```

O produto deve ser: - simples; - rápido; - responsivo; - seguro; -
acolhedor; - visualmente refinado; - sem lógica diagnóstica.

O núcleo continua sendo:

> registrar fatos com poucos toques e transformar esses registros em uma
> linha do tempo clara para avaliação profissional.

# 04 — Design System

> **Nota (nova arquitetura F0+).** Os tokens e o inventário seguem valendo sem mudança —
> `08-plano-implementacao.md` §4.6 confirmou a paleta atual. O que entrou depois deste
> documento: o organism `BottomNav` (navegação de 4 abas), `NewRecordSheet`,
> `DiaryEntryModal`, `ProductForm`, `EnvironmentForm`, `HealthForm` e a molécula
> `LearnCard`. O catálogo vivo continua em `/dev`.

Fonte única: `src/styles/tokens.css`. Nenhum valor cru (`#fff`, `12px`, `0.3s`) fora dele.

## Tokens

```css
:root {
  /* cor */
  --color-primary: #6f57e8;
  --color-primary-hover: #5c45d6;
  --color-primary-soft: #ede9fb;
  --color-background: #f7f5fb;
  --color-surface: #ffffff;
  --color-text: #262432;
  --color-muted: #747181;
  --color-border: #e8e4f0;
  --color-danger: #b63b53;
  --color-danger-soft: #fbedf0;
  --color-success: #3f8e63;
  --color-success-soft: #eaf5ef;

  /* espaçamento — escala de 4 */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-7: 48px;
  --space-8: 64px;

  /* raio */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-full: 999px;

  /* sombra */
  --shadow-sm: 0 1px 2px rgba(38, 36, 50, 0.06);
  --shadow-md: 0 4px 16px rgba(38, 36, 50, 0.08);
  --shadow-lg: 0 12px 32px rgba(38, 36, 50, 0.12);

  /* tipografia */
  --font-sans: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-md: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.375rem;
  --text-2xl: 1.75rem;
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --weight-regular: 400;
  --weight-medium: 500;
  --weight-bold: 600;

  /* movimento */
  --duration-fast: 120ms;
  --duration-base: 200ms;
  --duration-slow: 320ms;
  --ease-out: cubic-bezier(0.22, 0.61, 0.36, 1);

  /* layout */
  --container-max: 1160px;
  --form-max: 720px;
  --touch-min: 48px;
  --z-header: 100;
  --z-modal: 400;
  --z-toast: 500;
}

@media (prefers-reduced-motion: reduce) {
  :root {
    --duration-fast: 0ms;
    --duration-base: 0ms;
    --duration-slow: 0ms;
  }
}
```

## Regras de uso

- **Toque**: qualquer alvo interativo ≥ `--touch-min` (48px) no mobile.
- **Contraste**: texto normal ≥ 4.5:1. `--color-muted` só em texto ≥ 14px de apoio.
- **Cor não é o único sinal**: alerta/sucesso sempre com ícone + texto.
- **Foco visível**: `outline: 2px solid var(--color-primary); outline-offset: 2px` — nunca `outline: none` sem substituto.
- **Densidade**: cartão usa `--space-4` interno no mobile, `--space-5` a partir de 768px.

## Breakpoints

```css
/* mobile-first; validar em 375, 390, 430, 768, 1024, 1440 */
@media (min-width: 768px) {
  /* tablet: container centralizado */
}
@media (min-width: 1024px) {
  /* desktop: protocolo em 2 colunas */
}
```

Layout do protocolo em ≥1024px:

```
┌──────────────────────────────┬─────────────────────────┐
│ Registro (Exposição/Sintoma/ │ Resumo da etapa         │
│ Fralda)                      │ Timeline recente        │
└──────────────────────────────┴─────────────────────────┘
     minmax(0, 1.4fr)                minmax(320px, 1fr)
```

No mobile colapsa para uma coluna, com o resumo **abaixo** do registro.

## Inventário de componentes (M11)

O Design System é **padronização, não invenção**: no M11 os componentes já existem,
espalhados pelas telas dos módulos M2–M10. O trabalho é extrair, unificar e
documentar em `/dev`. **Nenhuma regra de negócio muda no M11.**

| Camada | Componentes |
|---|---|
| atoms | `Button` · `Input` · `Select` · `Textarea` · `Chip` · `Badge` · `Loading` |
| molecules | `ActionTile` · `SeveritySelector` · `SymptomRow` · `Card` · `Alert` · `Toast` |
| organisms | `Modal` |

`ActionTile` é o atalho grande da Home (ícone + nome, alvo ≥ `--touch-min`).
`SeveritySelector` são os três chips Leve/Moderada/Intensa.
`SymptomRow` é o par nome do sintoma + `SeveritySelector`.

## Camada `animations/` (ReactBits)

`src/components/animations/` reúne cinco envoltórios adaptados do
[ReactBits](https://www.reactbits.dev/). Nenhum deles tem regra de negócio:
são wrappers de apresentação e saem de qualquer tela sem alterar o que é
registrado.

| Componente | O que faz | Onde |
|---|---|---|
| `FadeContent` | entrada de conteúdo: fade + 8px | cartão da etapa na Home |
| `AnimatedContent` | entrada escalonada de lista (teto de 8 itens) | atalhos da Home, timeline |
| `SpotlightCard` | brilho seguindo o ponteiro | os 8 atalhos da Home |
| `ClickSpark` | fagulhas no toque | `Button` (primary e secondary) |
| `CountUp` | contagem de um número já apurado | totais do relatório |

Os originais usam Tailwind e, em alguns casos, `gsap + ScrollTrigger` ou
`motion`. Aqui foram portados para CSS Modules com os tokens do projeto e,
onde precisam de JS, para `requestAnimationFrame`. **O projeto continua sem
biblioteca de animação**: os cinco somam ~1 kB no bundle.

`CountUp` mantém o valor final no `aria-label` desde o primeiro quadro — num
relatório clínico, o número na tela é o número do banco, inclusive enquanto
anima.

Fundos animados, texto animado, cursores e 3D do ReactBits ficam fora, pelas
regras abaixo.

## Movimento

Sem biblioteca de animação no MVP — só transições CSS com os tokens de duração.
Animação é o **último** item da lista de prioridade e o primeiro corte de escopo.

Permitido: entrada de cards (fade + 8px), feedback de salvo, transição entre etapas,
progresso da escada, estado vazio, modal, microinteração de botão.

Proibido: fundo animado, partículas, 3D, parallax, texto animado, qualquer coisa
acima de `--duration-slow` (320ms) ou que atrase o registro.

Regra: se a animação disputar atenção com a informação clínica, ela sai.

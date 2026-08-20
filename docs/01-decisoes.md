# 01 — Decisões Técnicas

Decisões fechadas para o MVP. Mudar qualquer uma exige atualizar este arquivo.
Reconciliado com `05-roadmap.md` (versão aprovada pelo cliente).

## Identidade do produto

| Item | Valor |
|---|---|
| Nome exibido | **Diário APLV** |
| Assinatura | Diário APLV — acompanhamento simples, registro seguro |
| Pasta / repositório / pacote npm | `diario-aplv` |
| `manifest.short_name` | Diário APLV |

O nome "Lactra", usado nos rascunhos iniciais da especificação, foi descontinuado.
Todo texto de interface, título, manifest e metadados usam **Diário APLV**.

## Stack

Versões conforme instaladas no M0 (`package.json` é a fonte da verdade).

| Camada | Escolha |
|---|---|
| UI | React 19 + TypeScript 6 (strict) |
| Build | Vite 8 |
| Backend | Supabase (PostgreSQL + Auth + RLS) |
| Migrations / tipos | Supabase CLI (`supabase db push`, `gen types`) |
| Roteamento | React Router 7 |
| Formulários | React Hook Form |
| Validação | Zod 4 |
| Datas | date-fns (locale pt-BR) |
| Ícones | Lucide React |
| Estilo | CSS Modules + tokens em CSS custom properties |
| Lint / formatação | oxlint + Prettier |
| PWA | vite-plugin-pwa (M12) |

### Desvios em relação ao rascunho inicial

| Rascunho | Vigente | Motivo |
|---|---|---|
| React 18 | **React 19** | Padrão atual do scaffold Vite; todas as libs aprovadas suportam. |
| React Router v6 | **v7** | Idem. API usada no MVP é a mesma. |
| ESLint | **oxlint** | Padrão do scaffold Vite, zero config, muito mais rápido. Prettier mantido. |
| React Bits Pro | **fora** | O roadmap novo não tem módulo de animação; é o primeiro corte de escopo. |

## Dependências aprovadas

```
react react-dom react-router-dom
@supabase/supabase-js
react-hook-form @hookform/resolvers zod
date-fns lucide-react
-- dev --
typescript vite @vitejs/plugin-react
oxlint prettier supabase vite-plugin-pwa
```

Qualquer dependência fora desta lista precisa de justificativa escrita no PR.

## O que ficou de fora do MVP (e por quê)

| Item | Motivo |
|---|---|
| Redux / Zustand | Estado global do MVP é só sessão + acompanhamento ativo. Context basta. |
| TanStack Query | Poucas telas, poucas queries. Hooks próprios com `idle/saving/success/error` resolvem. |
| IndexedDB / offline-first | Segunda camada. Não bloquear a v1 por isso. |
| Supabase Storage / fotos | Dado de saúde extra sem necessidade comprovada. Coletar só o necessário. |
| View SQL de timeline | Timeline é unida no frontend (M7). Menos superfície no banco. |
| React Bits / animações | Sem módulo no roadmap. Primeiro item da lista de cortes. |
| Export PDF via lib | MVP usa `window.print()` + `@media print`. |
| Testes automatizados | MVP valida por checklist manual (`06-checklist-qualidade.md`). Se entrar teste, começar por Vitest nas funções de `utils/`. |
| Multi-cuidador / compartilhamento | Fora de escopo. RLS assume 1 usuário = seus próprios dados. |

## Regras não negociáveis

### Código
1. **Sem `any`.** `strict: true` + `noUncheckedIndexedAccess: true` no tsconfig.
2. **Service role key nunca no frontend.** Só a publishable key, via `.env` (`VITE_SUPABASE_*`).
3. **RLS ligada em todas as tabelas** antes de qualquer tela consumir dados —
   e **nunca desativada** para ganhar velocidade de desenvolvimento.
4. **Atoms e molecules não importam `services/`** nem `supabase`.
5. **Nada de mensagem técnica do banco na tela.** Tudo passa pelo mapeador de erros.
6. `prefers-reduced-motion` respeitado em toda animação.

### Produto
7. **Sem lógica diagnóstica.** O app registra fatos e organiza. Nunca conclui, sugere
   conduta, classifica gravidade automaticamente ou recomenda avançar/parar etapa.
8. **Formulário só limpa depois do sucesso confirmado** pelo Supabase.
9. **Qualquer ação principal a no máximo 1 toque da Home.**
10. **Digitação é exceção.** Preferir botão, chip ou seletor.
11. **Horário atual automático em todo evento** (`occurred_at`), editável pela usuária.
12. **Todo formulário tem `idle → saving → success/error`**, com o botão desabilitado
    durante `saving` para evitar registro duplicado.

## Prioridade absoluta

```
SEGURANÇA DOS DADOS → PERSISTÊNCIA → REGISTRO EM POUCOS TOQUES
→ TIMELINE → RELATÓRIO → DESIGN → ANIMAÇÕES
```

Em qualquer conflito de decisão, o item mais à esquerda ganha.

## Ambiente

```
.env.local        # não versionado
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

`.env.example` versionado com as chaves vazias.

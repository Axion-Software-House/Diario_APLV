# 01 — Decisões Técnicas

Decisões fechadas para o MVP. Mudar qualquer uma exige atualizar este arquivo.

## Identidade do produto

| Item                             | Valor                                                 |
| -------------------------------- | ----------------------------------------------------- |
| Nome exibido                     | **Diário APLV**                                       |
| Assinatura                       | Diário APLV — acompanhamento simples, registro seguro |
| Pasta / repositório / pacote npm | `diario-aplv`                                         |
| `manifest.short_name`            | Diário APLV                                           |

O nome "Lactra", usado nos rascunhos iniciais da especificação, foi descontinuado.
Todo texto de interface, título, manifest e metadados usam **Diário APLV**.

## Stack

| Camada      | Escolha                                       |
| ----------- | --------------------------------------------- |
| UI          | React 18 + TypeScript (strict)                |
| Build       | Vite                                          |
| Backend     | Supabase (PostgreSQL + Auth + RLS)            |
| Roteamento  | React Router v6                               |
| Formulários | React Hook Form                               |
| Validação   | Zod                                           |
| Datas       | date-fns (locale pt-BR)                       |
| Ícones      | Lucide React                                  |
| Estilo      | CSS Modules + tokens em CSS custom properties |
| Motion      | React Bits Pro (somente a partir do M12)      |
| PWA         | vite-plugin-pwa                               |

## Dependências aprovadas

```
react react-dom react-router-dom
@supabase/supabase-js
react-hook-form @hookform/resolvers zod
date-fns lucide-react
-- dev --
typescript vite @vitejs/plugin-react
eslint prettier vite-plugin-pwa
```

Qualquer dependência fora desta lista precisa de justificativa escrita no PR.

## O que ficou de fora do MVP (e por quê)

| Item                              | Motivo                                                                                                                            |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Redux / Zustand                   | Estado global do MVP é só sessão + protocolo ativo. Context basta.                                                                |
| TanStack Query                    | Poucas telas, poucas queries. Hooks próprios com `idle/loading/success/error` resolvem. Reavaliar se o cache virar problema real. |
| IndexedDB / offline-first         | Segunda camada. O README manda **não bloquear** a v1 por isso.                                                                    |
| Supabase Storage / fotos          | Dado de saúde extra sem necessidade comprovada. Coletar só o necessário.                                                          |
| Export PDF via lib                | MVP usa `window.print()` + `@media print`.                                                                                        |
| Testes automatizados              | MVP valida por checklist manual (`06-checklist-qualidade.md`). Se entrar teste, começar por Vitest nas funções de `utils/`.       |
| Multi-cuidador / compartilhamento | Fora de escopo. RLS assume 1 usuário = seus próprios dados.                                                                       |

## Regras não negociáveis

1. **Sem `any`.** `strict: true` no tsconfig.
2. **Sem lógica diagnóstica.** O app registra fatos e organiza. Nunca conclui, sugere
   conduta, classifica gravidade automaticamente ou recomenda avançar/parar etapa.
3. **Service role key nunca no frontend.** Só a anon key, via `.env` (`VITE_SUPABASE_*`).
4. **RLS ligado em todas as tabelas** antes de qualquer tela consumir dados.
5. **Atoms e molecules não importam `services/`** nem `supabase`.
6. **Nada de mensagem técnica do banco na tela.** Tudo passa pelo mapeador de erros.
7. **Formulário só limpa depois do sucesso confirmado** pelo Supabase.
8. `prefers-reduced-motion` respeitado em toda animação.

## Ambiente

```
.env.local        # não versionado
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

`.env.example` versionado com as chaves vazias.

# 03 — Modelo de Dados

> As migrations em `../supabase/migrations/` são a fonte executável; este documento
> explica **por quê** cada coisa é como é. Divergiu? A migration ganha.
>
> **Nota (nova arquitetura F0+).** Este documento descreve o schema M0–M12. As
> migrations `20260829120000`–`20260829120800` reformaram o modelo:
> - **a criança é o sujeito**; `children` ganha `reason`/`professional`
> - eventos do diário carregam `child_id NOT NULL`; `protocol_id` e `stage` viram
>   **opcionais** (preenchidos só durante um TPO)
> - `protocols` = o **TPO** (0..N por criança, 1 ativo); `create_onboarding` cria só
>   a criança, `start_tpo` inicia um TPO
> - `exposures` ganha `consumer` (`mother`|`child`), `brand`, `details`
> - tabelas novas: `product_records`, `environment_records`, `health_records` (jsonb)
> - `tpo_stages` — a escada do TPO configurável por dados
> - RLS: a 2ª checagem de posse passa a ser `owns_child(child_id)` + `owns_protocol`
>   condicional
>
> Desenho e justificativa em [`08-plano-implementacao.md`](08-plano-implementacao.md) §3.

## Diagrama

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

**Não existe tabela nem view de timeline.** A timeline é unida no frontend (M7),
ordenando por `occurred_at DESC`. Decisão do roadmap: menos superfície no banco,
e a união já precisa acontecer no cliente para o relatório.

Toda tabela filha carrega `user_id` denormalizado. Motivo: RLS simples e rápida,
sem JOIN recursivo em cada policy.

Todo evento do diário tem `occurred_at` e `stage`. O `stage` é gravado no momento
do registro para o relatório conseguir agrupar por etapa mesmo depois de a
usuária avançar na escada.

## Migrations

Ordem fixa, versionada em `supabase/migrations/`:

| Arquivo | Conteúdo |
|---|---|
| `20260820120000_enums.sql` | 6 enums |
| `20260820120100_tables.sql` | 9 tabelas + índices |
| `20260820120200_rls.sql` | 4 helpers de posse + 36 policies |
| `20260820120300_auth_trigger.sql` | `handle_new_user` |

```bash
npx supabase link --project-ref <ref>
npx supabase db push
npx supabase gen types typescript --linked > src/types/database.ts
```

Migrations aplicadas **nunca** são editadas. Mudança = migration nova.

## Enums

Cada enum espelha exatamente as opções de toque do roadmap — nada de texto livre
onde a usuária deveria só tocar.

| Enum | Valores | Onde aparece |
|---|---|---|
| `protocol_status` | `active` · `paused` · `finished` | acompanhamento |
| `stage_outcome` | `advanced` · `repeated` · `returned` · `paused` | histórico de etapas (M9) |
| `exposure_amount` | `pequena` · `habitual` · `maior` · `nao_sei` | Exposição (M5) |
| `diaper_blood` | `nao` · `tracos` · `visivel` | Fralda (M8) |
| `diaper_mucus` | `nao` · `pouco` · `moderado` · `muito` | Fralda (M8) |
| `diaper_consistency` | `habitual` · `liquida` · `pastosa` · `ressecada` · `nao_sei` | Fralda (M8) |

`symptom_event_items.code` e `children.feeding` são **texto**, não enum: os catálogos
vivem em `src/constants/` e evoluem sem migration. Enum só onde a lista é curta,
fechada e definida pelo roadmap.

## Tabelas

### `profiles`
Espelha `auth.users`, criada pelo trigger no signup. Chaveia por `id` (não `user_id`).

### `children`
`name`, `birth_date`, `feeding` (código do catálogo `constants/feeding.ts`).

### `protocols` — o "acompanhamento"
`reason` (motivo), `professional` (opcional), `started_at` (início),
`status`, `current_stage` — a faixa aceita no banco é **1..20**, a mesma de
`tpo_stages.ordinal`. O teto real é o do catálogo: `change_stage` recusa passar de
`max(ordinal)` de `tpo_stages` (hoje 5). Era `1..5` fixo até
`20260919210100_stage_ceiling_follows_catalog.sql` — com o limite fixo, cadastrar uma 6ª
etapa era aceito pelo catálogo e estourava na mudança de etapa.

### `stage_history` — imutável
Avançar / repetir / retornar **nunca** faz update destrutivo: fecha o período corrente
(`ended_at` + `outcome`) e insere uma linha nova. O que foi vivido não se reescreve.

Desde `20260919210000_stage_history_immutable.sql` isso é garantido **no banco**, não só
na interface: `delete` está fechado (`using (false)`), `update` só alcança o período ainda
aberto (`using (... and ended_at is null)`) e o trigger `stage_history_freeze` recusa
qualquer mudança em `stage`, `protocol_id`, `started_at`, `user_id` ou `id` — restam
`ended_at`, `outcome` e `note`, que é exatamente o que `change_stage` escreve para fechar
um período. Apagar a criança ou o protocolo continua levando o histórico junto: o cascade
de FK não passa por RLS.

### `exposures`
`food` (único campo de digitação livre obrigatório do fluxo rápido), `amount` (toque),
`occurred_at`, `note`.

### `symptom_events`
- `no_symptoms = true` → é o registro do botão **SEM SINTOMAS**, sem nenhum item.
- `no_symptoms = false` → tem 1..N `symptom_event_items`.
- `exposure_id` → vínculo **opcional** com uma exposição.

### `symptom_event_items`
`code` (catálogo) + `intensity` **obrigatória** (1 Leve · 2 Moderada · 3 Intensa) —
porque na UI é o toque na intensidade que seleciona o sintoma.
`unique (symptom_event_id, code)` impede o mesmo sintoma duas vezes no mesmo evento.

### `diaper_records`
`blood`, `mucus`, `consistency` — três seletores por toque. Foto fora do MVP.

### `notes`
`content` (1..2000 caracteres).

## Temporalidade

Calculada **no frontend**, nunca gravada:

```
symptom_events.occurred_at − exposures.occurred_at
```

Exibida como `8h40 após exposição`. **Nunca como causalidade.** O app mostra que
houve um intervalo; quem interpreta é o profissional de saúde.

## RLS — duas checagens, não uma

```sql
alter table public.<t> enable row level security;
-- select/delete:  user_id = auth.uid()
-- insert/update:  user_id = auth.uid()  AND  posse do pai
```

> ⚠️ **Por que a segunda checagem existe.** Com só `user_id = auth.uid()`, um usuário
> que descubra um `protocol_id` alheio consegue injetar registros no acompanhamento
> de outra família usando o próprio `user_id` — a FK não verifica dono. Isso foi
> reproduzido em Postgres durante a reconciliação. As funções `owns_child`,
> `owns_protocol`, `owns_exposure` e `owns_symptom_event` fecham o buraco.

| Tabela | Checagem de posse do pai |
|---|---|
| `children` | — (raiz) |
| `protocols` | `owns_child(child_id)` |
| `stage_history`, `exposures`, `diaper_records`, `notes` | `owns_protocol(protocol_id)` |
| `symptom_events` | `owns_protocol(protocol_id)` + `owns_exposure(exposure_id)` |
| `symptom_event_items` | `owns_symptom_event(symptom_event_id)` |

## Teste de RLS (obrigatório no M1)

Executado e aprovado contra Postgres 16 na reconciliação. Refazer no projeto real:

- [x] `rowsecurity = true` nas 9 tabelas
- [x] B faz `select` em cada tabela → **0 linhas** de A
- [x] B faz `update`/`delete` em linha de A → **0 linhas afetadas**
- [x] B insere com `user_id` de A → **erro de policy**
- [x] B insere no `protocol_id` de A com o próprio `user_id` → **erro de policy**
- [x] B cria protocolo apontando para `child_id` de A → **erro de policy**
- [x] B insere item no `symptom_event_id` de A → **erro de policy**
- [x] Signup cria linha em `profiles` automaticamente

## Tipos

- `types/database.ts` — **gerado**, commitado, nunca editado à mão
- `types/domain.ts` — tipos de UI derivados (`Child`, `Protocol`, `Exposure`, `TimelineEvent`, ...)
- `types/index.ts` — barrel

Services convertem `database` → `domain`. A UI só conhece `domain`.

## Catálogos (`src/constants/`)

### `stages.ts` — escada do leite, 5 etapas

| # | Etapa |
|---|---|
| 1 | Preparação assada |
| 2 | Derivado aquecido |
| 3 | Queijo |
| 4 | Iogurte |
| 5 | Leite |

**Sem regra automática de avanço.** Quem decide é a equipe assistente; o app só registra.

### `symptoms.ts` — 21 sintomas em 4 categorias

| Categoria | Sintomas |
|---|---|
| Gastrointestinais / Fezes | Muco nas fezes · Sangue nas fezes · Diarreia · Mais evacuações que o habitual · Constipação · Regurgitação · Vômito · Distensão abdominal · Desconforto aparente · Recusa da mamada |
| Pele | Dermatite / eczema · Vermelhidão · Urticária · Inchaço |
| Respiratórios / Estado geral | Tosse / chiado · Dificuldade para respirar · Irritabilidade diferente do habitual · Choro intenso · Palidez importante · Sonolência / prostração |
| Outros | Outro |

Sinais de alarme (`alarm: true`) exibem `SafetyAlert` orientando **procurar o
profissional de saúde** — orientação de cuidado, nunca diagnóstico nem gravidade.

### `feeding.ts` — alimentação atual da criança

Catálogo de chips do onboarding (M3). Gravado como texto em `children.feeding`.

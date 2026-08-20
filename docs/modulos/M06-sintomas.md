# M6 — Sintomas rápidos (e "sem sintomas")

**Objetivo:** o registro mais importante do produto — rápido e sem julgamento.
**Estimativa:** 0,5–1 dia · **Depende de:** M5

> **Evitar formulário tradicional.** Lista visual, intensidade por toque.

## Mensagem fixa no topo da tela

> Registre apenas o que realmente observar. Não é necessário procurar sintomas.

## Interação

Sintomas agrupados nas 4 categorias de `constants/symptoms.ts`. Cada linha:

```
Muco nas fezes
[ Leve ] [ Moderada ] [ Intensa ]
```

Tocar uma intensidade **seleciona o sintoma e registra a intensidade** no mesmo gesto.
A usuária pode marcar quantos sintomas quiser. Observação continua opcional.

Nunca usar manhã/tarde/noite como dado principal — sempre horário real.

## SEM SINTOMAS

Botão separado, também acessível direto da Home. Grava:
`no_symptoms = true` + horário + etapa. Sem itens.

## Vínculo com exposição

Opcional (`exposure_id`). Quando existe, a UI calcula e exibe:

```
symptom.occurred_at − exposure.occurred_at   →   "8h40 após exposição"
```

**Nunca exibir causalidade.** O app mostra o intervalo; a interpretação é do
profissional de saúde.

## Sinais de alarme

Sintomas com `alarm: true` exibem `SafetyAlert` orientando procurar o profissional
de saúde. Orientação de cuidado — não é diagnóstico, gravidade nem conduta.

## Critério de aceite

- [ ] **Home → Sintomas → Muco → Leve → Salvar em poucos segundos**
- [ ] Múltiplos sintomas no mesmo evento
- [ ] `SEM SINTOMAS` grava `no_symptoms = true` sem itens
- [ ] `occurred_at` automático e editável
- [ ] Intervalo exibido quando há vínculo com exposição
- [ ] Nenhum texto do app sugere causa, diagnóstico ou conduta
- [ ] Salvar → refresh → logout/login → registro permanece

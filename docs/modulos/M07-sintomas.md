# M7 — Registro de Sintomas (e "sem sintomas")

**Objetivo:** o registro mais importante do produto — rápido e sem julgamento.
**Estimativa:** 1 dia · **Depende de:** M6

## Escopo

- `constants/symptoms.ts` — lista de `../03-modelo-de-dados.md`
- `utils/symptomCodes.ts` — `codeToLabel`, `groupByCategory`
- `schemas/symptom.schema.ts` — `occurredAt`, `hasSymptoms`, `items[] {code, intensity?}`,
  `note?`, `exposureId?`. Se `hasSymptoms === true`, exige ≥1 item.
- `services/symptom.service.ts` — `create` (evento + itens), `listByProtocol` (com itens),
  `update`, `remove`
- `molecules/SymptomChip` — chip selecionável com rótulo e, quando ativo, intensidade 1–3
- `organisms/SymptomForm`:
  - botão grande e primário **"Sem sintomas"** → cria evento com `has_symptoms = false` em 1 toque
  - grade de chips agrupados por categoria (pele, digestivo, respiratório, geral)
  - vínculo opcional com a exposição mais recente (últimas 48h) via select
  - data/hora + observação
- Chips de alarme (`blood_stool`, `wheezing`) disparam `SafetyAlert`:
  _"Sinais como este merecem contato com o profissional que acompanha vocês."_ — sem diagnóstico.

## Regras

- "Sem sintomas" é o caminho de menor esforço: 1 toque, sem abrir formulário
- Evento e itens salvos juntos; se os itens falharem, o evento é removido para não ficar órfão
  (ou usar RPC transacional — decidir na implementação e registrar aqui)
- Nunca inferir causa, nem correlacionar automaticamente sintoma com exposição

## Critério de aceite

- [ ] "Sem sintomas" grava evento com `has_symptoms=false` e zero itens
- [ ] Sintoma com 3 itens grava 1 `symptom_events` + 3 `symptom_items`
- [ ] Selecionar sintoma sem escolher nenhum item bloqueia o envio
- [ ] `SafetyAlert` aparece nos códigos de alarme e é claramente não diagnóstico
- [ ] Registro completo leva ≤4 toques no caminho comum

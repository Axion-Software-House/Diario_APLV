# M8 — Fralda e observações

**Objetivo:** completar os tipos de registro do diário.
**Estimativa:** 0,5 dia · **Depende de:** M7

## Fralda — três seletores por toque

```
Sangue:
[ Não ]  [ Traços ]  [ Visível ]

Muco:
[ Não ]  [ Pouco ]  [ Moderado ]  [ Muito ]

Consistência:
[ Habitual ]  [ Líquida ]  [ Pastosa ]  [ Ressecada ]  [ Não sei ]
```

Mais horário automático e observação opcional. **Foto não é obrigatória no MVP.**

## Observação

Anotação livre com horário automático. É o item 4 da lista de cortes de escopo —
se o prazo apertar, sai e a fralda fica.

## Escopo adicional

Incluir `diaper_records` e `notes` na timeline do M7.

## Critério de aceite

- [ ] Fralda salva com os três seletores e aparece na timeline
- [ ] Observação salva e aparece na timeline
- [ ] `occurred_at` automático e editável nos dois
- [ ] Zero digitação obrigatória no registro de fralda
- [ ] Salvar → refresh → logout/login → registros permanecem

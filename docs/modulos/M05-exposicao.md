# M5 — Registro de Exposição

**Objetivo:** registrar o que foi consumido, em poucos toques.
**Estimativa:** 0,5 dia · **Depende de:** M4

## Fluxo

```
Home → Exposição → preencher → Salvar → volta com confirmação
```

## Campos

| Campo | Tipo | Obrigatório |
|---|---|---|
| alimento | texto livre | sim |
| quantidade | chips | não |
| data/hora | automática, editável | sim |
| observação | texto livre | não |

Quantidade (enum `exposure_amount`):

```
[ Pequena ]  [ Habitual ]  [ Maior que o habitual ]  [ Não sei ]
```

`stage` é gravado a partir do acompanhamento ativo — não é campo de formulário.

## Critério de aceite

- [ ] Salvar → confirmação → refresh → logout/login → **registro permanece**
- [x] `occurred_at` vem preenchido com a hora atual e pode ser editado
- [x] Botão desabilitado durante `saving`; dois cliques não duplicam
- [x] Erro de rede **preserva** o que foi digitado
- [x] Formulário só limpa depois do sucesso confirmado

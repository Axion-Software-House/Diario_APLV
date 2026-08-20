# M10 — Relatório e Impressão

**Objetivo:** a saída do produto — um documento que a família leva para a consulta.
**Estimativa:** 0,5–1 dia · **Depende de:** M9

## Conteúdo

- criança
- alimentação
- período
- motivo
- profissional
- exposições
- sintomas
- sem sintomas
- fraldas
- resumo por etapa
- temporalidade
- timeline completa

## Tabela de temporalidade

| Data/hora | Sintoma | Intensidade | Intervalo |
|---|---|---|---|

Intervalo = `symptom.occurred_at − exposure.occurred_at`, apresentado como tempo
decorrido. **Nunca como causa.**

## Aviso obrigatório

> Este relatório organiza os dados registrados pela família. Ele não estabelece
> diagnóstico de APLV e deve ser interpretado pelo profissional de saúde responsável.

## Impressão

`window.print()` + `@media print`. Sem biblioteca de PDF no MVP.

## Critério de aceite

- [ ] Relatório abre com todas as 12 seções
- [ ] Resumo por etapa usa o `stage` gravado em cada evento
- [ ] Tabela de temporalidade correta
- [ ] Aviso visível na tela **e** no papel
- [ ] Impressão limpa: sem menu, sem botões, sem corte de tabela
- [ ] Nenhuma conclusão, classificação ou recomendação em nenhum trecho

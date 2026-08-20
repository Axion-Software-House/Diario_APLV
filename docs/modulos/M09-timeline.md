# M9 — Timeline

**Objetivo:** transformar registros soltos em uma leitura cronológica clara.
**Estimativa:** 1 dia · **Depende de:** M6, M7, M8

## Escopo

- `utils/timeline.ts` — normaliza linhas da view em `TimelineEvent`
  (`{ id, kind, occurredAt, title, detail?, icon, tone }`) e agrupa por dia
- `services/report.service.ts` (parte 1) — `getTimeline(protocolId, { from, to, kinds })`
- `hooks/useTimeline.ts` — lista, filtros, recarregar
- `molecules/TimelineItem` — hora, ícone por tipo, título, detalhe, menu de ações
- `organisms/Timeline` — agrupamento por dia ("Hoje", "Ontem", `dd 'de' MMMM`), filtro por
  tipo, `EmptyState`, paginação simples ("Carregar mais", 30 por página)
- Editar e excluir a partir do item: abre o form correspondente pré-preenchido;
  excluir pede confirmação em modal
- Timeline recente (últimos 5) na coluna direita do `ProtocolTemplate`

## Regras

- Ordem decrescente por `occurred_at`
- Excluir `symptom_events` remove os itens em cascata (já garantido no schema)
- Editar reaproveita os organisms dos módulos 6–8 em modo `edit` — não duplicar formulário

## Critério de aceite

- [ ] Um registro de cada tipo aparece na ordem correta, agrupado por dia
- [ ] Filtro por tipo funciona e é limpável
- [ ] Excluir pede confirmação, remove do banco e some da lista
- [ ] Editar salva e reflete imediatamente
- [ ] 100+ eventos ainda rolam sem travar no celular

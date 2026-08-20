# M11 — Relatório e Impressão

**Objetivo:** a saída do produto: um documento que a mãe leva para a consulta.
**Estimativa:** 1 dia · **Depende de:** M10

## Escopo

- `services/report.service.ts` — `getReportData(protocolId, { from, to })` retornando
  criança, protocolo, etapas percorridas, totais por tipo, sintomas mais frequentes,
  temporalidade (tempo entre exposição e sintoma vinculado) e timeline completa
- `utils/report.ts` — agregações puras e testáveis (sem chamada de rede)
- `templates/ReportTemplate` — layout de leitura, `max-width` confortável
- `organisms/ReportSummary` — cabeçalho, período, resumo, etapas, sintomas, fraldas, timeline
- `pages/Report` (`/app/report/:protocolId`) — seletor de período (tudo / etapa atual / 30 dias)
  e botão "Imprimir ou salvar em PDF" → `window.print()`
- CSS `@media print`:
  - esconde header, menu, botões, filtros (`[data-print="hide"]`)
  - fundo branco, texto preto, sem sombra
  - `page-break-inside: avoid` em cada bloco e item da timeline
  - cabeçalho com nome da criança, período e data de emissão
- Aviso clínico no rodapé do relatório (tela e impressão)

## Regras

- O relatório **descreve**: contagens, datas, sequências. Não conclui, não correlaciona
  causalidade, não sugere conduta.
- "Temporalidade" = intervalo registrado entre exposição vinculada e sintoma. Apresentar
  como fato observado, jamais como prova de relação.

## Critério de aceite

- [ ] Relatório abre com dados reais de um protocolo com ≥10 registros
- [ ] `Ctrl+P` / preview de impressão sai limpo, sem navegação nem botões
- [ ] Nenhum bloco cortado no meio entre páginas
- [ ] Aviso clínico presente na versão impressa
- [ ] Protocolo vazio mostra `EmptyState` em vez de relatório quebrado
- [ ] Legível em 375px e em 1440px

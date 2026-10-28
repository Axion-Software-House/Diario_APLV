import { useMemo } from 'react'
import { BarList } from '@/components/molecules/charts/BarList'
import { TypeSummary, TypeSummaryBlock, TypeSummaryList } from '@/components/organisms/TypeSummary'
import { EMOJI } from '@/constants/emojis'
import { useDiary } from '@/hooks/useDiary'
import { formatDateTime } from '@/utils/dates'
import { summarizeSymptoms } from '@/utils/typeSummary'

const UNIT = { one: 'registro de sintoma', many: 'registros de sintoma' }

const timesLabel = (value: number) => (value === 1 ? '1 vez' : `${value} vezes`)

/**
 * Resumo da tela de Sintomas. Só sintomas: o vínculo com alimentação,
 * visita ou produto não aparece aqui — no Diário ele é mostrado apenas como
 * "registrado depois de...", e o resumo não aproxima um registro do outro.
 */
export function SymptomSummary() {
  const { sources, loading, errorMessage, refresh } = useDiary()
  const summary = useMemo(
    () => (loading || errorMessage ? null : summarizeSymptoms(sources)),
    [sources, loading, errorMessage],
  )

  return (
    <TypeSummary
      title="Resumo de sintomas"
      emoji={EMOJI.symptom}
      diaryFilter="symptoms"
      unit={UNIT}
      stripTitle="Registros de sintoma por dia, últimos 7 dias"
      emptyText="Nenhum sintoma registrado até agora."
      loading={loading}
      errorMessage={errorMessage}
      onRetry={refresh}
      summary={summary}
    >
      {summary && summary.counts.last7 > 0 && (
        <TypeSummaryBlock title="Últimos 7 dias">
          <BarList
            title="Sintomas mais registrados"
            items={summary.topSymptoms}
            formatValue={timesLabel}
          />
          <BarList title="Por intensidade" items={summary.intensity} formatValue={timesLabel} />
        </TypeSummaryBlock>
      )}

      {summary && summary.evolutions.length > 0 && (
        <TypeSummaryBlock title="Evolução dos episódios">
          <TypeSummaryList
            timePrefix="Início do episódio:"
            items={summary.evolutions.map((episode) => ({
              id: episode.id,
              occurredAt: episode.startedAt,
              title: `${episode.status} em ${formatDateTime(episode.statusAt)}`,
              detail: episode.title,
            }))}
          />
        </TypeSummaryBlock>
      )}
    </TypeSummary>
  )
}

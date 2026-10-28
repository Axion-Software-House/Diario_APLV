import { useMemo } from 'react'
import { BarList } from '@/components/molecules/charts/BarList'
import { TypeSummary, TypeSummaryBlock, TypeSummaryList } from '@/components/organisms/TypeSummary'
import { EMOJI } from '@/constants/emojis'
import { useDiary } from '@/hooks/useDiary'
import { summarizeEnvironments } from '@/utils/typeSummary'

const UNIT = { one: 'visita', many: 'visitas' }

/** Resumo da tela de Ambiente / Visita: as últimas e os lugares mais registrados. */
export function EnvironmentSummary() {
  const { sources, loading, errorMessage, refresh } = useDiary()
  const summary = useMemo(
    () => (loading || errorMessage ? null : summarizeEnvironments(sources)),
    [sources, loading, errorMessage],
  )

  return (
    <TypeSummary
      title="Resumo de ambientes"
      emoji={EMOJI.environment}
      diaryFilter="environments"
      unit={UNIT}
      stripTitle="Visitas por dia, últimos 7 dias"
      emptyText="Nenhum ambiente registrado ainda. O resumo aparece aqui a partir do primeiro registro."
      loading={loading}
      errorMessage={errorMessage}
      onRetry={refresh}
      summary={summary}
      showLatest={false}
    >
      {summary && summary.recent.length > 0 && (
        <TypeSummaryBlock title="Últimos registrados">
          <TypeSummaryList items={summary.recent} />
        </TypeSummaryBlock>
      )}
      {summary && summary.top.length > 0 && (
        <TypeSummaryBlock title="Desde o início">
          <BarList
            title="Lugares mais registrados"
            items={summary.top}
            formatValue={(value) => (value === 1 ? '1 vez' : `${value} vezes`)}
          />
        </TypeSummaryBlock>
      )}
    </TypeSummary>
  )
}

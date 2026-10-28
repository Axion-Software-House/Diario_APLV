import { useMemo } from 'react'
import { BarList } from '@/components/molecules/charts/BarList'
import { StackedBar } from '@/components/molecules/charts/StackedBar'
import { TypeSummary, TypeSummaryBlock } from '@/components/organisms/TypeSummary'
import { EMOJI } from '@/constants/emojis'
import { useDiary } from '@/hooks/useDiary'
import { summarizeExposures } from '@/utils/typeSummary'

const UNIT = { one: 'alimentação', many: 'alimentações' }

/**
 * Resumo da tela de Alimentação. Só alimentação: nada aqui olha para
 * sintomas, para nunca sugerir relação entre o que foi comido e o que
 * apareceu depois.
 */
export function ExposureSummary() {
  const { sources, loading, errorMessage, refresh } = useDiary()
  const summary = useMemo(
    () => (loading || errorMessage ? null : summarizeExposures(sources)),
    [sources, loading, errorMessage],
  )

  return (
    <TypeSummary
      title="Resumo de alimentação"
      emoji={EMOJI.food}
      diaryFilter="food"
      unit={UNIT}
      stripTitle="Alimentação por dia, últimos 7 dias"
      emptyText="Nenhuma alimentação registrada ainda. O resumo aparece aqui a partir do primeiro registro."
      loading={loading}
      errorMessage={errorMessage}
      onRetry={refresh}
      summary={summary}
    >
      {summary && summary.counts.last7 > 0 && (
        <TypeSummaryBlock title="Últimos 7 dias">
          <StackedBar title="Leite ou derivados" parts={summary.dairy} unit={UNIT} />
          <BarList
            title="Alimentos mais registrados"
            items={summary.topFoods}
            formatValue={(value) => (value === 1 ? '1 vez' : `${value} vezes`)}
          />
        </TypeSummaryBlock>
      )}
    </TypeSummary>
  )
}

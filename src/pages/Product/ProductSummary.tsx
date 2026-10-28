import { useMemo } from 'react'
import { BarList } from '@/components/molecules/charts/BarList'
import { TypeSummary, TypeSummaryBlock, TypeSummaryList } from '@/components/organisms/TypeSummary'
import { EMOJI } from '@/constants/emojis'
import { useDiary } from '@/hooks/useDiary'
import { summarizeProducts } from '@/utils/typeSummary'

const UNIT = { one: 'produto', many: 'produtos' }

/** Resumo da tela de Produto / Higiene: os últimos e as categorias mais registradas. */
export function ProductSummary() {
  const { sources, loading, errorMessage, refresh } = useDiary()
  const summary = useMemo(
    () => (loading || errorMessage ? null : summarizeProducts(sources)),
    [sources, loading, errorMessage],
  )

  return (
    <TypeSummary
      title="Resumo de produtos"
      emoji={EMOJI.product}
      diaryFilter="products"
      unit={UNIT}
      stripTitle="Produtos por dia, últimos 7 dias"
      emptyText="Nenhum produto registrado ainda. O resumo aparece aqui a partir do primeiro registro."
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
            title="Categorias mais registradas"
            items={summary.top}
            formatValue={(value) => (value === 1 ? '1 vez' : `${value} vezes`)}
          />
        </TypeSummaryBlock>
      )}
    </TypeSummary>
  )
}

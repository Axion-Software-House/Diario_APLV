import { useMemo } from 'react'
import { TypeSummary, TypeSummaryBlock, TypeSummaryList } from '@/components/organisms/TypeSummary'
import { EMOJI } from '@/constants/emojis'
import { useDiary } from '@/hooks/useDiary'
import { summarizeNotes } from '@/utils/typeSummary'

const UNIT = { one: 'observação', many: 'observações' }

/** Resumo da tela de Observação: quantas e as últimas, com o texto cortado. */
export function NoteSummary() {
  const { sources, loading, errorMessage, refresh } = useDiary()
  const summary = useMemo(
    () => (loading || errorMessage ? null : summarizeNotes(sources)),
    [sources, loading, errorMessage],
  )

  return (
    <TypeSummary
      title="Resumo de observações"
      emoji={EMOJI.note}
      diaryFilter="notes"
      unit={UNIT}
      stripTitle="Observações por dia, últimos 7 dias"
      emptyText="Nenhuma observação registrada ainda. O resumo aparece aqui a partir da primeira."
      loading={loading}
      errorMessage={errorMessage}
      onRetry={refresh}
      summary={summary}
      showLatest={false}
    >
      {summary && summary.recent.length > 0 && (
        <TypeSummaryBlock title="Últimas observações">
          <TypeSummaryList items={summary.recent} />
        </TypeSummaryBlock>
      )}
    </TypeSummary>
  )
}

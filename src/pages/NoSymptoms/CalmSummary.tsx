import { useMemo } from 'react'
import {
  TypeSummary,
  TypeSummaryBlock,
  TypeSummaryCounts,
} from '@/components/organisms/TypeSummary'
import { EMOJI } from '@/constants/emojis'
import { useDiary } from '@/hooks/useDiary'
import { summarizeCalm } from '@/utils/typeSummary'

const UNIT = { one: 'registro de tudo tranquilo', many: 'registros de tudo tranquilo' }

/** Resumo da tela "Tudo tranquilo": quantos registros e em quantos dias. */
export function CalmSummary() {
  const { sources, loading, errorMessage, refresh } = useDiary()
  const summary = useMemo(
    () => (loading || errorMessage ? null : summarizeCalm(sources)),
    [sources, loading, errorMessage],
  )

  return (
    <TypeSummary
      title="Resumo de tudo tranquilo"
      emoji={EMOJI.calm}
      diaryFilter="calm"
      unit={UNIT}
      stripTitle="Registros por dia, últimos 14 dias"
      emptyText="Nenhum registro de tudo tranquilo até agora."
      loading={loading}
      errorMessage={errorMessage}
      onRetry={refresh}
      summary={summary}
    >
      {summary && (
        <TypeSummaryBlock title="Dias com registro">
          <TypeSummaryCounts
            items={[
              { label: 'Últimos 7 dias', value: `${summary.daysIn7} de 7` },
              { label: 'Últimos 14 dias', value: `${summary.daysIn14} de 14` },
            ]}
          />
        </TypeSummaryBlock>
      )}
    </TypeSummary>
  )
}

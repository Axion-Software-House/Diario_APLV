import { useMemo } from 'react'
import { StackedBar } from '@/components/molecules/charts/StackedBar'
import {
  TypeSummary,
  TypeSummaryBlock,
  TypeSummaryCounts,
} from '@/components/organisms/TypeSummary'
import { EMOJI } from '@/constants/emojis'
import { useDiary } from '@/hooks/useDiary'
import { summarizeDiapers } from '@/utils/typeSummary'

const UNIT = { one: 'fralda', many: 'fraldas' }

/**
 * Resumo da tela de Fralda. Sangue e muco entram só como contagem do que
 * foi marcado: sem alerta e sem texto de orientação, que dependem de
 * validação clínica (ver a pendência em constants/diaper.ts).
 */
export function DiaperSummary() {
  const { sources, loading, errorMessage, refresh } = useDiary()
  const summary = useMemo(
    () => (loading || errorMessage ? null : summarizeDiapers(sources)),
    [sources, loading, errorMessage],
  )

  return (
    <TypeSummary
      title="Resumo de fraldas"
      emoji={EMOJI.diaper}
      diaryFilter="diapers"
      unit={UNIT}
      stripTitle="Fraldas por dia, últimos 7 dias"
      emptyText="Nenhuma fralda registrada ainda. O resumo aparece aqui a partir do primeiro registro."
      loading={loading}
      errorMessage={errorMessage}
      onRetry={refresh}
      summary={summary}
    >
      {summary && summary.counts.last7 > 0 && (
        <TypeSummaryBlock title="Últimos 7 dias">
          <StackedBar title="Consistência" parts={summary.consistency} unit={UNIT} />
          <TypeSummaryCounts
            items={[
              { label: 'Com sangue marcado', value: summary.withBlood },
              { label: 'Com muco marcado', value: summary.withMucus },
            ]}
          />
        </TypeSummaryBlock>
      )}
    </TypeSummary>
  )
}

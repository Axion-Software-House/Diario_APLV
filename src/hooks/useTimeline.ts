import { useMemo } from 'react'
import { useDiary } from '@/hooks/useDiary'
import { buildTimeline } from '@/utils/timeline'
import type { TimelineSources } from '@/utils/timeline'
import type { TimelineEvent } from '@/types'

/** A união das origens do diário, já ordenada por `occurred_at` decrescente. */
export function useTimeline(): {
  events: TimelineEvent[]
  sources: TimelineSources
  loading: boolean
  errorMessage?: string
  refresh: () => Promise<void>
} {
  const { sources, loading, errorMessage, refresh } = useDiary()
  const events = useMemo(() => buildTimeline(sources), [sources])

  return { events, sources, loading, errorMessage, refresh }
}

import { useMemo } from 'react'
import { useDiary } from '@/hooks/useDiary'
import { buildTimeline } from '@/utils/timeline'
import type { TimelineEvent } from '@/types'

/** A união das cinco origens, já ordenada por `occurred_at` decrescente. */
export function useTimeline(): {
  events: TimelineEvent[]
  loading: boolean
  errorMessage?: string
} {
  const { sources, loading, errorMessage } = useDiary()
  const events = useMemo(() => buildTimeline(sources), [sources])

  return { events, loading, errorMessage }
}

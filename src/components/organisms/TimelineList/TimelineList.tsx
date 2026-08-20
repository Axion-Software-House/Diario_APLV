import { TimelineItem } from '@/components/molecules/TimelineItem'
import { groupByDay } from '@/utils/timeline'
import { formatDayLabel } from '@/utils/dates'
import type { TimelineEvent } from '@/types'
import styles from './TimelineList.module.css'

type Props = { events: readonly TimelineEvent[] }

/** Agrupamento por dia acontece aqui, na renderização — não na consulta. */
export function TimelineList({ events }: Props) {
  return (
    <div className={styles.days}>
      {groupByDay(events).map((day) => (
        <section key={day.key} className={styles.day}>
          <h2 className={styles.dayLabel}>{formatDayLabel(day.key)}</h2>
          <ul className={styles.events}>
            {day.events.map((event) => (
              <TimelineItem key={`${event.kind}-${event.id}`} event={event} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

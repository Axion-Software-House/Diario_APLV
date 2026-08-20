import { AnimatedContent } from '@/components/animations/AnimatedContent'
import { TimelineItem } from '@/components/molecules/TimelineItem'
import { groupByDay } from '@/utils/timeline'
import { formatDayLabel } from '@/utils/dates'
import type { TimelineEvent } from '@/types'
import styles from './TimelineList.module.css'

type Props = { events: readonly TimelineEvent[] }

/** Agrupamento por dia acontece aqui, na renderização — não na consulta. */
export function TimelineList({ events }: Props) {
  // O escalonamento conta o evento na timeline inteira, não dentro do dia:
  // reiniciar por grupo faria o segundo dia entrar tão rápido quanto o
  // primeiro, e a leitura perderia o sentido de descida.
  let position = 0

  return (
    <div className={styles.days}>
      {groupByDay(events).map((day) => (
        <section key={day.key} className={styles.day}>
          <h2 className={styles.dayLabel}>{formatDayLabel(day.key)}</h2>
          <ul className={styles.events}>
            {day.events.map((event) => (
              <AnimatedContent key={`${event.kind}-${event.id}`} as="li" index={position++}>
                <TimelineItem event={event} />
              </AnimatedContent>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

import { AnimatedContent } from '@/components/animations/AnimatedContent'
import { TimelineItem } from '@/components/molecules/TimelineItem'
import { groupByDay } from '@/utils/timeline'
import { formatDayLabel } from '@/utils/dates'
import type { TimelineEvent } from '@/types'
import styles from './TimelineList.module.css'

type Props = {
  events: readonly TimelineEvent[]
  onEdit?: (event: TimelineEvent) => void
  onDelete?: (event: TimelineEvent) => void
  /** Força exibição de data absoluta em vez de "Hoje" / "Ontem" (ex.: no relatório). */
  absoluteDates?: boolean
  /** Cabeçalho do dia preso ao topo ao rolar (Diário). */
  stickyDays?: boolean
  /**
   * `id` do cabeçalho de cada dia (chave yyyy-MM-dd) — o calendário do Diário
   * rola até ele e move o foco para lá.
   */
  dayId?: (key: string) => string
}

function countLabel(count: number): string {
  return count === 1 ? '1 registro' : `${count} registros`
}

/** Agrupamento por dia acontece aqui, na renderização — não na consulta. */
export function TimelineList({
  events,
  onEdit,
  onDelete,
  absoluteDates = false,
  stickyDays = false,
  dayId,
}: Props) {
  // O escalonamento conta o evento na timeline inteira, não dentro do dia:
  // reiniciar por grupo faria o segundo dia entrar tão rápido quanto o
  // primeiro, e a leitura perderia o sentido de descida.
  let position = 0

  return (
    <div className={styles.days}>
      {groupByDay(events).map((day) => (
        <section key={day.key} className={styles.day}>
          <h2
            id={dayId?.(day.key)}
            tabIndex={dayId ? -1 : undefined}
            className={[styles.dayLabel, stickyDays && styles.sticky].filter(Boolean).join(' ')}
          >
            <span className={styles.dayName}>
              {absoluteDates ? (
                formatDayLabel(day.key, { absolute: true })
              ) : (
                <>
                  <span className={styles.relativeLabel}>{formatDayLabel(day.key)}</span>
                  <span className={styles.absoluteLabel}>
                    {formatDayLabel(day.key, { absolute: true })}
                  </span>
                </>
              )}
            </span>
            {!absoluteDates && (
              <span className={styles.dayCount}>
                <span className={styles.srOnly}>, </span>
                {countLabel(day.events.length)}
              </span>
            )}
          </h2>
          <ul className={styles.events}>
            {day.events.map((event) => (
              <AnimatedContent key={`${event.kind}-${event.id}`} as="li" index={position++}>
                <TimelineItem event={event} onEdit={onEdit} onDelete={onDelete} />
              </AnimatedContent>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

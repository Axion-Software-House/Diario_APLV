import { useId, useState } from 'react'
import { addMonths, format, getDaysInMonth, startOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { toDateValue } from '@/utils/dates'
import styles from './MiniCalendar.module.css'

type Props = {
  /** Registros por dia (chave local yyyy-MM-dd). Dias sem chave não têm registro. */
  counts: ReadonlyMap<string, number>
  /** Toque num dia com registro. */
  onSelectDay: (key: string) => void
  /** Mês aberto de início; padrão: o mês de hoje. */
  initialMonth?: Date
  /** Hoje — injetável para teste. */
  today?: Date
}

const WEEKDAYS = [
  { short: 'D', full: 'domingo' },
  { short: 'S', full: 'segunda-feira' },
  { short: 'T', full: 'terça-feira' },
  { short: 'Q', full: 'quarta-feira' },
  { short: 'Q', full: 'quinta-feira' },
  { short: 'S', full: 'sexta-feira' },
  { short: 'S', full: 'sábado' },
]

function monthKey(date: Date): string {
  return format(date, 'yyyy-MM')
}

/** Semanas do mês, de domingo a sábado; `null` = casa fora do mês. */
function weeksOf(month: Date): (Date | null)[][] {
  const first = startOfMonth(month)
  const cells: (Date | null)[] = Array.from({ length: first.getDay() }, () => null)
  const total = getDaysInMonth(month)
  for (let day = 1; day <= total; day++) {
    cells.push(new Date(first.getFullYear(), first.getMonth(), day))
  }
  while (cells.length % 7 !== 0) cells.push(null)
  const weeks: (Date | null)[][] = []
  for (let index = 0; index < cells.length; index += 7) weeks.push(cells.slice(index, index + 7))
  return weeks
}

function countLabel(count: number): string {
  return count === 1 ? '1 registro' : `${count} registros`
}

/**
 * Calendário do mês com um ponto nos dias que têm registro. Tocar num dia
 * leva a lista do Diário até ele. É navegação, não dado novo: a contagem do
 * dia está no nome do botão ("28/10, 5 registros") e na própria lista.
 *
 * A navegação entre meses vai do mês do registro mais antigo ao mais recente
 * (ou até o mês de hoje).
 */
export function MiniCalendar({ counts, onSelectDay, initialMonth, today = new Date() }: Props) {
  const captionId = useId()
  const [month, setMonth] = useState(() => startOfMonth(initialMonth ?? today))

  const keys = [...counts.keys()].toSorted()
  const firstKey = keys[0]
  const lastKey = keys.at(-1)
  const minMonth = firstKey ? firstKey.slice(0, 7) : monthKey(today)
  const lastMonth = lastKey ? lastKey.slice(0, 7) : monthKey(today)
  const maxMonth = lastMonth > monthKey(today) ? lastMonth : monthKey(today)
  const current = monthKey(month)
  const todayKey = toDateValue(today)

  const monthTotal = keys
    .filter((key) => key.startsWith(current))
    .reduce((sum, key) => sum + (counts.get(key) ?? 0), 0)
  const monthDays = keys.filter((key) => key.startsWith(current)).length

  return (
    <div className={styles.calendar}>
      <div className={styles.nav}>
        <button
          type="button"
          className={styles.navButton}
          onClick={() => setMonth((value) => addMonths(value, -1))}
          disabled={current <= minMonth}
          aria-label="Mês anterior"
        >
          <ChevronLeft size={20} aria-hidden="true" />
        </button>
        <p id={captionId} className={styles.month} aria-live="polite">
          {format(month, "MMMM 'de' yyyy", { locale: ptBR })}
        </p>
        <button
          type="button"
          className={styles.navButton}
          onClick={() => setMonth((value) => addMonths(value, 1))}
          disabled={current >= maxMonth}
          aria-label="Próximo mês"
        >
          <ChevronRight size={20} aria-hidden="true" />
        </button>
      </div>

      <table className={styles.grid} aria-labelledby={captionId}>
        <thead>
          <tr>
            {WEEKDAYS.map((day) => (
              <th key={day.full} scope="col" abbr={day.full} className={styles.weekday}>
                {day.short}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeksOf(month).map((week, weekIndex) => (
            <tr key={weekIndex}>
              {week.map((date, dayIndex) => {
                if (!date) return <td key={dayIndex} className={styles.cell} />
                const key = toDateValue(date)
                const count = counts.get(key) ?? 0
                const isToday = key === todayKey
                return (
                  <td key={dayIndex} className={styles.cell}>
                    {count > 0 ? (
                      <button
                        type="button"
                        className={[styles.day, styles.withRecords, isToday && styles.today]
                          .filter(Boolean)
                          .join(' ')}
                        aria-label={`${format(date, 'dd/MM')}${isToday ? ', hoje' : ''}, ${countLabel(count)}`}
                        onClick={() => onSelectDay(key)}
                      >
                        <span aria-hidden="true">{date.getDate()}</span>
                        <span className={styles.dot} aria-hidden="true" />
                      </button>
                    ) : (
                      <span
                        className={[styles.day, isToday && styles.today].filter(Boolean).join(' ')}
                      >
                        {date.getDate()}
                      </span>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <p className={styles.legend}>
        <span className={styles.legendDot} aria-hidden="true" />
        {monthDays === 0
          ? 'Nenhum dia com registro neste mês.'
          : `${monthDays === 1 ? '1 dia' : `${monthDays} dias`} com registro · ${countLabel(monthTotal)}`}
      </p>
    </div>
  )
}

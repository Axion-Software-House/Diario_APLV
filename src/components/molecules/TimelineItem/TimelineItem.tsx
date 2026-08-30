import {
  CalendarClock,
  ClipboardList,
  HeartPulse,
  Layers,
  MapPin,
  Milk,
  NotebookPen,
  ShieldCheck,
  Sparkles,
  Stethoscope,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Badge } from '@/components/atoms/Badge'
import { Card } from '@/components/molecules/Card'
import { formatElapsedMinutes, formatTime } from '@/utils/dates'
import type { TimelineEvent, TimelineKind } from '@/types'
import styles from './TimelineItem.module.css'

/**
 * Um ícone e um rótulo por origem. O Record é exaustivo de propósito: um
 * `TimelineKind` novo (M8, M9) não compila até aparecer aqui.
 */
const KINDS: Record<TimelineKind, { icon: LucideIcon; label: string }> = {
  exposure: { icon: Milk, label: 'Alimentação' },
  symptom: { icon: Stethoscope, label: 'Sintomas' },
  no_symptoms: { icon: ShieldCheck, label: 'Tudo tranquilo' },
  diaper: { icon: ClipboardList, label: 'Fralda' },
  note: { icon: NotebookPen, label: 'Observação' },
  product: { icon: Sparkles, label: 'Produto / Higiene' },
  environment: { icon: MapPin, label: 'Ambiente / Visita' },
  health: { icon: HeartPulse, label: 'Saúde' },
  stage: { icon: Layers, label: 'Etapa' },
}

type Props = { event: TimelineEvent }

export function TimelineItem({ event }: Props) {
  const { icon: Icon, label } = KINDS[event.kind]
  const interval = event.minutesAfterExposure

  return (
    <Card className={[styles.item, styles[event.kind]].filter(Boolean).join(' ')}>
      <span className={styles.badge} aria-hidden="true">
        <Icon size={18} />
      </span>

      <div className={styles.body}>
        <p className={styles.meta}>
          <time dateTime={event.occurredAt}>{formatTime(event.occurredAt)}</time>
          <span className={styles.kind}>{label}</span>
          {event.stage != null && (
            <span className={styles.stage}>
              <Badge>Etapa {event.stage}</Badge>
            </span>
          )}
        </p>

        <p className={styles.title}>{event.title}</p>
        {event.detail && <p className={styles.detail}>{event.detail}</p>}

        {interval !== undefined && (
          <p className={styles.interval}>
            <CalendarClock size={14} aria-hidden="true" />
            {formatElapsedMinutes(interval)}
            {interval >= 0 ? ' após a exposição' : ' antes da exposição'}
          </p>
        )}
      </div>
    </Card>
  )
}

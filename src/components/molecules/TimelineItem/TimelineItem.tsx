import { useState } from 'react'
import {
  CalendarClock,
  ClipboardList,
  HeartPulse,
  Layers,
  MapPin,
  Milk,
  NotebookPen,
  Pencil,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Trash2,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Badge } from '@/components/atoms/Badge'
import { Card } from '@/components/molecules/Card'
import { formatElapsedMinutes, formatTime } from '@/utils/dates'
import type { TimelineEvent, TimelineKind } from '@/types'
import styles from './TimelineItem.module.css'

/**
 * Um ícone e um rótulo por origem. O Record é exaustivo de propósito: um
 * `TimelineKind` novo não compila até aparecer aqui.
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

type Props = {
  event: TimelineEvent
  /** Quando ausentes (relatório, resumo lateral), o item é só leitura. */
  onEdit?: (event: TimelineEvent) => void
  onDelete?: (event: TimelineEvent) => void
}

export function TimelineItem({ event, onEdit, onDelete }: Props) {
  const { icon: Icon, label } = KINDS[event.kind]
  const interval = event.minutesAfterExposure
  const [open, setOpen] = useState(false)

  // O histórico do TPO é imutável: nunca oferece editar nem excluir.
  const actionable = event.kind !== 'stage' && (onEdit || onDelete)

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
            {interval >= 0 ? ' após a alimentação' : ' antes da alimentação'}
          </p>
        )}

        {actionable && (
          <div className={styles.actions}>
            {!open ? (
              <button type="button" className={styles.toggle} onClick={() => setOpen(true)}>
                Ver opções
              </button>
            ) : (
              <>
                {onEdit && (
                  <button
                    type="button"
                    className={styles.action}
                    onClick={() => onEdit(event)}
                  >
                    <Pencil size={14} aria-hidden="true" />
                    Editar
                  </button>
                )}
                {onDelete && (
                  <button
                    type="button"
                    className={[styles.action, styles.danger].join(' ')}
                    onClick={() => onDelete(event)}
                  >
                    <Trash2 size={14} aria-hidden="true" />
                    Excluir
                  </button>
                )}
                <button type="button" className={styles.toggle} onClick={() => setOpen(false)}>
                  Fechar
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}

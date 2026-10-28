import { useId, useState } from 'react'
import { CalendarClock, Pencil, Trash2 } from 'lucide-react'
import { Badge } from '@/components/atoms/Badge'
import { Card } from '@/components/molecules/Card'
import { SYMPTOM_EVOLUTION_LABELS } from '@/constants/symptoms'
import { formatDateTime, formatElapsedMinutes, formatShortDateTime, formatTime } from '@/utils/dates'
import type { TimelineEvent, TimelineKind } from '@/types'
import styles from './TimelineItem.module.css'

/**
 * Um ícone e um rótulo por origem. O Record é exaustivo de propósito: um
 * `TimelineKind` novo não compila até aparecer aqui.
 */
const KINDS: Record<TimelineKind, { emoji: string; label: string }> = {
  exposure: { emoji: '🍽️', label: 'Alimentação' },
  symptom: { emoji: '🩺', label: 'Sintomas' },
  no_symptoms: { emoji: '🌿', label: 'Tudo tranquilo' },
  diaper: { emoji: '👶', label: 'Fralda' },
  note: { emoji: '📝', label: 'Observação' },
  product: { emoji: '🧴', label: 'Produto / Higiene' },
  environment: { emoji: '📍', label: 'Ambiente / Visita' },
  health: { emoji: '❤️‍🩹', label: 'Saúde' },
  stage: { emoji: '🪜', label: 'Etapa' },
}

function formatLinkLabel(event: TimelineEvent): string | null {
  if (event.linkedRecord) {
    const { kind, title, minutesAfter } = event.linkedRecord
    const elapsed = formatElapsedMinutes(minutesAfter)
    if (kind === 'environment') {
      return minutesAfter >= 0
        ? `Registrado depois da visita (${title} · ${elapsed})`
        : `${elapsed} antes da visita (${title})`
    }
    if (kind === 'product') {
      return minutesAfter >= 0
        ? `Registrado depois do produto (${title} · ${elapsed})`
        : `${elapsed} antes do produto (${title})`
    }
    return minutesAfter >= 0
      ? `${elapsed} após a alimentação (${title})`
      : `${elapsed} antes da alimentação (${title})`
  }

  if (event.minutesAfterExposure !== undefined) {
    return `${formatElapsedMinutes(event.minutesAfterExposure)}${
      event.minutesAfterExposure >= 0 ? ' após a alimentação' : ' antes da alimentação'
    }`
  }

  return null
}

type Props = {
  event: TimelineEvent
  /** Quando ausentes (relatório, resumo lateral), o item é só leitura. */
  onEdit?: (event: TimelineEvent) => void
  onDelete?: (event: TimelineEvent) => void
}

export function TimelineItem({ event, onEdit, onDelete }: Props) {
  const { emoji, label } = KINDS[event.kind]
  const linkLabel = formatLinkLabel(event)
  const [open, setOpen] = useState(false)
  const optionsId = useId()

  // O histórico do TPO é imutável: nunca oferece editar nem excluir.
  const actionable = event.kind !== 'stage' && (onEdit || onDelete)
  const when = formatShortDateTime(event.occurredAt)

  return (
    <Card className={[styles.item, styles[event.kind]].filter(Boolean).join(' ')}>
      <span className={styles.badge} aria-hidden="true">
        {emoji}
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

        {linkLabel && (
          <p className={styles.interval}>
            <CalendarClock size={14} aria-hidden="true" />
            {linkLabel}
          </p>
        )}

        {event.evolutions && event.evolutions.length > 0 && (
          <ol className={styles.evolutions} aria-label="Evolução do episódio">
            {event.evolutions.map((evolution) => (
              <li key={evolution.id} className={styles.evolutionItem}>
                <span className={styles.evolutionStatus}>
                  {SYMPTOM_EVOLUTION_LABELS.get(evolution.status) ?? evolution.status}
                </span>
                <time className={styles.evolutionTime} dateTime={evolution.occurred_at}>
                  {formatDateTime(evolution.occurred_at)}
                </time>
                {evolution.note && <span className={styles.evolutionNote}>{evolution.note}</span>}
              </li>
            ))}
          </ol>
        )}

        {actionable && (
          <div className={styles.actions}>
            {/* Um botão só, que não sai da tela: o foco fica nele ao abrir e ao
                fechar, e o leitor anuncia o aria-expanded. O nome acessível
                começa pelo texto visível (WCAG 2.5.3), para o comando de voz
                "Ver opções" ou "Fechar opções" encontrar o botão. */}
            <button
              type="button"
              className={styles.toggle}
              aria-expanded={open}
              aria-controls={optionsId}
              aria-label={`${open ? 'Fechar opções' : 'Ver opções'} do registro de ${label}, ${when}`}
              onClick={() => setOpen((current) => !current)}
            >
              {open ? 'Fechar opções' : 'Ver opções'}
            </button>
            <div
              id={optionsId}
              role="group"
              aria-label={`Opções do registro de ${label}, ${when}`}
              className={styles.options}
              hidden={!open}
            >
              {onEdit && (
                <button type="button" className={styles.action} onClick={() => onEdit(event)}>
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
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

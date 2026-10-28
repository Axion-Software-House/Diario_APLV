import { useCallback, useMemo, useState } from 'react'
import { CalendarDays, ChevronDown, Plus } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { AppTemplate } from '@/components/templates/AppTemplate'
import { Button } from '@/components/atoms/Button'
import { Chip } from '@/components/atoms/Chip'
import { Loading } from '@/components/atoms/Loading'
import { Alert } from '@/components/molecules/Alert'
import { DashboardCard } from '@/components/molecules/DashboardCard'
import { EmptyState } from '@/components/molecules/EmptyState'
import { MiniCalendar } from '@/components/molecules/MiniCalendar'
import { DiaryEntryModal } from '@/components/organisms/DiaryEntryModal'
import { NewRecordSheet } from '@/components/organisms/NewRecordSheet'
import { TimelineList } from '@/components/organisms/TimelineList'
import { DIARY_FILTERS } from '@/constants/diaryFilters'
import { EMOJI } from '@/constants/emojis'
import { formatLatestMeasures, latestMeasuresFrom } from '@/constants/health'
import { useRecentExposures } from '@/hooks/useRecentExposures'
import { useTimeline } from '@/hooks/useTimeline'
import { countEventsByDay } from '@/utils/dashboard'
import { formatDateTime, formatShortDate } from '@/utils/dates'
import type { TimelineEvent } from '@/types'
import styles from './Diario.module.css'

/**
 * Filtro com que o Diário abre: `location.state.filter` (o "Ver todas no
 * Diário" dos resumos das telas de registro) ou `?filtro=` na URL. Um id
 * desconhecido abre em "Tudo".
 */
function initialFilter(state: unknown, search: string): string {
  const fromState =
    state && typeof state === 'object' && 'filter' in state
      ? (state as { filter: unknown }).filter
      : null
  const requested =
    typeof fromState === 'string' ? fromState : new URLSearchParams(search).get('filtro')
  return DIARY_FILTERS.some((item) => item.id === requested) ? (requested as string) : 'all'
}

/** `id` do cabeçalho de cada dia na lista — o alvo do calendário. */
const dayId = (key: string) => `diario-dia-${key}`

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'

export default function Diario() {
  const { events, sources, loading, errorMessage, refresh } = useTimeline()
  const exposures = useRecentExposures()
  const location = useLocation()
  const [filterId, setFilterId] = useState(() => initialFilter(location.state, location.search))
  const [sheetOpen, setSheetOpen] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [modalTarget, setModalTarget] = useState<{
    entry: TimelineEvent
    mode: 'edit' | 'delete'
  } | null>(null)

  const active = DIARY_FILTERS.find((item) => item.id === filterId)
  const kinds = active?.kinds ?? null
  const visible = useMemo(
    () => (kinds ? events.filter((event) => kinds.includes(event.kind)) : events),
    [events, kinds],
  )
  // Uma consulta agendada para a semana que vem é registro, mas não é o
  // "último": o resumo considera só o que já aconteceu até a abertura da tela.
  const [openedAt] = useState(() => Date.now())
  const latest = useMemo(
    () => visible.find((event) => new Date(event.occurredAt).getTime() <= openedAt),
    [visible, openedAt],
  )
  const latestMeasures = useMemo(
    () => latestMeasuresFrom(sources.healthRecords),
    [sources.healthRecords],
  )
  const dayCounts = useMemo(() => countEventsByDay(visible), [visible])

  const goToDay = useCallback((key: string) => {
    const heading = document.getElementById(dayId(key))
    if (!heading) return
    const smooth = !window.matchMedia(REDUCED_MOTION).matches
    heading.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' })
    heading.focus({ preventScroll: true })
  }, [])

  const [retrying, setRetrying] = useState(false)
  async function retry() {
    setRetrying(true)
    try {
      await refresh()
    } finally {
      setRetrying(false)
    }
  }

  const ready = !loading && !errorMessage
  const hasEvents = ready && events.length > 0

  const actions = (
    <>
      <Link
        to="/app/relatorio"
        state={{ from: '/app/diario' }}
        className={styles.reportButton}
        aria-label="Ver relatório para a consulta"
      >
        <span aria-hidden="true" data-emoji>
          {EMOJI.report}
        </span>
        <span>Relatório</span>
      </Link>
      <Button className={styles.newButton} onClick={() => setSheetOpen(true)}>
        <Plus size={18} aria-hidden="true" className={styles.plus} />
        Novo registro
      </Button>
    </>
  )

  return (
    <AppTemplate
      title="Diário"
      subtitle="Tudo o que aconteceu, do mais recente."
      bottomNav
      headerAside={<div className={styles.headerActions}>{actions}</div>}
    >
      {/* No celular, as ações saem do cabeçalho (onde espremiam o título) e
          vêm para o topo do conteúdo. Só uma das duas cópias é exibida. */}
      <div className={styles.mobileActions}>{actions}</div>

      <div className={styles.layout}>
        <aside className={styles.aside} aria-label="Filtros e resumo do Diário">
          <div className={styles.filters} role="group" aria-label="Filtrar o diário">
            {DIARY_FILTERS.map((item) => (
              <Chip
                key={item.id}
                className={styles.filterChip}
                selected={item.id === filterId}
                onClick={() => setFilterId(item.id)}
              >
                {item.emoji && (
                  <span className={styles.filterEmoji} aria-hidden="true" data-emoji>
                    {item.emoji}
                  </span>
                )}
                <span>{item.label}</span>
              </Chip>
            ))}
          </div>

          {hasEvents && (
            <DashboardCard title="Resumo" className={styles.summary}>
              <dl className={styles.summaryList}>
                <div className={styles.summaryTotal}>
                  {/* O Diário não tem seletor de período: a conta é de tudo. */}
                  <dt>
                    {active && active.id !== 'all'
                      ? `${active.label} no total`
                      : 'Registros no total'}
                  </dt>
                  <dd>{visible.length === 1 ? '1 registro' : `${visible.length} registros`}</dd>
                </div>
                {latest && (
                  <div className={styles.summaryItem}>
                    <dt>Último registro</dt>
                    <dd>
                      <span className={styles.summaryTitle}>{latest.title}</span>
                      <time className={styles.summaryTime} dateTime={latest.occurredAt}>
                        {formatDateTime(latest.occurredAt)}
                      </time>
                    </dd>
                  </div>
                )}
                {latestMeasures && (
                  <div className={[styles.summaryItem, styles.summaryWide].join(' ')}>
                    <dt>
                      <span className={styles.inlineEmoji} aria-hidden="true" data-emoji>
                        {EMOJI.weight}
                      </span>
                      Últimas medidas
                    </dt>
                    <dd>{formatLatestMeasures(latestMeasures, formatShortDate)}</dd>
                  </div>
                )}
              </dl>
              {/* No celular o botão "Relatório" já está logo acima. */}
              <Link
                to="/app/relatorio"
                state={{ from: '/app/diario' }}
                className={[styles.textLink, styles.summaryLink].join(' ')}
              >
                Gerar relatório para consulta →
              </Link>
            </DashboardCard>
          )}

          {hasEvents && visible.length > 0 && (
            <section className={styles.calendarCard} aria-labelledby="diario-calendario">
              <h2 id="diario-calendario" className={styles.calendarHeading}>
                <button
                  type="button"
                  className={styles.calendarToggle}
                  aria-expanded={calendarOpen}
                  aria-controls="diario-calendario-mes"
                  onClick={() => setCalendarOpen((open) => !open)}
                >
                  <CalendarDays size={20} aria-hidden="true" />
                  <span>Calendário do mês</span>
                  <ChevronDown size={20} aria-hidden="true" className={styles.chevron} />
                </button>
                <span className={styles.calendarTitle}>Calendário do mês</span>
              </h2>
              <div
                id="diario-calendario-mes"
                className={styles.calendarBody}
                data-open={calendarOpen}
              >
                <MiniCalendar
                  // Recomeça no mês do último registro quando o filtro muda.
                  key={filterId}
                  counts={dayCounts}
                  onSelectDay={goToDay}
                  initialMonth={latest ? new Date(latest.occurredAt) : undefined}
                />
              </div>
            </section>
          )}
        </aside>

        <div className={styles.timeline}>
          {loading && <Loading label="Carregando os registros..." />}

          {!loading && errorMessage && (
            <div className={styles.error}>
              <Alert variant="error">{errorMessage}</Alert>
              <Button
                variant="secondary"
                busy={retrying}
                busyLabel="Carregando..."
                onClick={() => void retry()}
              >
                Tentar de novo
              </Button>
            </div>
          )}

          {ready && events.length === 0 && (
            <EmptyState emoji={EMOJI.diary} title="Nenhum registro ainda">
              Assim que você registrar uma alimentação, um sintoma, uma fralda ou uma observação,
              tudo aparece aqui em ordem. Toque em "Novo registro" para começar.
            </EmptyState>
          )}

          {hasEvents && visible.length === 0 && (
            <p className={styles.empty}>Nenhum registro deste tipo ainda.</p>
          )}

          {hasEvents && visible.length > 0 && (
            <TimelineList
              events={visible}
              stickyDays
              dayId={dayId}
              onEdit={(entry) => setModalTarget({ entry, mode: 'edit' })}
              onDelete={(entry) => setModalTarget({ entry, mode: 'delete' })}
            />
          )}
        </div>
      </div>

      <NewRecordSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />

      <DiaryEntryModal
        entry={modalTarget?.entry ?? null}
        mode={modalTarget?.mode ?? 'edit'}
        sources={sources}
        exposures={exposures}
        onClose={() => setModalTarget(null)}
        onSaved={() => void refresh()}
      />
    </AppTemplate>
  )
}

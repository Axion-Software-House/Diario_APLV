import { useMemo, useState } from 'react'
import { CalendarClock, Plus, Scale } from 'lucide-react'
import { AppTemplate } from '@/components/templates/AppTemplate'
import { Button } from '@/components/atoms/Button'
import { Chip } from '@/components/atoms/Chip'
import { Loading } from '@/components/atoms/Loading'
import { Alert } from '@/components/molecules/Alert'
import { Card } from '@/components/molecules/Card'
import { EmptyState } from '@/components/molecules/EmptyState'
import { DiaryEntryModal } from '@/components/organisms/DiaryEntryModal'
import { NewRecordSheet } from '@/components/organisms/NewRecordSheet'
import { TimelineList } from '@/components/organisms/TimelineList'
import { DIARY_FILTERS } from '@/constants/diaryFilters'
import { formatKg, latestWeightFrom } from '@/constants/health'
import { useRecentExposures } from '@/hooks/useRecentExposures'
import { useTimeline } from '@/hooks/useTimeline'
import { formatDateTime, formatShortDate } from '@/utils/dates'
import type { TimelineEvent } from '@/types'
import styles from './Diario.module.css'

export default function Diario() {
  const { events, sources, loading, errorMessage, refresh } = useTimeline()
  const exposures = useRecentExposures()
  const [filterId, setFilterId] = useState('all')
  const [sheetOpen, setSheetOpen] = useState(false)
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
  const latest = visible[0]
  const latestWeight = useMemo(
    () => latestWeightFrom(sources.healthRecords),
    [sources.healthRecords],
  )

  return (
    <AppTemplate
      title="Diário"
      subtitle="Tudo o que aconteceu, do mais recente."
      bottomNav
      headerAside={
        <Button variant="secondary" onClick={() => setSheetOpen(true)}>
          <Plus size={16} aria-hidden="true" className={styles.plus} />
          Novo registro
        </Button>
      }
    >
      {!loading && latestWeight && (
        <p className={styles.weight}>
          <Scale size={16} aria-hidden="true" className={styles.weightIcon} />
          <span>
            Último peso: {formatKg(latestWeight.kg)} em {formatShortDate(latestWeight.occurredAt)}
          </span>
        </p>
      )}

      <div className={styles.filters} role="group" aria-label="Filtrar o diário">
        {DIARY_FILTERS.map((item) => (
          <Chip key={item.id} selected={item.id === filterId} onClick={() => setFilterId(item.id)}>
            {item.label}
          </Chip>
        ))}
      </div>

      {loading && <Loading label="Carregando os registros..." />}

      {!loading && errorMessage && <Alert variant="error">{errorMessage}</Alert>}

      {!loading && !errorMessage && events.length === 0 && (
        <EmptyState icon={CalendarClock} title="Nenhum registro ainda">
          Assim que você registrar uma alimentação, um sintoma, uma fralda ou uma observação, tudo
          aparece aqui em ordem. Toque em "Novo registro" para começar.
        </EmptyState>
      )}

      {!loading && !errorMessage && events.length > 0 && visible.length === 0 && (
        <p className={styles.empty}>Nenhum registro deste tipo no período.</p>
      )}

      {!loading && !errorMessage && visible.length > 0 && latest && (
        <>
          <Card as="section" className={styles.summary} aria-label="Resumo dos registros">
            <dl className={styles.summaryGrid}>
              <div className={styles.summaryItem}>
                <dt className={styles.summaryLabel}>
                  {active && active.id !== 'all'
                    ? `${active.label} no período`
                    : 'Registros no período'}
                </dt>
                <dd className={styles.summaryCount}>
                  {visible.length === 1 ? '1 registro' : `${visible.length} registros`}
                </dd>
              </div>
              <div className={styles.summaryItem}>
                <dt className={styles.summaryLabel}>Último registro</dt>
                <dd className={styles.summaryLatest}>
                  <span className={styles.summaryTitle}>{latest.title}</span>
                  <time className={styles.summaryTime} dateTime={latest.occurredAt}>
                    {formatDateTime(latest.occurredAt)}
                  </time>
                </dd>
              </div>
            </dl>
          </Card>

          <TimelineList
            events={visible}
            onEdit={(entry) => setModalTarget({ entry, mode: 'edit' })}
            onDelete={(entry) => setModalTarget({ entry, mode: 'delete' })}
          />
        </>
      )}

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

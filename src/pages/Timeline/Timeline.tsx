import { useMemo, useState } from 'react'
import { CalendarClock, Plus } from 'lucide-react'
import { AppTemplate } from '@/components/templates/AppTemplate'
import { Button } from '@/components/atoms/Button'
import { Chip } from '@/components/atoms/Chip'
import { Loading } from '@/components/atoms/Loading'
import { Alert } from '@/components/molecules/Alert'
import { EmptyState } from '@/components/molecules/EmptyState'
import { DiaryEntryModal } from '@/components/organisms/DiaryEntryModal'
import { NewRecordSheet } from '@/components/organisms/NewRecordSheet'
import { TimelineList } from '@/components/organisms/TimelineList'
import { DIARY_FILTERS } from '@/constants/diaryFilters'
import { useRecentExposures } from '@/hooks/useRecentExposures'
import { useTimeline } from '@/hooks/useTimeline'
import type { TimelineEvent } from '@/types'
import styles from './Timeline.module.css'

export default function Timeline() {
  const { events, sources, loading, errorMessage, refresh } = useTimeline()
  const exposures = useRecentExposures()
  const [filterId, setFilterId] = useState('all')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<TimelineEvent | null>(null)

  const active = DIARY_FILTERS.find((item) => item.id === filterId)
  const kinds = active?.kinds ?? null
  const visible = useMemo(
    () => (kinds ? events.filter((event) => kinds.includes(event.kind)) : events),
    [events, kinds],
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
      <div className={styles.filters} role="group" aria-label="Filtrar o diário">
        {DIARY_FILTERS.map((item) => (
          <Chip
            key={item.id}
            selected={item.id === filterId}
            onClick={() => setFilterId(item.id)}
          >
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

      {!loading && !errorMessage && visible.length > 0 && (
        <TimelineList events={visible} onEdit={setEditing} onDelete={setEditing} />
      )}

      <NewRecordSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />

      <DiaryEntryModal
        entry={editing}
        sources={sources}
        exposures={exposures}
        onClose={() => setEditing(null)}
        onSaved={() => void refresh()}
      />
    </AppTemplate>
  )
}

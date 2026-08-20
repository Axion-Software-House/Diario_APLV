import { CalendarClock } from 'lucide-react'
import { AppTemplate } from '@/components/templates/AppTemplate'
import { Loading } from '@/components/atoms/Loading'
import { Alert } from '@/components/molecules/Alert'
import { EmptyState } from '@/components/molecules/EmptyState'
import { TimelineList } from '@/components/organisms/TimelineList'
import { useTimeline } from '@/hooks/useTimeline'

export default function Timeline() {
  const { events, loading, errorMessage } = useTimeline()

  return (
    <AppTemplate title="Timeline" subtitle="Tudo em ordem, do mais recente." backTo="/app">
      {loading && <Loading label="Carregando os registros..." />}

      {!loading && errorMessage && <Alert variant="error">{errorMessage}</Alert>}

      {!loading && !errorMessage && events.length === 0 && (
        <EmptyState icon={CalendarClock} title="Nenhum registro ainda">
          Assim que você registrar uma exposição, um sintoma, uma fralda ou uma observação, tudo
          aparece aqui em ordem. Os atalhos estão na tela inicial.
        </EmptyState>
      )}

      {!loading && !errorMessage && events.length > 0 && <TimelineList events={events} />}
    </AppTemplate>
  )
}

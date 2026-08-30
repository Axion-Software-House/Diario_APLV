import { useMemo } from 'react'
import { Printer } from 'lucide-react'
import { AppTemplate } from '@/components/templates/AppTemplate'
import { Button } from '@/components/atoms/Button'
import { Loading } from '@/components/atoms/Loading'
import { Alert } from '@/components/molecules/Alert'
import { ReportDocument } from '@/components/organisms/ReportDocument'
import { useDiary } from '@/hooks/useDiary'
import { useChild } from '@/hooks/useChild'
import { buildReport } from '@/utils/report'
import { buildTimeline } from '@/utils/timeline'
import styles from './Report.module.css'

export default function Report() {
  const { child, activeTpo } = useChild()
  const { sources, loading, errorMessage } = useDiary()

  const protocol = activeTpo?.protocol ?? null

  const report = useMemo(
    () => (child ? buildReport(sources, child, protocol) : null),
    [sources, child, protocol],
  )
  const events = useMemo(() => buildTimeline(sources), [sources])

  return (
    <AppTemplate
      title="Relatório"
      subtitle="Para levar à consulta."
      backTo="/app"
      headerAside={
        <Button variant="secondary" data-print="hide" onClick={() => window.print()}>
          <Printer size={16} aria-hidden="true" className={styles.printIcon} />
          Imprimir
        </Button>
      }
    >
      {loading && <Loading label="Montando o relatório..." />}

      {!loading && errorMessage && <Alert variant="error">{errorMessage}</Alert>}

      {!loading && !errorMessage && report && <ReportDocument report={report} events={events} />}
    </AppTemplate>
  )
}

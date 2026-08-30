import { useMemo, useState } from 'react'
import { Printer } from 'lucide-react'
import { AppTemplate } from '@/components/templates/AppTemplate'
import { Button } from '@/components/atoms/Button'
import { Chip } from '@/components/atoms/Chip'
import { Loading } from '@/components/atoms/Loading'
import { Alert } from '@/components/molecules/Alert'
import { ReportDocument } from '@/components/organisms/ReportDocument'
import { useDiary } from '@/hooks/useDiary'
import { useChild } from '@/hooks/useChild'
import { buildReport } from '@/utils/report'
import { filterSources, periodRange, REPORT_PERIODS } from '@/utils/reportPeriod'
import type { ReportPeriodId } from '@/utils/reportPeriod'
import { buildTimeline } from '@/utils/timeline'
import styles from './Report.module.css'

export default function Report() {
  const { child, activeTpo } = useChild()
  const { sources, loading, errorMessage } = useDiary()
  const [periodId, setPeriodId] = useState<ReportPeriodId>('30d')

  const protocol = activeTpo?.protocol ?? null
  const periods = REPORT_PERIODS.filter((period) => period.id !== 'tpo' || protocol)

  const { report, events } = useMemo(() => {
    if (!child) return { report: null, events: [] }
    const range = periodRange(periodId, protocol)
    const filtered = filterSources(sources, range.from, range.to)
    return {
      report: buildReport(filtered, child, protocol, range),
      events: buildTimeline(filtered),
    }
  }, [child, protocol, sources, periodId])

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
      <div className={styles.periods} data-print="hide" role="group" aria-label="Período">
        {periods.map((period) => (
          <Chip
            key={period.id}
            selected={period.id === periodId}
            onClick={() => setPeriodId(period.id)}
          >
            {period.label}
          </Chip>
        ))}
      </div>

      {loading && <Loading label="Montando o relatório..." />}

      {!loading && errorMessage && <Alert variant="error">{errorMessage}</Alert>}

      {!loading && !errorMessage && report && <ReportDocument report={report} events={events} />}
    </AppTemplate>
  )
}

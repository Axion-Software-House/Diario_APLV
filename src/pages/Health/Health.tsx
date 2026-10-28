import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/atoms/Badge'
import { ActionTile } from '@/components/molecules/ActionTile'
import { Card } from '@/components/molecules/Card'
import { AppTemplate } from '@/components/templates/AppTemplate'
import { HEALTH_KINDS, listActiveTreatments } from '@/constants/health'
import { useChild } from '@/hooks/useChild'
import { useReturnNavigation } from '@/hooks/useReturnNavigation'
import { listHealthRecords } from '@/services/health'
import { formatDateTime } from '@/utils/dates'
import type { HealthRecord } from '@/types'
import styles from './Health.module.css'

/** Hub da Saúde: quatro registros atrás de um toque só na Home (README FINAL §12). */
export default function Health() {
  const { origin } = useReturnNavigation('/app')
  const { child } = useChild()
  const childId = child?.id
  const [records, setRecords] = useState<HealthRecord[]>([])

  useEffect(() => {
    if (!childId) return
    let cancelled = false
    listHealthRecords(childId)
      .then((data) => {
        if (!cancelled) setRecords(data)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [childId])

  const activeTreatments = listActiveTreatments(records)

  return (
    <AppTemplate title="Saúde" subtitle="O que você quer registrar?" backTo={origin}>
      <div className={styles.page}>
        <nav className={styles.grid} aria-label="Registros de saúde">
          {HEALTH_KINDS.map((kind) => (
            <ActionTile
              key={kind.value}
              to={`/app/saude/${kind.value}`}
              state={{ from: origin }}
              label={kind.label}
              hint={kind.hint}
              emoji={kind.emoji}
            />
          ))}
        </nav>

        {activeTreatments.length > 0 && (
          <section className={styles.treatments} aria-label="Tratamentos ativos">
            <h2 className={styles.heading}>Tratamentos ativos</h2>
            <ul className={styles.list}>
              {activeTreatments.map((treatment) => (
                <li key={treatment.record.id}>
                  <Card className={styles.card} active>
                    <div className={styles.cardTop}>
                      <h3 className={styles.name}>{treatment.name}</h3>
                      <Badge tone="primary">{treatment.statusLabel}</Badge>
                    </div>
                    <p className={styles.schedule}>{treatment.scheduleLabel}</p>
                    <p className={styles.meta}>
                      Início: {formatDateTime(treatment.startedAt)} ·{' '}
                      {treatment.doseCount === 0
                        ? 'Nenhuma dose registrada ainda'
                        : `${treatment.doseCount} ${
                            treatment.doseCount === 1 ? 'dose registrada' : 'doses registradas'
                          }`}
                    </p>
                    <Link
                      to="/app/saude/medication"
                      state={{ from: origin }}
                      className={styles.link}
                    >
                      Registrar dose dada
                    </Link>
                  </Card>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </AppTemplate>
  )
}

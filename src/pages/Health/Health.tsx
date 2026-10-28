import { ActionTile } from '@/components/molecules/ActionTile'
import { HealthOverviewPanel } from '@/components/organisms/HealthForm'
import { AppTemplate } from '@/components/templates/AppTemplate'
import { HEALTH_KINDS } from '@/constants/health'
import { useReturnNavigation } from '@/hooks/useReturnNavigation'
import { useHealthRecords } from './useHealthRecords'
import styles from './Health.module.css'

/**
 * Hub da Saúde: quatro registros atrás de um toque só na Home (README FINAL
 * §12) e o "Resumo da saúde". Sem faixa nem painel do TPO: Saúde não
 * pertence à reintrodução (decisão do teste com cliente).
 */
export default function Health() {
  const { origin } = useReturnNavigation('/app')
  const { records, loading, errorMessage, refresh } = useHealthRecords()

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

        <HealthOverviewPanel
          state={{ records, loading, errorMessage, onRetry: refresh }}
          origin={origin}
        />
      </div>
    </AppTemplate>
  )
}

import { AppTemplate } from '@/components/templates/AppTemplate'
import { ActionTile } from '@/components/molecules/ActionTile'
import { HEALTH_KINDS } from '@/constants/health'
import { useReturnNavigation } from '@/hooks/useReturnNavigation'
import styles from './Health.module.css'

/** Hub da Saúde: quatro registros atrás de um toque só na Home (README FINAL §12). */
export default function Health() {
  const { origin } = useReturnNavigation('/app')

  return (
    <AppTemplate title="Saúde" subtitle="O que você quer registrar?" backTo={origin}>
      <nav className={styles.grid} aria-label="Registros de saúde">
        {HEALTH_KINDS.map((kind) => (
          <ActionTile
            key={kind.value}
            to={`/app/saude/${kind.value}`}
            state={{ from: origin }}
            label={kind.label}
            hint={kind.hint}
            icon={kind.icon}
          />
        ))}
      </nav>
    </AppTemplate>
  )
}

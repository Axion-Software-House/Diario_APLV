import { ActionTile } from '@/components/molecules/ActionTile'
import { StageProgress } from '@/components/molecules/StageProgress'
import { AppTemplate } from '@/components/templates/AppTemplate'
import { Button } from '@/components/atoms/Button'
import { SHORTCUTS } from '@/constants/shortcuts'
import { STAGES } from '@/constants/stages'
import { APP_DISCLAIMER } from '@/constants/disclaimers'
import { useAuth } from '@/hooks/useAuth'
import { useAuthAction } from '@/hooks/useAuthAction'
import { useProtocol } from '@/hooks/useProtocol'
import { dayOfStage } from '@/utils/dates'
import styles from './Home.module.css'

export default function Home() {
  const { signOut } = useAuth()
  const { active } = useProtocol()
  const { state, run } = useAuthAction(signOut)

  // RequireProtocol garante que existe; a guarda é só para o tipo.
  if (!active) return null

  const { child, protocol, currentStagePeriod } = active
  const stage = STAGES.find((item) => item.id === protocol.current_stage)

  return (
    <AppTemplate
      title={child.name}
      headerAside={
        <Button
          variant="ghost"
          busy={state === 'saving'}
          busyLabel="Saindo..."
          onClick={() => void run(undefined)}
        >
          Sair
        </Button>
      }
    >
      <section className={styles.stage} aria-label="Etapa atual">
        <StageProgress
          current={protocol.current_stage}
          total={STAGES.length}
          label={stage?.label ?? ''}
          dayOfStage={currentStagePeriod ? dayOfStage(currentStagePeriod.started_at) : undefined}
        />
      </section>

      <nav className={styles.grid} aria-label="Ações do diário">
        {SHORTCUTS.map((shortcut) => (
          <ActionTile key={shortcut.to} {...shortcut} />
        ))}
      </nav>

      <p className={styles.disclaimer}>{APP_DISCLAIMER}</p>
    </AppTemplate>
  )
}

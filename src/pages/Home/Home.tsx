import { Button } from '@/components/atoms/Button'
import { useAuth } from '@/hooks/useAuth'
import { useAuthAction } from '@/hooks/useAuthAction'
import { useProtocol } from '@/hooks/useProtocol'
import { STAGES } from '@/constants/stages'
import { dayOfStage } from '@/utils/dates'
import styles from './Home.module.css'

/** Provisória. O dashboard com os 8 atalhos é o M4. */
export default function Home() {
  const { signOut } = useAuth()
  const { active } = useProtocol()
  const { state, run } = useAuthAction(signOut)

  if (!active) return null

  const { child, protocol, currentStagePeriod } = active
  const stage = STAGES.find((s) => s.id === protocol.current_stage)

  return (
    <main className={styles.main}>
      <h1 className={styles.title}>{child.name}</h1>
      <p className={styles.text}>
        Etapa {protocol.current_stage} de {STAGES.length} — {stage?.label}
      </p>
      {currentStagePeriod && (
        <p className={styles.text}>Dia {dayOfStage(currentStagePeriod.started_at)} desta etapa</p>
      )}
      <Button
        variant="secondary"
        busy={state === 'saving'}
        busyLabel="Saindo..."
        onClick={() => void run(undefined)}
      >
        Sair
      </Button>
    </main>
  )
}

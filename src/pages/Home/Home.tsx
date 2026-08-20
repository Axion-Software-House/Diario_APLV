import { Button } from '@/components/atoms/Button'
import { useAuth } from '@/hooks/useAuth'
import { useAuthAction } from '@/hooks/useAuthAction'
import styles from './Home.module.css'

/** Provisória. O dashboard com os 8 atalhos é o M4. */
export default function Home() {
  const { user, signOut } = useAuth()
  const { state, run } = useAuthAction(signOut)

  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Diário APLV</h1>
      <p className={styles.text}>Sessão ativa: {user?.email}</p>
      <Button variant="secondary" busy={state === 'saving'} busyLabel="Saindo..." onClick={() => void run(undefined)}>
        Sair
      </Button>
    </main>
  )
}

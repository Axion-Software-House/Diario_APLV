import { useRegisterSW } from 'virtual:pwa-register/react'
import { CloudOff } from 'lucide-react'
import { Button } from '@/components/atoms/Button'
import { useOnline } from '@/hooks/useOnline'
import styles from './AppStatus.module.css'

/**
 * Avisos do app, não do diário: conexão e versão nova disponível.
 *
 * Offline avisa em vez de quebrar — as telas continuam legíveis, o que já
 * foi carregado continua na tela, e a tentativa de salvar cai na mensagem
 * "Sem conexão" de lib/errors.ts.
 */
export function AppStatus() {
  const online = useOnline()
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (online && !needRefresh) return null

  return (
    <div className={styles.bar} role="status" data-print="hide">
      {!online && (
        <p className={styles.offline}>
          <CloudOff size={16} aria-hidden="true" />
          Sem conexão. Você pode ler o que já está na tela; para registrar, reconecte.
        </p>
      )}

      {online && needRefresh && (
        <p className={styles.update}>
          Uma versão nova do Diário APLV está pronta.
          <Button variant="secondary" onClick={() => void updateServiceWorker(true)}>
            Atualizar
          </Button>
        </p>
      )}
    </div>
  )
}

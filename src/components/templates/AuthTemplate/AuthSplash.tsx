import { BrandMark } from '@/components/atoms/BrandIllustration'
import { Loading } from '@/components/atoms/Loading'
import styles from './AuthSplash.module.css'

type Props = {
  label?: string
}

/**
 * Tela de abertura (docs/10-design-telas.md, Tela 1): fundo claro, símbolo e
 * nome enquanto a sessão e o diário carregam. Sem animação de entrada: as
 * rotas trocam uma abertura pela outra (sessão, depois a criança) e uma
 * entrada animada piscaria a cada troca.
 */
export function AuthSplash({ label = 'Carregando...' }: Props) {
  return (
    <main className={styles.splash}>
      <div className={styles.brand}>
        <BrandMark className={styles.mark} />
        <p className={styles.name}>Diário APLV</p>
        <p className={styles.tagline}>Seu acompanhamento, organizado de forma simples.</p>
      </div>
      <Loading label={label} />
    </main>
  )
}

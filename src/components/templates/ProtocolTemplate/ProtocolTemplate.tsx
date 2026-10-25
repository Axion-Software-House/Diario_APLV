import type { ReactNode } from 'react'
import { AppTemplate } from '@/components/templates/AppTemplate'
import { ProtocolAside } from '@/components/organisms/ProtocolAside'
import { ActiveStageBanner } from '@/components/molecules/ActiveStageBanner'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import styles from './ProtocolTemplate.module.css'

type Props = {
  title: string
  subtitle?: string
  bannerContent?: ReactNode
  children: ReactNode
}

/** ≥1024px, o resumo lateral só existe a partir daqui (04-design-system.md). */
const WIDE = '(min-width: 1024px)'

/**
 * Layout das telas de registro. Uma coluna no celular; a partir de 1024px,
 * o formulário à esquerda e o resumo do acompanhamento à direita.
 *
 * Com TPO ativo, exibe a faixa "Etapa atual: <nome da etapa>" no topo do
 * formulário. Sem TPO, a faixa não aparece.
 *
 * O resumo não é montado abaixo de 1024px: não adianta escondê-lo por CSS e
 * pagar cinco consultas que o celular nunca vai mostrar.
 */
export function ProtocolTemplate({ title, subtitle, bannerContent, children }: Props) {
  const wide = useMediaQuery(WIDE)

  return (
    <AppTemplate title={title} subtitle={subtitle} backTo="/app">
      <div className={styles.columns}>
        <div className={styles.record}>
          <ActiveStageBanner>{bannerContent}</ActiveStageBanner>
          {children}
        </div>
        {wide && <ProtocolAside />}
      </div>
    </AppTemplate>
  )
}

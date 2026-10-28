import type { ReactNode } from 'react'
import { AppTemplate } from '@/components/templates/AppTemplate'
import { ProtocolAside } from '@/components/organisms/ProtocolAside'
import { ActiveStageBanner } from '@/components/molecules/ActiveStageBanner'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useReturnNavigation } from '@/hooks/useReturnNavigation'
import styles from './ProtocolTemplate.module.css'

type Props = {
  title: string
  subtitle?: string
  bannerContent?: ReactNode
  /** Destino do "Voltar"; por padrão retorna à origem (`location.state.from` ou `/app`). */
  backTo?: string
  backState?: unknown
  /**
   * Resumo específico da tela (ex.: o que já foi registrado de alimentação).
   * Fica abaixo do formulário no celular e na coluna lateral a partir de 1024px.
   */
  summary?: ReactNode
  /**
   * `false` tira a faixa "Etapa atual" e o resumo do TPO da tela. Saúde não
   * tem relação obrigatória com o TPO (pedido do teste com cliente).
   */
  showTpo?: boolean
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
 * O resumo do TPO não é montado abaixo de 1024px: não adianta escondê-lo por
 * CSS e pagar cinco consultas que o celular nunca vai mostrar. O `summary` da
 * tela, ao contrário, aparece em qualquer largura, abaixo do formulário.
 */
export function ProtocolTemplate({
  title,
  subtitle,
  bannerContent,
  backTo,
  backState,
  summary,
  showTpo = true,
  children,
}: Props) {
  const wide = useMediaQuery(WIDE)
  const { origin } = useReturnNavigation('/app')

  return (
    <AppTemplate title={title} subtitle={subtitle} backTo={backTo ?? origin} backState={backState}>
      <div className={styles.columns}>
        <div className={styles.record}>
          {showTpo && <ActiveStageBanner>{bannerContent}</ActiveStageBanner>}
          {children}
        </div>
        {(summary || (wide && showTpo)) && (
          <div className={styles.side}>
            {summary}
            {wide && showTpo && <ProtocolAside />}
          </div>
        )}
      </div>
    </AppTemplate>
  )
}

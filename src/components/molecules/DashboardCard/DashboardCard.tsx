import { useId } from 'react'
import type { ReactNode } from 'react'
import { AreaEmoji } from '@/components/molecules/AreaEmoji'
import type { Area } from '@/components/molecules/AreaEmoji'
import styles from './DashboardCard.module.css'

type Props = {
  title: string
  /** Área do emoji ao lado do título. */
  area?: Area
  /** Linha curta abaixo do título, ex.: "8 registros hoje". */
  subtitle?: ReactNode
  /** Link ou botão no rodapé ("Ver no Diário"). */
  footer?: ReactNode
  /** Nível do título: h2 na Home, h3 dentro de uma seção já titulada. */
  headingLevel?: 2 | 3
  className?: string
  children: ReactNode
}

/**
 * Cartão de resumo dos painéis (Home, Diário): uma `section` titulada, com o
 * emoji da área num círculo claro, o conteúdo e um rodapé opcional. Os
 * números vão em texto, legíveis pelo leitor de tela.
 */
export function DashboardCard({
  title,
  area,
  subtitle,
  footer,
  headingLevel = 2,
  className,
  children,
}: Props) {
  const headingId = useId()
  const Heading = headingLevel === 2 ? 'h2' : 'h3'

  return (
    <section
      className={[styles.card, className].filter(Boolean).join(' ')}
      aria-labelledby={headingId}
    >
      <div className={styles.header}>
        {area && <AreaEmoji area={area} size="sm" />}
        <div className={styles.titles}>
          <Heading id={headingId} className={styles.title}>
            {title}
          </Heading>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
      </div>
      <div className={styles.body}>{children}</div>
      {footer && <div className={styles.footer}>{footer}</div>}
    </section>
  )
}

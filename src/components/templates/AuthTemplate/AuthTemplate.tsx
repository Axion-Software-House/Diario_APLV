import { useId } from 'react'
import type { ReactNode } from 'react'
import { BrandIllustration, BrandMark } from '@/components/atoms/BrandIllustration'
import { EMOJI } from '@/constants/emojis'
import styles from './AuthTemplate.module.css'

type Props = {
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
}

/** O que o app faz, sem promessa clínica: só registro e organização. */
const BENEFITS = [
  { emoji: EMOJI.note, text: 'Registre em poucos toques' },
  { emoji: EMOJI.diary, text: 'Tudo num diário só' },
  { emoji: EMOJI.report, text: 'Relatório pronto para a consulta' },
] as const

/**
 * Telas de acesso (login, senha, onboarding). Celular: um topo colorido com a
 * marca e o cartão do formulário por cima. A partir de 1024px: painel da marca
 * à esquerda e o formulário à direita.
 *
 * O texto branco fica sempre na faixa violeta do gradiente (ver
 * --brand-text-safe-stop em tokens.css); lavanda e pêssego ficam embaixo,
 * atrás da ilustração e do cartão claro dos benefícios.
 */
export function AuthTemplate({ title, subtitle, children, footer }: Props) {
  const titleId = useId()

  return (
    <div className={styles.page}>
      <header className={styles.brand}>
        <div className={styles.brandPanel}>
          <div className={styles.brandText}>
            <p className={styles.logo}>
              <BrandMark tone="light" className={styles.logoMark} />
              <span>Diário APLV</span>
            </p>
            <p className={styles.tagline}>Seu acompanhamento, organizado de forma simples.</p>
          </div>

          <div className={styles.illustration}>
            <BrandIllustration className={styles.illustrationSvg} />
          </div>

          <ul className={styles.benefits}>
            {BENEFITS.map((benefit) => (
              <li key={benefit.text} className={styles.benefit}>
                <span className={styles.benefitEmoji} aria-hidden="true" data-emoji>
                  {benefit.emoji}
                </span>
                {benefit.text}
              </li>
            ))}
          </ul>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.card} aria-labelledby={titleId}>
          <header className={styles.header}>
            <h1 className={styles.title} id={titleId}>
              {title}
            </h1>
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </header>
          {children}
          {footer && <footer className={styles.footer}>{footer}</footer>}
        </section>
      </main>
    </div>
  )
}

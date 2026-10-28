import { useId } from 'react'
import type { ReactNode } from 'react'
import { EmojiBadge } from '@/components/atoms/EmojiBadge'
import styles from './FormSection.module.css'

type Props = {
  /**
   * Título do cartão. Sem ele, quem faz o papel de título é a pergunta do
   * primeiro campo (a `legend` do ChipGroup ou o rótulo do Input), que dentro
   * do cartão cresce para isso — nenhum texto novo para a família ler.
   */
  title?: string
  /** Emoji de `EMOJI` ao lado do título, no círculo com o tom da área. */
  emoji?: string
  className?: string
  children: ReactNode
}

/**
 * Um cartão de formulário: uma pergunta (ou um grupo pequeno de campos) por
 * cartão. Também liga o "modo formulário" dos átomos por herança de
 * variáveis CSS: chips maiores e rótulos com peso de título.
 */
export function FormSection({ title, emoji, className, children }: Props) {
  const titleId = useId()

  if (!title) {
    return <div className={[styles.section, className].filter(Boolean).join(' ')}>{children}</div>
  }

  return (
    <section
      className={[styles.section, className].filter(Boolean).join(' ')}
      aria-labelledby={titleId}
    >
      <h2 id={titleId} className={styles.title}>
        {emoji && <EmojiBadge emoji={emoji} size="sm" />}
        {title}
      </h2>
      {children}
    </section>
  )
}

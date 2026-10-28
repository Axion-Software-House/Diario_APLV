import type { ReactNode } from 'react'
import { EmojiBadge } from '@/components/atoms/EmojiBadge'
import { EMOJI } from '@/constants/emojis'
import { useChild } from '@/hooks/useChild'
import { useTpoStages, stageLabelFrom } from '@/hooks/useTpoStages'
import styles from './ActiveStageBanner.module.css'

type Props = {
  /** Rótulo da etapa para uso explícito ou mock/dev. Se omitido, lê do TPO ativo. */
  stageName?: string
  /** Conteúdo opcional complementar (ex: seleção de alimento do TPO). */
  children?: ReactNode
  className?: string
}

/**
 * Faixa informativa da etapa atual do TPO exibida no topo das telas de registro.
 * Se não houver TPO ativo (e nenhum stageName for passado), não é renderizada.
 */
export function ActiveStageBanner({ stageName: propStageName, children, className }: Props) {
  const { activeTpo } = useChild()
  const { stages } = useTpoStages()

  if (!propStageName && !activeTpo) return null

  const resolvedStageName =
    propStageName ??
    (activeTpo
      ? stageLabelFrom(stages, activeTpo.protocol.current_stage) ||
        `Etapa ${activeTpo.protocol.current_stage}`
      : '')

  if (!resolvedStageName) return null

  return (
    <aside
      className={[styles.banner, className].filter(Boolean).join(' ')}
      aria-label="Etapa atual do TPO"
    >
      <div className={styles.header}>
        <EmojiBadge emoji={EMOJI.tpo} area="tpo" size="sm" className={styles.badge} />
        <p className={styles.title}>
          Etapa atual: <strong className={styles.stageName}>{resolvedStageName}</strong>
        </p>
      </div>
      {children && <div className={styles.extra}>{children}</div>}
    </aside>
  )
}

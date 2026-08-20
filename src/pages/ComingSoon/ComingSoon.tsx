import { AppTemplate } from '@/components/templates/AppTemplate'
import styles from './ComingSoon.module.css'

type Props = {
  title: string
  /** Módulo do roadmap que constrói esta tela. */
  module: string
}

/**
 * Placeholder temporário. Existe para os 8 atalhos da Home navegarem de
 * verdade desde o M4; cada tela substitui o seu no módulo correspondente.
 */
export default function ComingSoon({ title, module }: Props) {
  return (
    <AppTemplate title={title} backTo="/app">
      <p className={styles.text}>Esta tela é construída no {module}.</p>
    </AppTemplate>
  )
}

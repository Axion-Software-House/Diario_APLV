import type { ReactNode } from 'react'
import styles from './FormActions.module.css'

/**
 * Rodapé do formulário com o botão de salvar. No celular ele gruda no fim
 * da tela enquanto o formulário rola (com uma mão só, o polegar alcança);
 * quando o formulário acaba, ele para no lugar e o resumo vem depois.
 *
 * Com o teclado aberto ele fica atrás do teclado (é `sticky` na janela de
 * layout), então nunca cobre o campo que está sendo digitado; o
 * `scroll-padding-bottom` de global.css impede que o foco por Tab pare
 * debaixo dele. A partir de 1024px, volta ao fluxo normal.
 */
export function FormActions({ children }: { children: ReactNode }) {
  return <div className={styles.actions}>{children}</div>
}

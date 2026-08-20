import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import styles from './Modal.module.css'

type Props = {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}

/**
 * `<dialog>` nativo: foco preso, Esc e fundo inerte vêm do navegador, sem
 * biblioteca e sem reimplementar acessibilidade à mão.
 */
export function Modal({ open, title, onClose, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog ref={ref} className={styles.dialog} onCancel={onClose} onClose={onClose}>
      <h2 className={styles.title}>{title}</h2>
      {children}
    </dialog>
  )
}

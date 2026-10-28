import { useEffect, useId, useRef } from 'react'
import type { MouseEvent, PointerEvent, ReactNode, SyntheticEvent } from 'react'
import { X } from 'lucide-react'
import styles from './Modal.module.css'

type Props = {
  open: boolean
  title: string
  onClose: () => void
  /**
   * Fecha ao tocar no fundo escurecido. Desligue (`false`) em modal com
   * formulário: um toque fora do cartão não pode apagar o que foi digitado.
   * Esc e o botão "Fechar" continuam funcionando.
   */
  dismissOnBackdrop?: boolean
  /** `large` alarga o cartão a partir de 600px (ex.: a grade do "+ Novo registro"). */
  size?: 'default' | 'large'
  children: ReactNode
}

/**
 * `<dialog>` nativo: foco preso, Esc e fundo inerte vêm do navegador, sem
 * biblioteca e sem reimplementar acessibilidade à mão. Inclui botão "Fechar"
 * visível (48x48px) e, por padrão, fechamento ao tocar no fundo.
 *
 * Quem fecha é sempre o pai, pela prop `open`: Esc, "Fechar" e o fundo só
 * pedem (`onClose`). Assim o `close` nativo que vem depois de `dialog.close()`
 * não chama `onClose` uma segunda vez.
 */
export function Modal({
  open,
  title,
  onClose,
  dismissOnBackdrop = true,
  size = 'default',
  children,
}: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  // O toque começou no fundo? Sem isso, arrastar uma seleção de texto de
  // dentro do campo até o fundo dispara `click` no `<dialog>` e fecha.
  const pressStartedOnBackdrop = useRef(false)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  // Esc: o `<dialog>` não fecha sozinho; o pai decide pela prop `open`.
  function handleCancel(event: SyntheticEvent<HTMLDialogElement>) {
    event.preventDefault()
    onClose()
  }

  // Só avisa o pai quando o `<dialog>` fechou por fora do React (ex.: o
  // navegador ignorou o `preventDefault` do Esc). Fechado pela prop, `open`
  // já é `false` e não há o que avisar.
  function handleNativeClose() {
    if (open) onClose()
  }

  function handlePointerDown(event: PointerEvent<HTMLDialogElement>) {
    pressStartedOnBackdrop.current = event.target === event.currentTarget
  }

  function handleClick(event: MouseEvent<HTMLDialogElement>) {
    const startedOnBackdrop = pressStartedOnBackdrop.current
    pressStartedOnBackdrop.current = false
    if (dismissOnBackdrop && startedOnBackdrop && event.target === event.currentTarget) {
      onClose()
    }
  }

  return (
    <dialog
      ref={ref}
      className={[styles.dialog, size === 'large' && styles.large].filter(Boolean).join(' ')}
      aria-labelledby={titleId}
      onCancel={handleCancel}
      onClose={handleNativeClose}
      onPointerDown={handlePointerDown}
      onClick={handleClick}
    >
      <div className={styles.content}>
        <div className={styles.header}>
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
          <button type="button" className={styles.closeButton} onClick={onClose}>
            <X size={18} aria-hidden="true" />
            <span>Fechar</span>
          </button>
        </div>
        {children}
      </div>
    </dialog>
  )
}

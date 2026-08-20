import { useId } from 'react'
import type { TextareaHTMLAttributes } from 'react'
import styles from './Textarea.module.css'

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string
  hint?: string
  error?: string
}

export function Textarea({ label, hint, error, id, ...rest }: Props) {
  const generatedId = useId()
  const fieldId = id ?? generatedId
  const errorId = `${fieldId}-error`
  const hintId = `${fieldId}-hint`

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={fieldId}>
        {label}
      </label>
      {hint && (
        <p className={styles.hint} id={hintId}>
          {hint}
        </p>
      )}
      <textarea
        {...rest}
        id={fieldId}
        rows={rest.rows ?? 3}
        aria-invalid={error ? true : undefined}
        aria-describedby={[error && errorId, hint && hintId].filter(Boolean).join(' ') || undefined}
        className={[styles.textarea, error && styles.invalid].filter(Boolean).join(' ')}
      />
      {error && (
        <p className={styles.error} id={errorId} role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

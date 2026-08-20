import { useId } from 'react'
import type { SelectHTMLAttributes } from 'react'
import styles from './Select.module.css'

export type SelectOption = { value: string; label: string }

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string
  options: readonly SelectOption[]
  placeholder?: string
  error?: string
}

/**
 * Existe para listas longas demais para virarem chips. Nas telas de registro
 * a escolha é sempre por toque (ChipGroup) — digitação e menus são exceção.
 */
export function Select({ label, options, placeholder, error, id, ...rest }: Props) {
  const generatedId = useId()
  const selectId = id ?? generatedId
  const errorId = `${selectId}-error`

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={selectId}>
        {label}
      </label>
      <select
        {...rest}
        id={selectId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={[styles.select, error && styles.invalid].filter(Boolean).join(' ')}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className={styles.error} id={errorId} role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

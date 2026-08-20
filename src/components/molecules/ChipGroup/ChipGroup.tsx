import { useId } from 'react'
import styles from './ChipGroup.module.css'

export type ChipOption = { value: string; label: string }

type Props = {
  legend: string
  options: readonly ChipOption[]
  value: string | null
  onChange: (value: string | null) => void
  /** Tocar de novo no chip selecionado limpa a escolha. */
  clearable?: boolean
}

/**
 * Seleção única por toque. Substitui `select` onde a lista é curta —
 * digitação é exceção no Diário APLV.
 */
export function ChipGroup({ legend, options, value, onChange, clearable = true }: Props) {
  const name = useId()

  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>{legend}</legend>
      <div className={styles.chips} role="group" aria-label={legend}>
        {options.map((option) => {
          const selected = option.value === value
          return (
            <button
              key={`${name}-${option.value}`}
              type="button"
              aria-pressed={selected}
              className={[styles.chip, selected && styles.selected].filter(Boolean).join(' ')}
              onClick={() => onChange(selected && clearable ? null : option.value)}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

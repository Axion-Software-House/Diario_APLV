import { useId } from 'react'
import { Chip } from '@/components/atoms/Chip'
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
            <Chip
              key={`${name}-${option.value}`}
              selected={selected}
              onClick={() => onChange(selected && clearable ? null : option.value)}
            >
              {option.label}
            </Chip>
          )
        })}
      </div>
    </fieldset>
  )
}

import { Chip } from '@/components/atoms/Chip'
import { INTENSITIES } from '@/constants/symptoms'
import type { Intensity } from '@/constants/symptoms'
import styles from './SeveritySelector.module.css'

type Props = {
  /** Rótulo do sintoma — vai para o `aria-label` de cada botão. */
  symptomLabel: string
  value: Intensity | null
  onChange: (value: Intensity | null) => void
}

/**
 * Leve · Moderada · Intensa. O toque na intensidade é o que seleciona o
 * sintoma — não existe um "marcar" separado. Tocar de novo desmarca.
 */
export function SeveritySelector({ symptomLabel, value, onChange }: Props) {
  return (
    <div className={styles.options} role="group" aria-label={`Intensidade: ${symptomLabel}`}>
      {INTENSITIES.map((intensity) => {
        const selected = intensity.value === value
        return (
          <Chip
            key={intensity.value}
            fill
            tone="strong"
            selected={selected}
            aria-label={`${symptomLabel}: ${intensity.label}`}
            onClick={() => onChange(selected ? null : intensity.value)}
          >
            {intensity.label}
          </Chip>
        )
      })}
    </div>
  )
}

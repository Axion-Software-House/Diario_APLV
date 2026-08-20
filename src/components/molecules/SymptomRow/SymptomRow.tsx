import { Card } from '@/components/molecules/Card'
import { SeveritySelector } from '@/components/molecules/SeveritySelector'
import type { Intensity, Symptom } from '@/constants/symptoms'
import styles from './SymptomRow.module.css'

type Props = {
  symptom: Symptom
  value: Intensity | null
  onChange: (value: Intensity | null) => void
}

/** Nome do sintoma + as três intensidades. Uma linha, um gesto. */
export function SymptomRow({ symptom, value, onChange }: Props) {
  const selected = value !== null

  return (
    <Card as="li" active={selected} className={styles.row}>
      <span className={styles.label}>{symptom.label}</span>
      <SeveritySelector symptomLabel={symptom.label} value={value} onChange={onChange} />
    </Card>
  )
}

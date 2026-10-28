import { Link, useLocation } from 'react-router-dom'
import { EmojiBadge } from '@/components/atoms/EmojiBadge'
import { Modal } from '@/components/organisms/Modal'
import { NEW_RECORD_ACTIONS } from '@/constants/shortcuts'
import styles from './NewRecordSheet.module.css'

type Props = {
  open: boolean
  onClose: () => void
}

/** Folha "+ Novo registro" do Diário (README FINAL §18). Inclui a observação livre. */
export function NewRecordSheet({ open, onClose }: Props) {
  const location = useLocation()

  return (
    <Modal open={open} title="O que você quer registrar?" onClose={onClose} size="large">
      <ul className={styles.grid}>
        {NEW_RECORD_ACTIONS.map((action) => (
          <li key={action.to}>
            <Link
              to={action.to}
              state={{ from: location.pathname }}
              className={styles.item}
              onClick={onClose}
            >
              <EmojiBadge emoji={action.emoji} size="lg" />
              <span className={styles.label}>{action.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </Modal>
  )
}

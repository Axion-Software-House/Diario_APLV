import { Link } from 'react-router-dom'
import { Modal } from '@/components/organisms/Modal'
import { NEW_RECORD_ACTIONS } from '@/constants/shortcuts'
import styles from './NewRecordSheet.module.css'

type Props = {
  open: boolean
  onClose: () => void
}

/** Folha "+ Novo registro" do Diário (README FINAL §18). Inclui a observação livre. */
export function NewRecordSheet({ open, onClose }: Props) {
  return (
    <Modal open={open} title="O que você quer registrar?" onClose={onClose}>
      <ul className={styles.grid}>
        {NEW_RECORD_ACTIONS.map((action) => {
          const Icon = action.icon
          return (
            <li key={action.to}>
              <Link to={action.to} className={styles.item} onClick={onClose}>
                <Icon size={20} aria-hidden="true" />
                <span>{action.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </Modal>
  )
}

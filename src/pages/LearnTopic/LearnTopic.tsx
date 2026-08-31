import { Navigate, useParams } from 'react-router-dom'
import { AppTemplate } from '@/components/templates/AppTemplate'
import { Card } from '@/components/molecules/Card'
import { Alert } from '@/components/molecules/Alert'
import { LearnCard } from '@/components/molecules/LearnCard'
import { LEARN_CONTENT_READY, URGENCY_LEVELS, learnTopic } from '@/constants/learn'
import styles from './LearnTopic.module.css'

export default function LearnTopic() {
  const { topic: slug } = useParams()
  const topic = learnTopic(slug ?? '')

  if (!topic) return <Navigate to="/app/aprender" replace />

  const isUrgency = topic.slug === 'quando-procurar-ajuda'

  return (
    <AppTemplate title={topic.title} subtitle={topic.summary} backTo="/app/aprender">
      {!LEARN_CONTENT_READY && (
        <Alert variant="info">
          O conteúdo desta seção passa por revisão clínica antes de ficar disponível. A estrutura
          já está aqui para você saber o que esperar.
        </Alert>
      )}

      {isUrgency ? (
        <div className={styles.levels}>
          {URGENCY_LEVELS.map((level) => (
            <Card
              key={level.id}
              as="section"
              className={[styles.level, styles[level.tone]].join(' ')}
              aria-label={level.label}
            >
              <p className={styles.levelLabel}>{level.label}</p>
              <p className={styles.levelText}>{level.description}</p>
            </Card>
          ))}
          <p className={styles.disclaimer}>
            Os sinais específicos de cada nível são definidos pela equipe de saúde e entram aqui
            depois da validação clínica. Na dúvida sobre a gravidade, procure atendimento.
          </p>
        </div>
      ) : (
        <ul className={styles.cards}>
          {topic.cards.map((card) => (
            <li key={card.id}>
              <LearnCard card={card} />
            </li>
          ))}
        </ul>
      )}
    </AppTemplate>
  )
}

import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { AppTemplate } from '@/components/templates/AppTemplate'
import { Card } from '@/components/molecules/Card'
import { LEARN_TOPICS } from '@/constants/learn'
import styles from './Learn.module.css'

/**
 * Hub da aba Aprender (README FINAL §25). Conteúdo curto, em cards. Os
 * textos clínicos entram após validação formal — ver `constants/learn.ts`.
 */
export default function Learn() {
  return (
    <AppTemplate title="Aprender" subtitle="Entender a jornada da APLV, no seu tempo." bottomNav>
      <ul className={styles.list}>
        {LEARN_TOPICS.map((topic) => {
          const Icon = topic.icon
          return (
            <li key={topic.slug}>
              <Card as="article" className={styles.topic}>
                <Link to={`/app/aprender/${topic.slug}`} className={styles.link}>
                  <span className={styles.icon} aria-hidden="true">
                    <Icon size={20} />
                  </span>
                  <span className={styles.text}>
                    <span className={styles.title}>{topic.title}</span>
                    <span className={styles.summary}>{topic.summary}</span>
                  </span>
                  <ChevronRight size={18} aria-hidden="true" className={styles.chevron} />
                </Link>
              </Card>
            </li>
          )
        })}
      </ul>

      <p className={styles.note}>
        O Diário APLV explica para ajudar a conversa com a equipe de saúde. Ele não substitui a
        avaliação profissional nem pede que você classifique a criança sozinha.
      </p>
    </AppTemplate>
  )
}

import { BookOpen, LifeBuoy, Sprout } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

/**
 * Conteúdo da aba Aprender — README FINAL §25–28.
 *
 * A ESTRUTURA está pronta; o TEXTO clínico de cada card entra depois de
 * **validação clínica formal** (§27, §28). Enquanto `LEARN_CONTENT_READY`
 * for `false`, cada card mostra só a pergunta e um aviso de "em revisão" —
 * nunca um texto pela metade.
 *
 * O app NUNCA pede que a mãe classifique a criança como IgE ou não IgE
 * (§26): explicamos a diferença, não cobramos o rótulo.
 */
export const LEARN_CONTENT_READY = import.meta.env.VITE_LEARN_CONTENT_READY === 'true'

export type LearnCard = {
  id: string
  question: string
  /** Texto validado clinicamente. `undefined` até a revisão. */
  body?: string
}

export type LearnTopic = {
  slug: string
  title: string
  summary: string
  icon: LucideIcon
  cards: readonly LearnCard[]
}

export const LEARN_TOPICS: readonly LearnTopic[] = [
  {
    slug: 'aplv',
    title: 'Entenda a APLV',
    summary: 'O que é, os tipos de reação e por que o diagnóstico pode ser difícil.',
    icon: BookOpen,
    cards: [
      { id: 'o-que-e', question: 'O que é APLV?' },
      { id: 'ige-nao-ige', question: 'IgE mediada e não IgE: qual a diferença?' },
      { id: 'imediatas-tardias', question: 'Reações imediatas e reações tardias' },
      { id: 'sintomas-comuns', question: 'Sintomas mais comuns' },
      { id: 'diagnostico-dificil', question: 'Por que o diagnóstico pode ser difícil?' },
    ],
  },
  {
    slug: 'quando-procurar-ajuda',
    title: 'Quando procurar ajuda',
    summary: 'Três níveis: observar e registrar, falar com a equipe, procurar atendimento.',
    icon: LifeBuoy,
    cards: [],
  },
  {
    slug: 'tpo',
    title: 'Sobre o TPO',
    summary: 'O teste de provocação oral: para que serve e o que observar.',
    icon: Sprout,
    cards: [
      { id: 'o-que-e-tpo', question: 'O que é o TPO?' },
      { id: 'para-que-serve', question: 'Para que serve?' },
      { id: 'domiciliar', question: 'Quando pode ser domiciliar?' },
      { id: 'supervisionado', question: 'Quando precisa ser supervisionado?' },
      { id: 'assadas', question: 'Por que algumas reintroduções começam com preparações assadas?' },
      { id: 'o-que-observar', question: 'O que observar durante o TPO?' },
      { id: 'quando-interromper', question: 'Quando interromper e procurar ajuda?' },
    ],
  },
] as const

export function learnTopic(slug: string): LearnTopic | undefined {
  return LEARN_TOPICS.find((topic) => topic.slug === slug)
}

/**
 * Os três níveis de "quando procurar ajuda" (§27). As descrições abaixo são
 * de PROCESSO (o que fazer com o registro), não de conduta clínica. Os
 * sinais específicos de cada nível dependem de validação clínica e entram
 * quando `LEARN_CONTENT_READY` for `true`.
 */
export const URGENCY_LEVELS = [
  {
    id: 'observe',
    label: 'Observe e registre',
    tone: 'success' as const,
    description:
      'Para situações leves e isoladas. Anote no diário o que você percebeu, o horário e o ' +
      'que estava acontecendo. Esse registro ajuda a leitura da equipe na próxima consulta.',
  },
  {
    id: 'team',
    label: 'Fale com a equipe assistente',
    tone: 'primary' as const,
    description:
      'Para situações que se repetem ou que preocupam você. Leve o relatório do diário para ' +
      'a conversa — ele organiza o que aconteceu e quando.',
  },
  {
    id: 'emergency',
    label: 'Procure atendimento imediatamente',
    tone: 'danger' as const,
    description:
      'Diante de sinais que possam ser graves. Na dúvida sobre a gravidade, procure ' +
      'atendimento — não espere o próximo horário de consulta.',
  },
] as const

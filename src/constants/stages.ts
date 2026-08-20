/**
 * Escada do leite — 5 etapas, conforme 05-roadmap.md (M9).
 *
 * NÃO existe regra automática de avanço. Quem decide avançar, repetir ou
 * retornar é a equipe assistente; o app apenas registra a decisão humana.
 */
export const STAGES = [
  { id: 1, label: 'Preparação assada' },
  { id: 2, label: 'Derivado aquecido' },
  { id: 3, label: 'Queijo' },
  { id: 4, label: 'Iogurte' },
  { id: 5, label: 'Leite' },
] as const

export type StageId = (typeof STAGES)[number]['id']

export const FIRST_STAGE: StageId = 1
export const LAST_STAGE: StageId = 5

/** Confirmação exibida antes de qualquer mudança de etapa (M9). */
export const STAGE_CHANGE_CONFIRMATION =
  'Avance apenas se estiver seguindo o plano definido pela equipe assistente.'

/**
 * As três ações da escada (M9). São decisões da equipe assistente que o app
 * apenas registra — não existe regra de avanço automático em lugar nenhum.
 * `outcome` é gravado no período que está sendo fechado.
 */
export const STAGE_ACTIONS = [
  { outcome: 'advanced', label: 'Avançar', hint: 'Ir para a próxima etapa' },
  { outcome: 'repeated', label: 'Repetir', hint: 'Recomeçar esta etapa' },
  { outcome: 'returned', label: 'Retornar', hint: 'Voltar à etapa anterior' },
] as const

export type StageAction = (typeof STAGE_ACTIONS)[number]

/** Como um período terminou, para leitura na timeline e no histórico. */
export const OUTCOME_LABELS: Record<string, string> = {
  advanced: 'Avançou',
  repeated: 'Repetiu',
  returned: 'Retornou',
  paused: 'Pausou',
}

export function stageLabel(stage: number): string {
  return STAGES.find((item) => item.id === stage)?.label ?? ''
}

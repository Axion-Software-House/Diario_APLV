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
 * Orientação inicial do módulo TPO (README FINAL §21). O app não decide
 * quando nem como iniciar — a decisão é da equipe assistente.
 */
export const TPO_INTRO =
  'O Teste de Provocação Oral (TPO) é a reintrodução planejada de um alimento para ' +
  'observar como a criança reage. Existem cenários domiciliares e supervisionados, e a ' +
  'escolha depende de cada caso. O Diário APLV apenas registra o acompanhamento — ele ' +
  'não define se, quando ou como o TPO deve começar.'

/** Mensagem obrigatória do módulo TPO (README FINAL §21). */
export const TPO_TEAM_MESSAGE =
  'O plano do TPO deve seguir a orientação da equipe assistente responsável pela criança.'

/**
 * A sequência de referência não é protocolo universal (README FINAL §22):
 * ordem, alimento, quantidade, duração e necessidade de supervisão variam.
 */
export const TPO_SEQUENCE_NOTE =
  'Esta é uma sequência de referência. A ordem, o alimento, a quantidade e a necessidade ' +
  'de supervisão podem ser diferentes no caso da sua criança.'

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

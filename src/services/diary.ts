import { listDiaperRecords } from '@/services/diapers'
import { listExposures } from '@/services/exposures'
import { listNotes } from '@/services/notes'
import { listStageHistory } from '@/services/stages'
import { listSymptomEvents } from '@/services/symptoms'
import type { TimelineSources } from '@/utils/timeline'

/**
 * As cinco origens do diário, buscadas em paralelo.
 *
 * A timeline (M7) e o relatório (M10) leem exatamente o mesmo conjunto — é o
 * motivo de a união acontecer no frontend em vez de numa view SQL.
 */
export async function loadDiary(protocolId: string): Promise<TimelineSources> {
  const [exposures, symptomEvents, diaperRecords, notes, stageHistory] = await Promise.all([
    listExposures(protocolId),
    listSymptomEvents(protocolId),
    listDiaperRecords(protocolId),
    listNotes(protocolId),
    listStageHistory(protocolId),
  ])

  return { exposures, symptomEvents, diaperRecords, notes, stageHistory }
}

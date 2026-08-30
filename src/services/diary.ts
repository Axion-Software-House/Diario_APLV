import { listDiaperRecords } from '@/services/diapers'
import { listExposures } from '@/services/exposures'
import { listNotes } from '@/services/notes'
import { listStageHistory } from '@/services/stages'
import { listSymptomEvents } from '@/services/symptoms'
import type { TimelineSources } from '@/utils/timeline'

/**
 * As origens do diário da criança, buscadas em paralelo.
 *
 * A timeline (M7) e o relatório (M10) leem exatamente o mesmo conjunto — é o
 * motivo de a união acontecer no frontend em vez de numa view SQL.
 */
export async function loadDiary(childId: string): Promise<TimelineSources> {
  const [exposures, symptomEvents, diaperRecords, notes, stageHistory] = await Promise.all([
    listExposures(childId),
    listSymptomEvents(childId),
    listDiaperRecords(childId),
    listNotes(childId),
    listStageHistory(childId),
  ])

  return { exposures, symptomEvents, diaperRecords, notes, stageHistory }
}

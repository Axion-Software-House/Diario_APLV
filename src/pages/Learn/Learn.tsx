import { BookOpen } from 'lucide-react'
import { AppTemplate } from '@/components/templates/AppTemplate'
import { EmptyState } from '@/components/molecules/EmptyState'

/**
 * Estrutura da aba Aprender (README FINAL §25–28). O conteúdo clínico —
 * APLV, IgE × não-IgE, reações, "quando procurar ajuda", TPO — entra na
 * Fase 3, depois da validação clínica formal.
 */
export default function Learn() {
  return (
    <AppTemplate title="Aprender" subtitle="Entender a jornada da APLV." bottomNav>
      <EmptyState icon={BookOpen} title="Conteúdo em preparação">
        Em breve, explicações curtas e acolhedoras sobre APLV, os tipos de reação e quando procurar
        a equipe de saúde. Todo o conteúdo passa por revisão clínica antes de ficar disponível.
      </EmptyState>
    </AppTemplate>
  )
}

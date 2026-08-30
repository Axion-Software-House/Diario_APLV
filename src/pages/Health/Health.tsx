import { HeartPulse } from 'lucide-react'
import { AppTemplate } from '@/components/templates/AppTemplate'
import { EmptyState } from '@/components/molecules/EmptyState'

/** Estrutura em preparação — o formulário entra na Fase 2. */
export default function Health() {
  return (
    <AppTemplate title="Saúde" subtitle="Registrar medicamento, vacina, consulta ou peso." backTo="/app">
      <EmptyState icon={HeartPulse} title="Em breve">
        Este registro entra na próxima atualização do Diário APLV.
      </EmptyState>
    </AppTemplate>
  )
}

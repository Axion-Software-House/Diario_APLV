import { MapPin } from 'lucide-react'
import { AppTemplate } from '@/components/templates/AppTemplate'
import { EmptyState } from '@/components/molecules/EmptyState'

/** Estrutura em preparação — o formulário entra na Fase 2. */
export default function Environment() {
  return (
    <AppTemplate title="Ambiente / Visita" subtitle="Registrar onde vocês estiveram." backTo="/app">
      <EmptyState icon={MapPin} title="Em breve">
        Este registro entra na próxima atualização do Diário APLV.
      </EmptyState>
    </AppTemplate>
  )
}

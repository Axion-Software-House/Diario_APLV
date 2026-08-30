import { Sparkles } from 'lucide-react'
import { AppTemplate } from '@/components/templates/AppTemplate'
import { EmptyState } from '@/components/molecules/EmptyState'

/** Estrutura em preparação — o formulário entra na Fase 2. */
export default function Product() {
  return (
    <AppTemplate title="Produto / Higiene" subtitle="Registrar um produto de higiene ou cosmético." backTo="/app">
      <EmptyState icon={Sparkles} title="Em breve">
        Este registro entra na próxima atualização do Diário APLV.
      </EmptyState>
    </AppTemplate>
  )
}

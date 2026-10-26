import { useEffect, useState } from 'react'
import { listEnvironmentRecords } from '@/services/environments'
import { listExposures } from '@/services/exposures'
import { listProductRecords } from '@/services/products'
import { listSymptomEvents } from '@/services/symptoms'
import { useChild } from '@/hooks/useChild'
import type { EnvironmentRecord, Exposure, ProductRecord, SymptomEventWithItems } from '@/types'

export type SymptomLinkOptions = {
  exposures: Exposure[]
  environments: EnvironmentRecord[]
  products: ProductRecord[]
  symptomEvents: SymptomEventWithItems[]
}

const EMPTY: SymptomLinkOptions = {
  exposures: [],
  environments: [],
  products: [],
  symptomEvents: [],
}

/**
 * Registros recentes (alimentação, ambiente/visita, produto e episódios de
 * sintomas) para os vínculos opcionais e o registro de evolução na tela de
 * Sintomas. Falha de leitura não trava a tela.
 */
export function useSymptomLinkOptions(): SymptomLinkOptions {
  const { child } = useChild()
  const childId = child?.id
  const [options, setOptions] = useState<SymptomLinkOptions>(EMPTY)

  useEffect(() => {
    if (!childId) return
    let cancelled = false

    void Promise.all([
      listExposures(childId, 8).catch(() => [] as Exposure[]),
      listEnvironmentRecords(childId).catch(() => [] as EnvironmentRecord[]),
      listProductRecords(childId).catch(() => [] as ProductRecord[]),
      listSymptomEvents(childId).catch(() => [] as SymptomEventWithItems[]),
    ]).then(([exposures, environments, products, symptoms]) => {
      if (cancelled) return
      setOptions({
        exposures,
        environments: environments.slice(0, 8),
        products: products.slice(0, 8),
        symptomEvents: symptoms.filter((event) => !event.no_symptoms).slice(0, 8),
      })
    })

    return () => {
      cancelled = true
    }
  }, [childId])

  return options
}

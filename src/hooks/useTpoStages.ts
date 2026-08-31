import { useEffect, useState } from 'react'
import { listTpoStages } from '@/services/protocols'
import { STAGES } from '@/constants/stages'
import type { TpoStage } from '@/types'

/** Escada de referência caso a tabela `tpo_stages` não carregue. */
const FALLBACK: TpoStage[] = STAGES.map((stage) => ({
  ordinal: stage.id,
  label: stage.label,
  short_explanation: null,
  why_this_stage: null,
}))

// A escada é catálogo: uma leitura por sessão basta.
let cache: TpoStage[] | null = null

/**
 * A escada do TPO, lida da tabela `tpo_stages` (README FINAL §22). Enquanto
 * carrega — ou se falhar — usa o fallback dos `constants`, então a tela
 * nunca fica sem os rótulos.
 */
export function useTpoStages(): { stages: TpoStage[]; loading: boolean } {
  const [stages, setStages] = useState<TpoStage[]>(cache ?? FALLBACK)
  const [loading, setLoading] = useState(cache === null)

  useEffect(() => {
    if (cache) return
    let cancelled = false

    void listTpoStages()
      .then((rows) => {
        if (rows.length > 0) cache = rows
        if (!cancelled) {
          if (rows.length > 0) setStages(rows)
          setLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return { stages, loading }
}

export function stageLabelFrom(stages: readonly TpoStage[], ordinal: number): string {
  return stages.find((stage) => stage.ordinal === ordinal)?.label ?? ''
}

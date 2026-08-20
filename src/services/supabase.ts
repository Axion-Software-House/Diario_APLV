import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

/**
 * Client único do Supabase. Nenhum outro arquivo chama `createClient`.
 *
 * Só a publishable key entra aqui — a service role key nunca vai para o
 * frontend. A proteção dos dados é responsabilidade da RLS.
 */

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

// Falha ruidosa: melhor quebrar no boot do que silenciosamente não salvar nada.
if (!url || !key) {
  throw new Error(
    'Configuração do Supabase ausente. Copie .env.example para .env.local e ' +
      'preencha VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY. ' +
      'Atenção: o Vite só expõe variáveis com o prefixo VITE_.',
  )
}

export const supabase = createClient<Database>(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

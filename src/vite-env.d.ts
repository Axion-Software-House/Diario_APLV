/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string
  /** `'true'` libera o conteúdo clínico da aba Aprender (após validação formal). */
  readonly VITE_LEARN_CONTENT_READY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

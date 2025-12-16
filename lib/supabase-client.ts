// Cliente Supabase único e padronizado para todo o projeto
// Usa APENAS variáveis de ambiente - NUNCA URLs hardcoded

import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Validar variáveis de ambiente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase não está configurado. Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY nas variáveis de ambiente da Vercel.'
  )
}

// Validar que a URL termina com .supabase.com (não .supabase.co)
if (supabaseUrl && !supabaseUrl.endsWith('.supabase.com') && !supabaseUrl.includes('.supabase.com/')) {
  console.warn(
    `⚠️ A URL do Supabase pode estar incorreta: ${supabaseUrl}. Deve terminar com .supabase.com`
  )
}

// Criar cliente Supabase único
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
  },
})

// Exportar função helper para verificar se está configurado
export function isSupabaseConfigured(): boolean {
  return !!supabaseUrl && !!supabaseAnonKey
}


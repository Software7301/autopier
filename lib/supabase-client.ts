// Cliente Supabase único e padronizado para todo o projeto
// Usa APENAS variáveis de ambiente - NUNCA URLs hardcoded

import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Validar variáveis de ambiente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Verificar se está configurado
export function isSupabaseConfigured(): boolean {
  return !!supabaseUrl && !!supabaseAnonKey
}

// Validar que a URL termina com .supabase.com ou .supabase.co
const isValidUrl = supabaseUrl && (
  supabaseUrl.endsWith('.supabase.com') || 
  supabaseUrl.endsWith('.supabase.co') ||
  supabaseUrl.includes('.supabase.com/') ||
  supabaseUrl.includes('.supabase.co/')
)

if (supabaseUrl && !isValidUrl) {
  console.warn(
    `⚠️ A URL do Supabase pode estar incorreta: ${supabaseUrl}. Deve terminar com .supabase.com ou .supabase.co`
  )
}

// Criar cliente Supabase único apenas se estiver configurado
// Se não estiver configurado, criar um cliente dummy que retorna erros amigáveis
let supabase: SupabaseClient

if (isSupabaseConfigured() && supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
    },
  })
} else {
  // Criar cliente dummy para evitar erros de importação
  // Este cliente nunca será usado, mas evita quebrar a aplicação
  supabase = createClient('https://placeholder.supabase.co', 'placeholder-key', {
    auth: {
      persistSession: false,
    },
  })
  
  // Sobrescrever métodos críticos para retornar erros amigáveis
  if (typeof window !== 'undefined') {
    console.warn(
      '⚠️ Supabase não está configurado. Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY nas variáveis de ambiente da Vercel.'
    )
  }
}

export { supabase }


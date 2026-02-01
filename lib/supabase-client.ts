import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export function isSupabaseConfigured(): boolean {
  return !!supabaseUrl && !!supabaseAnonKey
}

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

let supabase: SupabaseClient

if (isSupabaseConfigured() && supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
    },
  })
} else {
  supabase = createClient('https://placeholder.supabase.co', 'placeholder-key', {
    auth: {
      persistSession: false,
    },
  })
  if (typeof window !== 'undefined') {
    console.warn(
      '⚠️ Supabase não está configurado. Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY nas variáveis de ambiente da Vercel.'
    )
  }
}

export { supabase }


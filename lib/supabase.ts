// Cliente Supabase para Storage
import { createClient, SupabaseClient } from '@supabase/supabase-js'

let supabaseClient: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient | null {
  // Se já foi criado, retorna o cliente existente
  if (supabaseClient) {
    return supabaseClient
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Só cria o cliente se as credenciais estiverem configuradas
  if (supabaseUrl && supabaseAnonKey) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
    return supabaseClient
  }

  // Retorna null se as credenciais não estiverem configuradas
  return null
}

// Exportar função para compatibilidade (mas não usar diretamente)
export const supabase = getSupabaseClient()



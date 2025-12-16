// Cliente Supabase para Storage
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { config } from './config'

let supabaseClient: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient | null {
  // Se já foi criado, retorna o cliente existente
  if (supabaseClient) {
    return supabaseClient
  }

  // Usar configuração hardcoded ou variável de ambiente como fallback
  const supabaseUrl = config.supabase.url || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = config.supabase.anonKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

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



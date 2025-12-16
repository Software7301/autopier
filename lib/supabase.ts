// Cliente Supabase para Storage (backend/server-side)
// DEPRECATED: Use lib/supabase-client.ts para novo código
// Mantido para compatibilidade com código existente

import { supabase as supabaseClient } from './supabase-client'

export function getSupabaseClient() {
  return supabaseClient
}

// Exportar cliente para compatibilidade
export const supabase = supabaseClient



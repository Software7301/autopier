

import { supabase as supabaseClient } from './supabase-client'

export function getSupabaseClient() {
  return supabaseClient
}

export const supabase = supabaseClient


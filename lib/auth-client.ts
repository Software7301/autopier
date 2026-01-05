'use client'

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

export async function signInWithGoogle(redirectTo?: string) {
  const callbackUrl = `${window.location.origin}/api/auth/callback`
  const nextUrl = redirectTo || '/cliente'
  
  const { data, error } = await supabaseAuth.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${callbackUrl}?next=${encodeURIComponent(nextUrl)}`,
    },
  })

  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabaseAuth.auth.signOut()
  if (error) throw error
}

export async function getSession() {
  const { data: { session } } = await supabaseAuth.auth.getSession()
  return session
}

export function onAuthStateChange(callback: (session: any) => void) {
  return supabaseAuth.auth.onAuthStateChange((event, session) => {
    callback(session)
  })
}


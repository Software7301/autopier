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

function getCallbackUrl(): string {
  // Sempre usar window.location.origin para garantir URL absoluta
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api/auth/callback`
  }
  // Fallback para variável de ambiente se disponível (server-side)
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`
  }
  // Último fallback
  return 'http://localhost:3000/api/auth/callback'
}

export async function signInWithGoogle(redirectTo?: string) {
  const callbackUrl = getCallbackUrl()
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

export async function signInWithDiscord(redirectTo?: string) {
  const callbackUrl = getCallbackUrl()
  const nextUrl = redirectTo || '/cliente'
  
  const { data, error } = await supabaseAuth.auth.signInWithOAuth({
    provider: 'discord',
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


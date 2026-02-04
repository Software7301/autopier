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
    // Em desenvolvimento, usar o Site URL do Supabase como fallback
    const origin = window.location.origin
    // Se for localhost, tentar usar o Site URL configurado no Supabase
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      // Retornar a URL completa para o callback
      return `${origin}/api/auth/callback`
    }
    return `${origin}/api/auth/callback`
  }
  // Fallback para variável de ambiente se disponível (server-side)
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`
  }
  // Último fallback
  return 'http://localhost:3000/api/auth/callback'
}

export async function signInWithGoogle(redirectTo?: string) {
  const nextUrl = redirectTo || '/cliente'
  
  // Usar o Site URL diretamente - o Supabase vai redirecionar para lá
  // E depois vamos capturar a sessão na página
  const { data, error } = await supabaseAuth.auth.signInWithOAuth({
    provider: 'google',
    options: {
      // Usar o Site URL configurado no Supabase (localhost:3000)
      // O Supabase vai redirecionar para lá após autenticação
      redirectTo: typeof window !== 'undefined' 
        ? `${window.location.origin}${nextUrl}`
        : undefined,
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


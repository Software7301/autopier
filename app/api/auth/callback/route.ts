import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getOrCreateUser } from '@/lib/auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/cliente'

  if (!code) {
    console.error('❌ Código não fornecido no callback')
    return NextResponse.redirect(new URL('/auth/login?error=no_code', request.url))
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    })

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('❌ Erro ao fazer exchange:', error)
      return NextResponse.redirect(new URL('/auth/login?error=auth_failed', request.url))
    }

    if (!data.session || !data.user) {
      console.error('❌ Sessão ou usuário não retornados')
      return NextResponse.redirect(new URL('/auth/login?error=no_session', request.url))
    }

    console.log('✅ Sessão criada com sucesso para:', data.user.email)

    // Criar ou atualizar usuário no banco
    await getOrCreateUser(data.user)

    // Criar resposta de redirecionamento
    const response = NextResponse.redirect(new URL(next, request.url))
    
    // Definir cookies de sessão
    response.cookies.set('sb-access-token', data.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 dias
      path: '/',
    })
    
    response.cookies.set('sb-refresh-token', data.session.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 dias
      path: '/',
    })

    console.log('✅ Cookies definidos, redirecionando para:', next)

    return response
  } catch (error: any) {
    console.error('❌ Erro no callback:', error)
    return NextResponse.redirect(new URL('/auth/login?error=callback_error', request.url))
  }
}


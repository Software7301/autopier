import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getOrCreateUser } from '@/lib/auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const errorParam = requestUrl.searchParams.get('error')
  const next = requestUrl.searchParams.get('next') || '/cliente'

  // Se houver erro na URL (vindo do provider)
  if (errorParam) {
    console.error('❌ Erro do provider OAuth:', errorParam)
    return NextResponse.redirect(new URL(`/auth/login?error=provider_error&details=${encodeURIComponent(errorParam)}`, request.url))
  }

  if (!code) {
    console.error('❌ Código não fornecido no callback')
    return NextResponse.redirect(new URL('/auth/login?error=no_code', request.url))
  }

  try {
    console.log('🔵 Iniciando callback OAuth...')
    console.log('🔵 Code recebido:', code.substring(0, 20) + '...')
    console.log('🔵 Supabase URL:', supabaseUrl)

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    })

    console.log('🔵 Fazendo exchange do código...')
    
    // Tentar fazer o exchange com tratamento de erro mais detalhado
    let exchangeResult
    try {
      exchangeResult = await supabase.auth.exchangeCodeForSession(code)
    } catch (exchangeError: any) {
      console.error('❌ Erro ao fazer exchange (catch):', exchangeError)
      console.error('❌ Tipo do erro:', typeof exchangeError)
      console.error('❌ Stack:', exchangeError?.stack)
      return NextResponse.redirect(new URL(`/auth/login?error=exchange_error&details=${encodeURIComponent(exchangeError?.message || 'Erro desconhecido no exchange')}`, request.url))
    }

    const { data, error } = exchangeResult || { data: null, error: null }

    if (error) {
      console.error('❌ Erro ao fazer exchange:', error)
      console.error('❌ Detalhes do erro:', JSON.stringify(error, null, 2))
      console.error('❌ Error code:', error.code)
      console.error('❌ Error message:', error.message)
      return NextResponse.redirect(new URL(`/auth/login?error=auth_failed&details=${encodeURIComponent(error.message || 'Erro na autenticação')}`, request.url))
    }

    if (!data || !data.session || !data.user) {
      console.error('❌ Sessão ou usuário não retornados')
      console.error('❌ Data recebida:', JSON.stringify(data, null, 2))
      return NextResponse.redirect(new URL('/auth/login?error=no_session', request.url))
    }

    console.log('✅ Sessão criada com sucesso para:', data.user.email)
    console.log('✅ User ID:', data.user.id)

    // Criar ou atualizar usuário no banco (com tratamento de erro)
    try {
      const user = await getOrCreateUser(data.user)
      console.log('✅ Usuário criado/atualizado no banco:', user?.id)
    } catch (userError: any) {
      console.error('⚠️ Erro ao criar/atualizar usuário no banco:', userError)
      // Continua mesmo se falhar, pois a sessão já foi criada
    }

    // Construir URL de redirecionamento baseada no origin da requisição
    const origin = requestUrl.origin
    const redirectUrl = new URL(next, origin)
    
    console.log('✅ Redirecionando para:', redirectUrl.toString())

    // Criar resposta de redirecionamento
    const response = NextResponse.redirect(redirectUrl)
    
    // Definir cookies de sessão
    if (data.session.access_token) {
    response.cookies.set('sb-access-token', data.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 dias
      path: '/',
    })
    }
    
    if (data.session.refresh_token) {
    response.cookies.set('sb-refresh-token', data.session.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 dias
      path: '/',
    })
    }

    console.log('✅ Cookies definidos com sucesso')

    return response
  } catch (error: any) {
    console.error('❌ Erro no callback:', error)
    console.error('❌ Stack:', error.stack)
    console.error('❌ Message:', error.message)
    return NextResponse.redirect(new URL(`/auth/login?error=callback_error&details=${encodeURIComponent(error.message || 'Erro desconhecido')}`, request.url))
  }
}


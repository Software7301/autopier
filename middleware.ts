import { NextResponse, type NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Removido o redirecionamento automático para /auth/login
  // Agora os usuários podem acessar /cliente diretamente e informar apenas o nome
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/cliente/:path*',
    '/auth/:path*',
  ],
}


import { NextResponse, type NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const isAuthRoute = request.nextUrl.pathname.startsWith('/auth')
  const isClienteRoute = request.nextUrl.pathname.startsWith('/cliente')

  if (isClienteRoute && !isAuthRoute) {
    const sessionCookie = request.cookies.get('sb-access-token') || request.cookies.get('sb-refresh-token')
    
    if (!sessionCookie) {
      const redirectUrl = new URL('/auth/login', request.url)
      redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/cliente/:path*',
    '/auth/:path*',
  ],
}


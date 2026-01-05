'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signInWithGoogle, getSession } from '@/lib/auth-client'
import { Loader2, AlertCircle } from 'lucide-react'
import Image from 'next/image'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function checkSession() {
      const session = await getSession()
      if (session) {
        const redirect = searchParams.get('redirect') || '/cliente'
        router.push(redirect)
      }
    }
    checkSession()
  }, [router, searchParams])

  async function handleGoogleLogin() {
    setLoading(true)
    setError(null)

    try {
      const redirect = searchParams.get('redirect') || '/cliente'
      await signInWithGoogle(redirect)
    } catch (err: any) {
      console.error('Erro ao fazer login:', err)
      setError(err.message || 'Erro ao fazer login com Google')
      setLoading(false)
    }
  }

  const errorParam = searchParams.get('error')
  if (errorParam && !error) {
    setError('Falha na autenticação. Tente novamente.')
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="relative w-20 h-20">
              <Image
                src="/images.png"
                alt="AutoPier Logo"
                fill
                className="object-cover rounded-full"
              />
            </div>
          </div>
          <h1 className="text-4xl font-display font-bold text-white mb-2">
            Bem-vindo à <span className="text-gradient">AutoPier</span>
          </h1>
          <p className="text-text-secondary text-lg">
            Entre com sua conta Google para acessar seus pedidos
          </p>
        </div>

        <div className="card-static p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full btn-primary flex items-center justify-center gap-3 py-4 text-lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Conectando...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Entrar com Google
              </>
            )}
          </button>

          <div className="mt-6 text-center">
            <p className="text-text-muted text-sm">
              Ao entrar, você concorda com nossos{' '}
              <a href="#" className="text-primary hover:underline">
                Termos de Serviço
              </a>{' '}
              e{' '}
              <a href="#" className="text-primary hover:underline">
                Política de Privacidade
              </a>
            </p>
          </div>
        </div>

        <div className="text-center">
          <p className="text-text-muted text-sm">
            Precisa de ajuda?{' '}
            <a href="mailto:autopiernovacapitalrp@gmail.com" className="text-primary hover:underline">
              Entre em contato
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}


'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ShoppingCart,
  Loader2,
  User,
  MessageSquare
} from 'lucide-react'
import NameModal from '@/components/NameModal'
import { getUserName, setUserName, hasUserName, clearUserName } from '@/lib/userName'
import { getSession, supabaseAuth, onAuthStateChange } from '@/lib/auth-client'

interface Order {
  id: string
  carName: string
  carBrand: string
  carImage: string
  status: string
  totalPrice: number
  selectedColor: string
  paymentMethod: string
  createdAt: string
  updatedAt: string
  lastMessage: string
  lastMessageAt: string
  unreadCount: number
}

const statusLabels: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Aguardando', color: 'text-yellow-400' },
  IN_PROGRESS: { label: 'Em Andamento', color: 'text-blue-400' },
  OPEN: { label: 'Aberta', color: 'text-blue-400' },
  ACCEPTED: { label: 'Aceita', color: 'text-green-400' },
  REJECTED: { label: 'Rejeitada', color: 'text-red-400' },
  CLOSED: { label: 'Fechada', color: 'text-gray-400' },
  CONFIRMED: { label: 'Confirmado', color: 'text-green-400' },
  PROCESSING: { label: 'Em Processamento', color: 'text-blue-400' },
  COMPLETED: { label: 'Finalizado', color: 'text-green-400' },
  CANCELLED: { label: 'Cancelado', color: 'text-red-400' },
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
  }).format(price)
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export default function ClientePage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<Order[]>([])
  const [loadingData, setLoadingData] = useState(false)
  const [showNameModal, setShowNameModal] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    // Listener para mudanças de autenticação (captura callback do Supabase)
    const { data: { subscription } } = onAuthStateChange(async (session) => {
      console.log('🔄 Mudança de estado de autenticação:', !!session)
      if (session) {
        setIsAuthenticated(true)
        // Processar sessão quando recebida do callback
        await processSession(session)
      }
    })

    async function checkAuth() {
      try {
        console.log('🔍 Verificando autenticação...')
        const session = await getSession()
        console.log('🔍 Sessão encontrada:', !!session)
        
        if (session) {
          setIsAuthenticated(true)
          console.log('✅ Usuário autenticado:', session.user?.email)
          
          // Buscar dados do usuário autenticado do servidor
          try {
            const userResponse = await fetch('/api/auth/me')
            console.log('🔍 Resposta do /api/auth/me:', userResponse.status)
            
            if (userResponse.ok) {
              const userData = await userResponse.json()
              console.log('✅ Dados do usuário:', userData)
              
              if (userData?.name) {
                setName(userData.name)
                setUserName(userData.name)
                loadData(userData.name)
              } else {
                // Se não tiver nome, usar email ou username
                const displayName = userData?.email?.split('@')[0] || 'Usuário'
                setName(displayName)
                setUserName(displayName)
                loadData(displayName)
              }
            } else {
              // Se falhar, tentar usar dados da sessão
              const displayName = session.user?.user_metadata?.name || 
                                 session.user?.user_metadata?.full_name ||
                                 session.user?.email?.split('@')[0] || 
                                 'Usuário'
              setName(displayName)
              setUserName(displayName)
              loadData(displayName)
            }
          } catch (error) {
            console.error('Erro ao buscar dados do usuário:', error)
            // Fallback: usar dados da sessão
            const displayName = session.user?.user_metadata?.name || 
                               session.user?.user_metadata?.full_name ||
                               session.user?.email?.split('@')[0] || 
                               'Usuário'
            setName(displayName)
            setUserName(displayName)
            loadData(displayName)
          }
        } else {
          // Não autenticado - redirecionar para login
          console.log('❌ Não autenticado, redirecionando para login')
          setIsAuthenticated(false)
          router.push('/auth/login?redirect=/cliente')
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error)
        // Em caso de erro, redirecionar para login
        setIsAuthenticated(false)
        router.push('/auth/login?redirect=/cliente')
      } finally {
        setCheckingAuth(false)
      }
    }
    
    checkAuth()
    
    // Cleanup do listener
    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  async function processSession(session: any) {
    try {
      console.log('✅ Processando sessão:', session.user?.email)
      
      // Buscar dados do usuário autenticado do servidor
      try {
        const userResponse = await fetch('/api/auth/me')
        console.log('🔍 Resposta do /api/auth/me:', userResponse.status)
        
        if (userResponse.ok) {
          const userData = await userResponse.json()
          console.log('✅ Dados do usuário:', userData)
          
          if (userData?.name) {
            setName(userData.name)
            setUserName(userData.name)
            loadData(userData.name)
          } else {
            // Se não tiver nome, usar email ou username
            const displayName = userData?.email?.split('@')[0] || 'Usuário'
            setName(displayName)
            setUserName(displayName)
            loadData(displayName)
          }
        } else {
          // Se falhar, tentar usar dados da sessão
          const displayName = session.user?.user_metadata?.name || 
                             session.user?.user_metadata?.full_name ||
                             session.user?.email?.split('@')[0] || 
                             'Usuário'
          setName(displayName)
          setUserName(displayName)
          loadData(displayName)
        }
      } catch (error) {
        console.error('Erro ao buscar dados do usuário:', error)
        // Fallback: usar dados da sessão
        const displayName = session.user?.user_metadata?.name || 
                           session.user?.user_metadata?.full_name ||
                           session.user?.email?.split('@')[0] || 
                           'Usuário'
        setName(displayName)
        setUserName(displayName)
        loadData(displayName)
      }
    } catch (error) {
      console.error('Erro ao processar sessão:', error)
    }
  }

  async function loadData(customerName: string) {
    setLoadingData(true)
    try {
      const ordersResponse = await fetch(`/api/client/orders?customerName=${encodeURIComponent(customerName)}`)
      const ordersData = await ordersResponse.json()
      setOrders(Array.isArray(ordersData) ? ordersData : [])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      setOrders([])
    } finally {
      setLoadingData(false)
      setLoading(false)
    }
  }

  function handleNameSubmit(submittedName: string) {
    setUserName(submittedName)
    setName(submittedName)
    setShowNameModal(false)
    setLoading(true)
    loadData(submittedName)
  }

  function handleChangeName() {
    if (confirm('Deseja realmente trocar de nome? Isso limpará seus dados locais e você precisará informar o nome novamente.')) {
      clearUserName()
      setName('')
      setOrders([])
      setShowNameModal(true)
    }
  }


  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-text-secondary">Verificando autenticação...</p>
        </div>
      </div>
    )
  }

  // Se não estiver autenticado, não mostrar nada (já foi redirecionado)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-text-secondary">Redirecionando para login...</p>
        </div>
      </div>
    )
  }

  if (showNameModal && isAuthenticated) {
    return (
      <NameModal
        isOpen={showNameModal}
        onNameSubmit={handleNameSubmit}
        currentName={name}
      />
    )
  }

  if (loading || !name) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-text-secondary">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-display font-bold text-white">
                Área do <span className="text-gradient">Cliente</span>
              </h1>
              <p className="text-text-secondary mt-2">
                {name ? `Olá, ${name}! Acompanhe seus pedidos` : 'Informe seu nome para ver seus pedidos'}
              </p>
            </div>
            {name && (
              <button
                onClick={handleChangeName}
                className="btn-secondary flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                Trocar Nome
              </button>
            )}
          </div>
        </div>

        {loadingData ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
            <p className="text-text-secondary mt-4">Carregando seus pedidos...</p>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
                <ShoppingCart className="w-6 h-6 text-accent" />
                Meus Pedidos
              </h2>
              {orders.length > 0 && (
                <Link href="/cars" className="text-primary hover:text-primary/80 text-sm">
                  Ver veículos
                </Link>
              )}
            </div>

            {orders.length === 0 ? (
              <div className="card-static p-12 text-center">
                <ShoppingCart className="w-16 h-16 text-text-muted mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  {name ? 'Você ainda não tem pedidos' : 'Nenhum pedido encontrado'}
                </h3>
                <p className="text-text-secondary mb-6">
                  {name 
                    ? 'Quando você fizer um pedido, ele aparecerá aqui para acompanhamento.'
                    : 'Informe seu nome para ver seus pedidos existentes ou faça uma compra para criar um novo pedido.'}
                </p>
                <Link href="/cars" className="btn-primary inline-block">
                  Ver Veículos
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => {
                  const status = statusLabels[order.status] || { label: order.status, color: 'text-gray-400' }
                  return (
                    <Link 
                      key={order.id} 
                      href={`/pedido/${order.id}/chat`}
                      className="block"
                    >
                      <div className="card-static p-5 hover:border-primary/50 transition-colors cursor-pointer">
                        <div className="flex items-start gap-4">
                          <div className="w-20 h-20 rounded-lg overflow-hidden bg-surface flex-shrink-0">
                            <img
                              src={order.carImage}
                              alt={order.carName}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div>
                                <h3 className="font-semibold text-white truncate">
                                  {order.carBrand} {order.carName}
                                </h3>
                                <p className={`text-sm ${status.color}`}>
                                  {status.label}
                                </p>
                                <p className="text-text-muted text-xs mt-1">
                                  Cor: {order.selectedColor}
                                </p>
                              </div>
                              {order.unreadCount > 0 && (
                                <span className="bg-accent text-white text-xs font-bold px-2 py-1 rounded-full">
                                  {order.unreadCount}
                                </span>
                              )}
                            </div>

                            <div className="mb-2">
                              <p className="text-accent font-bold text-lg">
                                {formatPrice(order.totalPrice)}
                              </p>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-text-muted text-xs">
                                {formatDate(order.updatedAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}


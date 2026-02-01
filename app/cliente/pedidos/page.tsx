'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ShoppingCart,
  ArrowRight,
  Loader2,
  MessageCircle,
  LogOut,
  User,
} from 'lucide-react'
import { signOut } from '@/lib/auth-client'

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
  lastMessage: string | null
  lastMessageAt: string | null
  unreadCount: number
}

interface UserData {
  id: string
  email: string
  name: string
  avatarUrl: string | null
}

const statusLabels: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Aguardando', color: 'text-yellow-400' },
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

export default function ClientePedidosPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<Order[]>([])
  const [user, setUser] = useState<UserData | null>(null)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    async function loadData() {
      try {
        const [userResponse, ordersResponse] = await Promise.all([
          fetch('/api/auth/me'),
          fetch('/api/cliente/pedidos'),
        ])

        if (userResponse.status === 401 || ordersResponse.status === 401) {
          router.push('/auth/login?redirect=/cliente/pedidos')
          return
        }

        const userData = await userResponse.json()
        const ordersData = await ordersResponse.json()

        setUser(userData)
        setOrders(Array.isArray(ordersData) ? ordersData : [])
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
        router.push('/auth/login?redirect=/cliente/pedidos')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      await signOut()
      router.push('/')
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    } finally {
      setLoggingOut(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-text-secondary">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-display font-bold text-white">
                Meus <span className="text-gradient">Pedidos</span>
              </h1>
              <p className="text-text-secondary mt-2">
                Olá, {user.name}! Acompanhe seus pedidos
              </p>
            </div>
            <div className="flex gap-3 items-center">
              <div className="flex items-center gap-2 text-text-secondary">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                )}
                <span className="text-sm">{user.name}</span>
              </div>
              <Link href="/cliente" className="btn-secondary">
                <MessageCircle className="w-4 h-4 mr-2" />
                Negociações
              </Link>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="btn-secondary"
              >
                {loggingOut ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <LogOut className="w-4 h-4 mr-2" />
                )}
                Sair
              </button>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
              <ShoppingCart className="w-6 h-6 text-accent" />
              Pedidos ({orders.length})
            </h2>
            <Link href="/cars" className="text-primary hover:text-primary/80 text-sm">
              Ver veículos
            </Link>
          </div>

          {orders.length === 0 ? (
            <div className="card-static p-8 text-center">
              <ShoppingCart className="w-12 h-12 text-text-muted mx-auto mb-4" />
              <p className="text-text-secondary mb-4">Você ainda não tem pedidos</p>
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
                          </div>

                          <div className="mb-2">
                            <p className="text-accent font-bold">
                              {formatPrice(order.totalPrice)}
                            </p>
                          </div>

                          {order.lastMessage && (
                            <p className="text-text-muted text-sm truncate mb-2">
                              {order.lastMessage}
                            </p>
                          )}

                          <div className="flex items-center justify-between">
                            <span className="text-text-muted text-xs">
                              {formatDate(order.updatedAt)}
                            </span>
                            <ArrowRight className="w-4 h-4 text-text-muted" />
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
      </div>
    </div>
  )
}


'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  MessageCircle, 
  ShoppingCart, 
  User, 
  Phone,
  ArrowRight,
  Clock,
  CheckCircle,
  Loader2
} from 'lucide-react'

interface Negotiation {
  id: string
  carName: string
  carBrand: string
  carImage: string
  status: string
  createdAt: string
  updatedAt: string
  lastMessage: string
  lastMessageAt: string
  unreadCount: number
}

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
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)
  const [negotiations, setNegotiations] = useState<Negotiation[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loadingData, setLoadingData] = useState(false)

  useEffect(() => {
    // Buscar dados do localStorage
    const savedPhone = localStorage.getItem('autopier_user_phone')
    const savedName = localStorage.getItem('autopier_user_name')
    
    if (savedPhone && savedName) {
      setPhone(savedPhone)
      setName(savedName)
      loadData(savedPhone)
    } else {
      setLoading(false)
    }
  }, [])

  async function loadData(phoneNumber: string) {
    setLoadingData(true)
    try {
      const [negResponse, ordersResponse] = await Promise.all([
        fetch(`/api/client/negotiations?phone=${phoneNumber}`),
        fetch(`/api/client/orders?phone=${phoneNumber}`),
      ])
      
      const negData = await negResponse.json()
      const ordersData = await ordersResponse.json()
      
      setNegotiations(negData)
      setOrders(ordersData)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoadingData(false)
      setLoading(false)
    }
  }

  function handlePhoneSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!phone || phone.replace(/\D/g, '').length < 6) {
      alert('Digite um telefone válido')
      return
    }
    
    const normalizedPhone = phone.replace(/\D/g, '')
    localStorage.setItem('autopier_user_phone', normalizedPhone)
    localStorage.setItem('autopier_user_name', name || 'Cliente')
    
    setPhone(normalizedPhone)
    setName(name || 'Cliente')
    loadData(normalizedPhone)
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

  // Tela de identificação
  if (!phone) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12">
        <div className="max-w-md mx-auto px-4">
          <div className="card-static p-8 space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-2xl font-display font-bold text-white mb-2">
                Acesse Suas Negociações
              </h1>
              <p className="text-text-secondary">
                Digite seu telefone para ver suas negociações e pedidos
              </p>
            </div>

            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-text-secondary mb-2">
                  Nome
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                  className="input-field"
                />
              </div>
              
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-text-secondary mb-2">
                  Telefone *
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="Apenas números"
                  className="input-field"
                  required
                />
              </div>

              <button type="submit" className="btn-primary w-full">
                Acessar
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-display font-bold text-white">
                Área do <span className="text-gradient">Cliente</span>
              </h1>
              <p className="text-text-secondary mt-2">
                Olá, {name}! Acompanhe suas negociações e pedidos
              </p>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem('autopier_user_phone')
                localStorage.removeItem('autopier_user_name')
                setPhone('')
                setName('')
                setNegotiations([])
                setOrders([])
              }}
              className="btn-secondary"
            >
              Sair
            </button>
          </div>
        </div>

        {loadingData ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
            <p className="text-text-secondary mt-4">Carregando...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Negociações */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
                  <MessageCircle className="w-6 h-6 text-primary" />
                  Minhas Negociações
                </h2>
                <Link href="/cars" className="text-primary hover:text-primary/80 text-sm">
                  Ver veículos
                </Link>
              </div>

              {negotiations.length === 0 ? (
                <div className="card-static p-8 text-center">
                  <MessageCircle className="w-12 h-12 text-text-muted mx-auto mb-4" />
                  <p className="text-text-secondary mb-4">Você ainda não tem negociações</p>
                  <Link href="/cars" className="btn-primary inline-block">
                    Ver Veículos
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {negotiations.map((neg) => {
                    const status = statusLabels[neg.status] || { label: neg.status, color: 'text-gray-400' }
                    return (
                      <div key={neg.id} className="card-static p-5 hover:border-primary/50 transition-colors">
                        <div className="flex items-start gap-4">
                          <div className="w-20 h-20 rounded-lg overflow-hidden bg-surface flex-shrink-0">
                            <img 
                              src={neg.carImage} 
                              alt={neg.carName}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div>
                                <h3 className="font-semibold text-white truncate">
                                  {neg.carBrand} {neg.carName}
                                </h3>
                                <p className={`text-sm ${status.color}`}>
                                  {status.label}
                                </p>
                              </div>
                              {neg.unreadCount > 0 && (
                                <span className="bg-accent text-white text-xs font-bold px-2 py-1 rounded-full">
                                  {neg.unreadCount}
                                </span>
                              )}
                            </div>
                            
                            {neg.lastMessage && (
                              <p className="text-text-muted text-sm truncate mb-2">
                                {neg.lastMessage}
                              </p>
                            )}
                            
                            <div className="flex items-center justify-between">
                              <span className="text-text-muted text-xs">
                                {formatDate(neg.updatedAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Pedidos */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
                  <ShoppingCart className="w-6 h-6 text-accent" />
                  Meus Pedidos
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
                      <div key={order.id} className="card-static p-5 hover:border-primary/50 transition-colors">
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
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}



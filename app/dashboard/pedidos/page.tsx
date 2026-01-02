'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Search, 
  ShoppingCart, 
  Car, 
  Users,
  Calendar,
  ChevronDown,
  Eye,
  RefreshCw,
  Headphones
} from 'lucide-react'
import { motion } from 'framer-motion'

interface Pedido {
  id: string
  cliente: string
  email: string
  telefone: string
  veiculo: string
  cor: string
  valor: number
  pagamento: string
  parcelas: number
  status: string
  data: string
  mensagensNaoLidas: number
}

const statusLabels: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: 'Pendente', color: 'text-blue-400', bg: 'bg-blue-500/20' },
  PROCESSING: { label: 'Em Processamento', color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  COMPLETED: { label: 'Finalizado', color: 'text-green-400', bg: 'bg-green-500/20' },
  CANCELLED: { label: 'Cancelado', color: 'text-red-400', bg: 'bg-red-500/20' },
}

const statusOptions = [
  { value: 'TODOS', label: 'Todos os Status' },
  { value: 'PENDING', label: 'Pendente' },
  { value: 'PROCESSING', label: 'Em Processamento' },
  { value: 'COMPLETED', label: 'Finalizado' },
  { value: 'CANCELLED', label: 'Cancelado' },
]

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
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function PedidosPage() {
  const router = useRouter()
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('TODOS')
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  
  // Função para obter nome do funcionário
  function getEmployeeName(): string {
    try {
      const savedEmployee = localStorage.getItem('autopier_employee')
      if (savedEmployee) {
        const parsed = JSON.parse(savedEmployee)
        if (parsed.firstName && parsed.lastName) {
          return `${parsed.firstName} ${parsed.lastName}`
        }
      }
    } catch (error) {
      console.error('Erro ao obter nome do funcionário:', error)
    }
    return 'AutoPier'
  }

  async function fetchPedidos() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'TODOS') params.set('status', statusFilter)
      if (searchTerm) params.set('search', searchTerm)
      
      const response = await fetch(`/api/dashboard/orders?${params}`)
      const data = await response.json()
      setPedidos(data)
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPedidos()
  }, [statusFilter])

  async function handleStartAttendance(pedidoId: string) {
    setUpdatingStatus(pedidoId)
    try {
      // Primeiro, atualizar o status
      const statusResponse = await fetch(`/api/dashboard/orders/${pedidoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PROCESSING' }),
      })

      if (statusResponse.ok) {
        // Obter nome do funcionário
        const employeeName = getEmployeeName()
        
        // Enviar mensagem automática
        try {
          await fetch(`/api/pedido/${pedidoId}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content: 'Olá! Estou iniciando o atendimento do seu pedido. Como posso ajudar?',
              sender: 'funcionario',
              senderName: employeeName,
            }),
          })
        } catch (messageError) {
          console.error('Erro ao enviar mensagem automática:', messageError)
        }

        // Atualizar o status localmente
        setPedidos((prev) =>
          prev.map((pedido) =>
            pedido.id === pedidoId ? { ...pedido, status: 'PROCESSING' } : pedido
          )
        )
        
        // Redirecionar para a página de chat do pedido
        router.push(`/dashboard/pedidos/${pedidoId}`)
      } else {
        alert('Erro ao iniciar atendimento. Tente novamente.')
      }
    } catch (error) {
      console.error('Erro ao iniciar atendimento:', error)
      alert('Erro ao iniciar atendimento. Tente novamente.')
    } finally {
      setUpdatingStatus(null)
    }
  }

  // Filtrar localmente por busca
  const pedidosFiltrados = pedidos.filter((pedido) => {
    if (!searchTerm) return true
    return (
      pedido.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pedido.veiculo.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white flex items-center gap-3">
            <ShoppingCart className="w-8 h-8 text-primary" />
            Pedidos
          </h1>
          <p className="text-text-secondary mt-1">
            Gerencie todos os pedidos da concessionária
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={fetchPedidos}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
          <div className="text-right">
            <p className="text-text-muted text-sm">Total de pedidos</p>
            <p className="text-2xl font-bold text-white">{pedidos.length}</p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="card-static p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por cliente ou veículo..."
              className="input-field pl-12 w-full"
            />
          </div>

          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field pr-10 appearance-none cursor-pointer min-w-[180px]"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Lista de Pedidos */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
            <p className="text-text-secondary">Carregando pedidos...</p>
          </div>
        </div>
      ) : pedidosFiltrados.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-static p-12 text-center"
        >
          <ShoppingCart className="w-16 h-16 text-text-muted mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            {pedidos.length === 0 ? 'Nenhum pedido encontrado' : 'Nenhum resultado para a busca'}
          </h3>
          <p className="text-text-secondary">
            {pedidos.length === 0 
              ? 'Assim que um cliente finalizar uma compra, ela aparecerá aqui.'
              : 'Tente ajustar os filtros de busca.'}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {pedidosFiltrados.map((pedido, index) => {
            const status = statusLabels[pedido.status] || statusLabels.PENDING
            return (
              <motion.div
                key={pedido.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="card-static p-6 hover:border-primary/30 transition-all duration-300"
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Cliente */}
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <Users className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-white font-semibold">{pedido.cliente}</p>
                        <p className="text-text-muted text-sm">{pedido.telefone}</p>
                      </div>
                    </div>

                    {/* Veículo */}
                    <div>
                      <div className="flex items-center gap-2 text-text-muted text-sm mb-1">
                        <Car className="w-4 h-4" />
                        Veículo
                      </div>
                      <p className="text-white font-medium">{pedido.veiculo}</p>
                      <p className="text-text-secondary text-sm">Cor: {pedido.cor}</p>
                    </div>

                    {/* Pagamento */}
                    <div>
                      <p className="text-text-muted text-sm mb-1">Pagamento</p>
                      <p className="text-accent font-bold text-lg">{formatPrice(pedido.valor)}</p>
                      <p className="text-text-secondary text-sm">
                        {pedido.pagamento}
                        {pedido.parcelas > 1 && ` (${pedido.parcelas}x)`}
                      </p>
                    </div>
                  </div>

                  {/* Status e Ações */}
                  <div className="flex flex-row lg:flex-col items-center lg:items-end gap-4">
                    <span className={`px-4 py-2 rounded-full text-sm font-medium ${status.bg} ${status.color}`}>
                      {status.label}
                    </span>

                    <div className="flex items-center gap-2 text-text-muted text-sm">
                      <Calendar className="w-4 h-4" />
                      {formatDate(pedido.data)}
                    </div>

                    {pedido.status === 'PENDING' && (
                      <button
                        onClick={() => handleStartAttendance(pedido.id)}
                        disabled={updatingStatus === pedido.id}
                        className="btn-primary !py-2 !px-4 flex items-center gap-2 text-sm"
                      >
                        {updatingStatus === pedido.id ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Iniciando...
                          </>
                        ) : (
                          <>
                            <Headphones className="w-4 h-4" />
                            Iniciar Atendimento
                          </>
                        )}
                      </button>
                    )}

                    <Link
                      href={`/dashboard/pedidos/${pedido.id}`}
                      className="btn-secondary !py-2 !px-4 flex items-center gap-2 text-sm"
                    >
                      <Eye className="w-4 h-4" />
                      Ver Pedido
                    </Link>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}

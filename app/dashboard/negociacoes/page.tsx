'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { 
  MessageSquare, 
  Car, 
  Users,
  Calendar,
  ChevronDown,
  MessageCircle,
  RefreshCw,
  Clock,
  CheckCircle,
  AlertCircle,
  ImageIcon,
  Headphones,
  Eye
} from 'lucide-react'
import { motion } from 'framer-motion'

interface Negociacao {
  id: string
  cliente: {
    id: string
    nome: string
    telefone: string
    email: string
  }
  veiculo: {
    id: string
    nome: string
    ano: number
    preco: number
    imageUrl: string
  }
  tipo: string
  status: string
  criadoEm: string
  ultimaMensagem: string | null
}

const statusLabels: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  OPEN: { label: 'Aguardando Atendimento', color: 'text-yellow-400', bg: 'bg-yellow-500/20', icon: Clock },
  PENDING: { label: 'Aguardando Atendimento', color: 'text-yellow-400', bg: 'bg-yellow-500/20', icon: Clock },
  IN_PROGRESS: { label: 'Em Negociação', color: 'text-blue-400', bg: 'bg-blue-500/20', icon: MessageCircle },
  ACCEPTED: { label: 'Aceita', color: 'text-green-400', bg: 'bg-green-500/20', icon: CheckCircle },
  REJECTED: { label: 'Rejeitada', color: 'text-red-400', bg: 'bg-red-500/20', icon: AlertCircle },
  CLOSED: { label: 'Fechada', color: 'text-gray-400', bg: 'bg-gray-500/20', icon: CheckCircle },
  COMPLETED: { label: 'Concluída', color: 'text-green-400', bg: 'bg-green-500/20', icon: CheckCircle },
  CANCELLED: { label: 'Cancelada', color: 'text-red-400', bg: 'bg-red-500/20', icon: AlertCircle },
}

const tipoLabels: Record<string, string> = {
  COMPRA: 'Compra de Veículo',
  VENDA: 'Venda de Veículo',
  TROCA: 'Troca de Veículo',
}

const statusOptions = [
  { value: 'TODOS', label: 'Todos os Status' },
  { value: 'PENDING', label: 'Aguardando Atendimento' },
  { value: 'IN_PROGRESS', label: 'Em Negociação' },
  { value: 'COMPLETED', label: 'Concluída' },
  { value: 'CANCELLED', label: 'Cancelada' },
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

function formatRelativeTime(date: string): string {
  const now = new Date()
  const then = new Date(date)
  const diffMs = now.getTime() - then.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Agora'
  if (diffMins < 60) return `${diffMins}min atrás`
  if (diffHours < 24) return `${diffHours}h atrás`
  if (diffDays === 1) return 'Ontem'
  return `${diffDays} dias atrás`
}

export default function NegociacoesPage() {
  const router = useRouter()
  const [negociacoes, setNegociacoes] = useState<Negociacao[]>([])
  const [loading, setLoading] = useState(true)
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

  async function fetchNegociacoes() {
    setLoading(true)
    try {
      const response = await fetch('/api/dashboard/negotiations')
      const data = await response.json()
      setNegociacoes(data)
    } catch (error) {
      console.error('Erro ao buscar negociações:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleStartAttendance(negociacaoId: string) {
    setUpdatingStatus(negociacaoId)
    try {
      // Primeiro, atualizar o status
      const statusResponse = await fetch(`/api/dashboard/negotiations/${negociacaoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'IN_PROGRESS' }),
      })

      if (statusResponse.ok) {
        // Obter nome do funcionário
        const employeeName = getEmployeeName()
        
        // Enviar mensagem automática
        try {
          await fetch(`/api/dashboard/negotiations/${negociacaoId}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content: 'Olá! Estou iniciando o atendimento. Como posso ajudar?',
            }),
          })
        } catch (messageError) {
          console.error('Erro ao enviar mensagem automática:', messageError)
          // Não bloquear se a mensagem falhar, apenas logar
        }

        // Atualizar o status localmente
        setNegociacoes((prev) =>
          prev.map((neg) =>
            neg.id === negociacaoId ? { ...neg, status: 'IN_PROGRESS' } : neg
          )
        )
        
        // Redirecionar para a página de chat
        router.push(`/dashboard/negociacoes/${negociacaoId}`)
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

  useEffect(() => {
    fetchNegociacoes()
  }, [])

  const negociacoesFiltradas = negociacoes.filter((neg) => {
    if (statusFilter === 'TODOS') return true
    return neg.status === statusFilter
  })

  // Contadores por status
  const contadores = {
    pendentes: negociacoes.filter((n) => n.status === 'OPEN' || n.status === 'PENDING').length,
    emAndamento: negociacoes.filter((n) => n.status === 'IN_PROGRESS').length,
    concluidas: negociacoes.filter((n) => n.status === 'ACCEPTED' || n.status === 'CLOSED' || n.status === 'COMPLETED').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-primary" />
            Negociações
          </h1>
          <p className="text-text-secondary mt-1">
            Gerencie as negociações iniciadas pelos clientes
          </p>
        </div>
        <button
          onClick={fetchNegociacoes}
          className="btn-secondary flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-static p-5 flex items-center gap-4"
        >
          <div className="p-3 bg-yellow-500/20 rounded-xl">
            <Clock className="w-6 h-6 text-yellow-400" />
          </div>
          <div>
            <p className="text-text-muted text-sm">Aguardando</p>
            <p className="text-2xl font-bold text-white">{contadores.pendentes}</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-static p-5 flex items-center gap-4"
        >
          <div className="p-3 bg-blue-500/20 rounded-xl">
            <MessageCircle className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <p className="text-text-muted text-sm">Em Negociação</p>
            <p className="text-2xl font-bold text-white">{contadores.emAndamento}</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card-static p-5 flex items-center gap-4"
        >
          <div className="p-3 bg-green-500/20 rounded-xl">
            <CheckCircle className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <p className="text-text-muted text-sm">Concluídas</p>
            <p className="text-2xl font-bold text-white">{contadores.concluidas}</p>
          </div>
        </motion.div>
      </div>

      {/* Filtro */}
      <div className="card-static p-4">
        <div className="flex items-center gap-4">
          <span className="text-text-muted text-sm">Filtrar por status:</span>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field pr-10 appearance-none cursor-pointer min-w-[200px]"
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

      {/* Lista de Negociações */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
            <p className="text-text-secondary">Carregando negociações...</p>
          </div>
        </div>
      ) : negociacoesFiltradas.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-static p-12 text-center"
        >
          <MessageSquare className="w-16 h-16 text-text-muted mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            {negociacoes.length === 0 
              ? 'Nenhuma negociação iniciada até o momento' 
              : 'Nenhuma negociação encontrada com este filtro'}
          </h3>
          <p className="text-text-secondary max-w-md mx-auto">
            {negociacoes.length === 0 
              ? 'Quando um cliente iniciar uma negociação no site, ela aparecerá aqui para você atender.'
              : 'Tente ajustar o filtro de status.'}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {negociacoesFiltradas.map((neg, index) => {
            const status = statusLabels[neg.status] || statusLabels.PENDING
            const StatusIcon = status.icon
            
            return (
              <motion.div
                key={neg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`card-static p-6 hover:border-primary/30 transition-all duration-300 ${
                  (neg.status === 'OPEN' || neg.status === 'PENDING') ? 'border-l-4 border-l-yellow-500' : ''
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                  {/* Info Principal */}
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Cliente */}
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <Users className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-white font-semibold">{neg.cliente.nome}</p>
                        <p className="text-text-muted text-sm">{neg.cliente.telefone || neg.cliente.email}</p>
                      </div>
                    </div>

                    {/* Veículo */}
                    <div className="flex items-center gap-4">
                      {/* Imagem do Veículo */}
                      <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-surface-border flex-shrink-0 bg-surface">
                        {neg.veiculo.imageUrl ? (
                          <Image
                            src={neg.veiculo.imageUrl}
                            alt={neg.veiculo.nome}
                            fill
                            className="object-cover"
                            sizes="80px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-surface">
                            <div className="text-center">
                              <ImageIcon className="w-6 h-6 text-text-muted mx-auto mb-1" />
                              <p className="text-[10px] text-text-muted px-1">Sem imagem</p>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-text-muted text-sm mb-1">
                          <Car className="w-4 h-4" />
                          Veículo
                        </div>
                        <p className="text-white font-medium truncate">{neg.veiculo.nome}</p>
                        <p className="text-accent font-semibold">{formatPrice(neg.veiculo.preco)}</p>
                      </div>
                    </div>

                    {/* Data e Tipo */}
                    <div>
                      <div className="flex items-center gap-2 text-text-muted text-sm mb-1">
                        <Calendar className="w-4 h-4" />
                        {formatRelativeTime(neg.criadoEm)}
                      </div>
                      <p className="text-text-secondary text-sm">{tipoLabels[neg.tipo] || neg.tipo}</p>
                      {neg.ultimaMensagem && (
                        <p className="text-text-muted text-xs mt-1 truncate max-w-[200px]">
                          💬 {neg.ultimaMensagem}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Status e Ações */}
                  <div className="flex flex-row lg:flex-col items-center lg:items-end gap-4">
                    <span className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 ${status.bg} ${status.color}`}>
                      <StatusIcon className="w-4 h-4" />
                      {status.label}
                    </span>
                    
                    {(neg.status === 'OPEN' || neg.status === 'PENDING') && (
                      <button
                        onClick={() => handleStartAttendance(neg.id)}
                        disabled={updatingStatus === neg.id}
                        className="btn-primary !py-2 !px-4 flex items-center gap-2 text-sm"
                      >
                        {updatingStatus === neg.id ? (
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
                      href={`/dashboard/negociacoes/${neg.id}`}
                      className="btn-secondary !py-2 !px-4 flex items-center gap-2 text-sm"
                    >
                      <Eye className="w-4 h-4" />
                      Ver Chat
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


'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Send, 
  Car, 
  Users,
  Calendar,
  CreditCard,
  Palette,
  Phone,
  CheckCircle,
  MessageSquare,
  Loader2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNotifications } from '@/hooks/useNotifications'
import { NotificationToast } from '@/components/TypingIndicator'

interface Message {
  id: string
  content: string
  createdAt: string
  sender: 'funcionario' | 'cliente'
  senderName: string
}

interface Pedido {
  id: string
  cliente: {
    nome: string
    telefone: string
    rg: string
  }
  veiculo: {
    id: string
    nome: string
    ano: number
    cor: string
  }
  pagamento: {
    metodo: string
    parcelas: number
    valorTotal: number
    valorParcela: number
  }
  status: string
  dataPedido: string
  entrega?: {
    data: string | null
    observacoes?: string
  }
}

const statusLabels: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: 'Pendente', color: 'text-blue-400', bg: 'bg-blue-500/20' },
  PROCESSING: { label: 'Em Processamento', color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  COMPLETED: { label: 'Finalizado', color: 'text-green-400', bg: 'bg-green-500/20' },
  CANCELLED: { label: 'Cancelado', color: 'text-red-400', bg: 'bg-red-500/20' },
}

const statusOptions = ['PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED']

function formatPrice(price: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
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

function formatTime(date: string): string {
  return new Date(date).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function PedidoDetalhePage() {
  const params = useParams()
  const router = useRouter()
  const pedidoId = params.id as string

  const [pedido, setPedido] = useState<Pedido | null>(null)
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  
  // Estados para notificações
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState({ title: '', message: '' })
  const prevMessagesCountRef = useRef<number>(0)
  
  // Estados para animação de finalização
  const [isCompleting, setIsCompleting] = useState(false)
  const [isFadingOut, setIsFadingOut] = useState(false)

  // Agendamento de entrega
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [deliveryDateInput, setDeliveryDateInput] = useState('')
  const [deliveryNotes, setDeliveryNotes] = useState('')
  const [savingSchedule, setSavingSchedule] = useState(false)
  const [scheduleError, setScheduleError] = useState('')
  
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  
  // Hook de notificações
  const { playSound, notifyNewMessage, isTabActive } = useNotifications()

  // Buscar dados do pedido e mensagens
  useEffect(() => {
    async function fetchData() {
      try {
        // Buscar pedido
        const orderResponse = await fetch(`/api/dashboard/orders/${pedidoId}`)
        if (orderResponse.ok) {
          const data = await orderResponse.json()
          setPedido(data)
        } else {
          setPedido(null)
        }

        // Buscar mensagens do chat
        const chatResponse = await fetch(`/api/pedido/${pedidoId}/chat`)
        if (chatResponse.ok) {
          const chatData = await chatResponse.json()
          const initialMessages = chatData.messages || []
          setMessages(initialMessages)
          // IMPORTANTE: Inicializar o contador de mensagens
          prevMessagesCountRef.current = initialMessages.length
          console.log('📋 [Dashboard Pedidos] Carregamento inicial:', {
            messagesCount: initialMessages.length,
          })
        }
      } catch (error) {
        console.error('Erro ao buscar dados:', error)
        setPedido(null)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [pedidoId])

  // Polling para novas mensagens + verificar mensagens do cliente
  useEffect(() => {
    // Não fazer polling se o pedido estiver finalizado ou se estiver completando
    if (pedido?.status === 'COMPLETED' || isCompleting) return
    
    const interval = setInterval(async () => {
      if (!pedidoId) return
      try {
        const response = await fetch(`/api/pedido/${pedidoId}/chat`)
        if (response.ok) {
          const data = await response.json()
          if (data.messages && data.messages.length > messages.length) {
            // Verificar se é uma mensagem de cliente
            const lastNewMessage = data.messages[data.messages.length - 1]
            
            console.log('📩 [Dashboard Pedidos] Nova mensagem detectada:', {
              senderName: lastNewMessage?.senderName,
              sender: lastNewMessage?.sender,
              prevCount: prevMessagesCountRef.current,
              newCount: data.messages.length,
            })
            
            if (lastNewMessage && lastNewMessage.sender === 'cliente') {
              // Notificar apenas se não for a primeira carga
              if (prevMessagesCountRef.current > 0) {
                console.log('🔔 [Dashboard Pedidos] Disparando notificação!')
                
                // SEMPRE tocar som
                playSound()
                
                // SEMPRE mostrar toast
                setToastMessage({
                  title: `${lastNewMessage.senderName || pedido?.cliente.nome || 'Cliente'}`,
                  message: lastNewMessage.content,
                })
                setShowToast(true)
                setTimeout(() => setShowToast(false), 4000)
                
                // Se aba em segundo plano, também mostrar notificação do navegador
                if (!isTabActive()) {
                  notifyNewMessage(
                    lastNewMessage.senderName || pedido?.cliente.nome || 'Cliente',
                    lastNewMessage.content,
                    'pedido'
                  )
                }
              } else {
                console.log('⏭️ [Dashboard Pedidos] Primeira carga - não notificar')
              }
            } else {
              console.log('⏭️ [Dashboard Pedidos] Mensagem própria (funcionário) - não notificar')
            }
            
            setMessages(data.messages)
            prevMessagesCountRef.current = data.messages.length
          }
        }
      } catch (error) {
        // Silenciar erros de polling
      }
    }, 2000) // A cada 2 segundos (mais rápido que antes)

    return () => clearInterval(interval)
  }, [pedidoId, messages.length, pedido?.cliente.nome, pedido?.status, isCompleting, playSound, notifyNewMessage, isTabActive])

  function scrollToBottom() {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!newMessage.trim() || sending) return

    setSending(true)
    const messageContent = newMessage.trim()
    setNewMessage('')

    try {
      const response = await fetch(`/api/pedido/${pedidoId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: messageContent,
          sender: 'funcionario',
          senderName: 'AutoPier',
        }),
      })

      if (response.ok) {
        const sentMessage = await response.json()
        setMessages((prev) => [...prev, sentMessage])
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  async function handleStatusChange(newStatus: string) {
    if (!pedido) return

    // Se for finalizar, iniciar processo de animação
    if (newStatus === 'COMPLETED') {
      setIsCompleting(true)
      
      try {
        await fetch(`/api/dashboard/orders/${pedidoId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        })
        
        // Atualizar estado local
        setPedido({ ...pedido, status: newStatus })
        
        // Iniciar animação de desvanecimento após um pequeno delay
        setTimeout(() => {
          setIsFadingOut(true)
        }, 500)
        
        // Redirecionar após 3 segundos
        setTimeout(() => {
          router.push('/dashboard/pedidos')
        }, 3000)
      } catch (error) {
        console.error('Erro ao atualizar status:', error)
        setIsCompleting(false)
      }
    } else {
      // Para outros status, apenas atualizar normalmente
      try {
        await fetch(`/api/dashboard/orders/${pedidoId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        })
        setPedido({ ...pedido, status: newStatus })
      } catch (error) {
        console.error('Erro ao atualizar status:', error)
      }
    }
  }

  async function handleScheduleDelivery(e: React.FormEvent) {
    e.preventDefault()
    if (!pedido) return

    setScheduleError('')

    if (!deliveryDateInput) {
      setScheduleError('Selecione data e horário da entrega.')
      return
    }

    try {
      setSavingSchedule(true)

      const isoDate = new Date(deliveryDateInput).toISOString()

      const response = await fetch(`/api/dashboard/orders/${pedidoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deliveryDate: isoDate,
          deliveryNotes,
        }),
      })

      if (!response.ok) {
        throw new Error('Erro ao salvar agendamento')
      }

      setPedido({
        ...pedido,
        entrega: {
          data: isoDate,
          observacoes: deliveryNotes,
        },
      })

      setShowScheduleModal(false)
    } catch (error) {
      console.error(error)
      setScheduleError('Não foi possível salvar o agendamento. Tente novamente.')
    } finally {
      setSavingSchedule(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-text-secondary">Carregando pedido...</p>
        </div>
      </div>
    )
  }

  if (!pedido) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Car className="w-16 h-16 text-text-muted mx-auto" />
          <h3 className="text-xl font-semibold text-white">Pedido não encontrado</h3>
          <p className="text-text-secondary">
            O pedido solicitado não existe ou foi removido.
          </p>
          <Link href="/dashboard/pedidos" className="btn-primary inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Voltar para Pedidos
          </Link>
        </div>
      </div>
    )
  }

  const currentStatus = statusLabels[pedido.status] || statusLabels.PENDING

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 1 }}
      animate={{ opacity: isFadingOut ? 0 : 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {/* Toast de Notificação */}
      <NotificationToast
        show={showToast}
        title={toastMessage.title}
        message={toastMessage.message}
        onClose={() => setShowToast(false)}
      />
      
      {/* Mensagem de Finalização */}
      {isCompleting && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-static p-6 bg-green-500/10 border-green-500/30"
        >
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-400" />
            <div className="flex-1">
              <h3 className="text-white font-semibold">Pedido Finalizado!</h3>
              <p className="text-text-secondary text-sm">
                O pedido foi marcado como finalizado e contará como venda. Redirecionando...
              </p>
            </div>
          </div>
        </motion.div>
      )}
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/pedidos"
            className="p-2 hover:bg-surface rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div>
            <h1 className="text-2xl font-display font-bold text-white">
              Pedido #{pedidoId.slice(0, 8)}
            </h1>
            <p className="text-text-secondary">
              {formatDate(pedido.dataPedido)}
            </p>
          </div>
        </div>

        {/* Seletor de Status */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-text-muted text-sm">Status:</span>
          <div className="flex gap-2 flex-wrap">
            {statusOptions.map((s) => {
              const statusInfo = statusLabels[s]
              const isActive = pedido.status === s
              return (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? `${statusInfo.bg} ${statusInfo.color} ring-2 ring-offset-2 ring-offset-background ring-current`
                      : 'bg-surface text-text-muted hover:text-white'
                  }`}
                >
                  {statusInfo.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Principal - Chat */}
        <div className="lg:col-span-2 card-static flex flex-col overflow-hidden">
          {/* Header do Chat */}
          <div className="p-5 border-b border-surface-border">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Chat com {pedido.cliente.nome}</h3>
                <p className="text-text-muted text-sm">Alinhe os detalhes da entrega</p>
              </div>
            </div>
          </div>

          {/* Área de Mensagens */}
          <div 
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto p-5 space-y-4 min-h-[350px] max-h-[450px]"
          >
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-center">
                <div>
                  <MessageSquare className="w-12 h-12 text-text-muted mx-auto mb-3" />
                  <p className="text-text-secondary">Nenhuma mensagem ainda</p>
                  <p className="text-text-muted text-sm">Inicie a conversa com o cliente!</p>
                </div>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {messages.map((message) => {
                  const isOwn = message.sender === 'funcionario'
                  return (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, x: isOwn ? 20 : -20, y: 10 }}
                      animate={{ opacity: 1, x: 0, y: 0 }}
                      transition={{ 
                        duration: 0.25, 
                        ease: "easeOut",
                        type: "spring",
                        stiffness: 500,
                        damping: 30
                      }}
                      className={`flex w-full ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[70%] min-w-[80px] ${isOwn ? 'items-end' : 'items-start'}`}>
                        {!isOwn && (
                          <p className="text-xs text-text-muted mb-1 px-1">
                            {message.senderName}
                          </p>
                        )}
                        
                        <motion.div 
                          initial={{ scale: 0.95 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.15, ease: "easeOut" }}
                          className={`inline-block ${isOwn ? 'chat-bubble-sent' : 'chat-bubble-received'}`}
                        >
                          <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
                          <p className={`text-xs mt-1.5 ${isOwn ? 'text-white/60' : 'text-text-muted'}`}>
                            {formatTime(message.createdAt)}
                          </p>
                        </motion.div>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            )}
          </div>

          {/* Input de Mensagem */}
          {pedido.status !== 'COMPLETED' && !isCompleting && (
            <form onSubmit={handleSendMessage} className="p-5 border-t border-surface-border bg-surface-dark/50">
              <div className="flex items-center gap-4">
                <input
                  ref={inputRef}
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      if (newMessage.trim() && !sending) {
                        handleSendMessage(e as unknown as React.FormEvent)
                      }
                    }
                  }}
                  placeholder="Digite sua mensagem..."
                  className="flex-1 input-field !py-3.5 text-base"
                  disabled={sending || isCompleting}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending || isCompleting}
                  className="btn-primary !p-3.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            </form>
          )}
          
          {/* Mensagem de Chat Fechado */}
          {(pedido.status === 'COMPLETED' || isCompleting) && (
            <div className="p-5 border-t border-surface-border bg-surface-dark/50">
              <div className="flex items-center justify-center gap-3 text-text-muted">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <p className="text-sm">Chat encerrado - Pedido finalizado</p>
              </div>
            </div>
          )}
        </div>

        {/* Coluna Lateral - Detalhes */}
        <div className="space-y-5">
          {/* Cliente */}
          <div className="card-static p-6 space-y-4">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Dados do Cliente
            </h3>
            
            <div className="space-y-3">
              <div>
                <p className="text-text-muted text-sm">Nome Completo</p>
                <p className="text-white font-medium">{pedido.cliente.nome}</p>
              </div>
              <div>
                <p className="text-text-muted text-sm">RG</p>
                <p className="text-white">{pedido.cliente.rg}</p>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-text-muted" />
                <a href={`tel:${pedido.cliente.telefone}`} className="text-primary hover:underline">
                  {pedido.cliente.telefone}
                </a>
              </div>
            </div>
          </div>

          {/* Veículo */}
          <div className="card-static p-6 space-y-4">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Car className="w-5 h-5 text-primary" />
              Veículo
            </h3>
            
            <div className="space-y-3">
              <div>
                <p className="text-text-muted text-sm">Modelo</p>
                <p className="text-white font-medium">{pedido.veiculo.nome}</p>
              </div>
              <div>
                <p className="text-text-muted text-sm">Ano</p>
                <p className="text-white">{pedido.veiculo.ano}</p>
              </div>
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-text-muted" />
                <span className="text-white">{pedido.veiculo.cor}</span>
              </div>
            </div>
          </div>

          {/* Pagamento */}
          <div className="card-static p-6 space-y-4">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              Pagamento
            </h3>
            
            <div className="space-y-3">
              <div>
                <p className="text-text-muted text-sm">Forma de Pagamento</p>
                <p className="text-white font-medium">{pedido.pagamento.metodo}</p>
              </div>
              {pedido.pagamento.parcelas > 1 && (
                <div>
                  <p className="text-text-muted text-sm">Parcelas</p>
                  <p className="text-white">
                    {pedido.pagamento.parcelas}x de {formatPrice(pedido.pagamento.valorParcela)}
                  </p>
                </div>
              )}
              <div className="pt-3 border-t border-surface-border">
                <p className="text-text-muted text-sm">Valor Total</p>
                <p className="text-accent font-bold text-2xl">
                  {formatPrice(pedido.pagamento.valorTotal)}
                </p>
              </div>

              {/* Entrega agendada */}
              {pedido.entrega?.data && (
                <div className="pt-3 border-t border-surface-border space-y-1">
                  <p className="text-text-muted text-sm">Entrega Agendada</p>
                  <p className="text-white font-medium">
                    {formatDate(pedido.entrega.data)}
                  </p>
                  {pedido.entrega.observacoes && (
                    <p className="text-text-secondary text-xs">
                      Observações: {pedido.entrega.observacoes}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Ações */}
          <div className="card-static p-6 space-y-3">
            <button 
              onClick={() => handleStatusChange('COMPLETED')}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              Marcar como Finalizado
            </button>
            <button 
              type="button"
              onClick={() => {
                setScheduleError('')
                setDeliveryDateInput(
                  pedido.entrega?.data
                    ? new Date(pedido.entrega.data).toISOString().slice(0, 16)
                    : ''
                )
                setDeliveryNotes(pedido.entrega?.observacoes || '')
                setShowScheduleModal(true)
              }}
              className="btn-secondary w-full flex items-center justify-center gap-2"
            >
              <Calendar className="w-5 h-5" />
              Agendar Entrega
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Agendamento de Entrega */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="card-static w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Agendar Entrega
              </h3>
              <button
                type="button"
                onClick={() => setShowScheduleModal(false)}
                className="text-text-muted hover:text-white transition-colors text-sm"
              >
                Fechar
              </button>
            </div>

            <p className="text-text-secondary text-sm">
              Defina a data e horário da entrega deste veículo para o cliente.
            </p>

            <form onSubmit={handleScheduleDelivery} className="space-y-4 mt-2">
              <div className="space-y-2">
                <label className="text-sm text-text-muted">
                  Data e horário da entrega
                </label>
                <input
                  type="datetime-local"
                  value={deliveryDateInput}
                  onChange={(e) => setDeliveryDateInput(e.target.value)}
                  className="input-field w-full"
                  min={new Date().toISOString().slice(0, 16)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-text-muted">
                  Observações (opcional)
                </label>
                <textarea
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  className="input-field w-full min-h-[80px] resize-none"
                  placeholder="Ex: Entregar na casa do cliente, confirmar documentos, etc."
                />
              </div>

              {scheduleError && (
                <p className="text-red-400 text-sm">{scheduleError}</p>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="btn-secondary px-4"
                  disabled={savingSchedule}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary px-4 flex items-center gap-2"
                  disabled={savingSchedule}
                >
                  {savingSchedule ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Salvar Agendamento
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  )
}

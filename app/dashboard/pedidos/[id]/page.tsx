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

  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState({ title: '', message: '' })
  const prevMessagesCountRef = useRef<number>(0)

  const [isCompleting, setIsCompleting] = useState(false)
  const [isFadingOut, setIsFadingOut] = useState(false)

  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [deliveryDateInput, setDeliveryDateInput] = useState('')
  const [deliveryNotes, setDeliveryNotes] = useState('')
  const [savingSchedule, setSavingSchedule] = useState(false)
  const [scheduleError, setScheduleError] = useState('')

  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const isFetchingRef = useRef(false)

  const { playSound, notifyNewMessage, isTabActive } = useNotifications()

  useEffect(() => {
    async function fetchData() {
      try {

        const orderResponse = await fetch(`/api/dashboard/orders/${pedidoId}`)
        if (orderResponse.ok) {
          const data = await orderResponse.json()
          setPedido(data)
        } else {
          setPedido(null)
        }

        const chatResponse = await fetch(`/api/pedido/${pedidoId}/chat`)
        if (chatResponse.ok) {
          const chatData = await chatResponse.json()
          const initialMessages = chatData.messages || []
          setMessages(initialMessages)

          prevMessagesCountRef.current = initialMessages.length
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

  useEffect(() => {
    if (pedido?.status === 'COMPLETED' || isCompleting) return
    if (!pedidoId) return

    let isPolling = true
    let lastMessageCount = prevMessagesCountRef.current || messages.length

    const pollMessages = async () => {
      if (!isPolling || !pedidoId || isFetchingRef.current) return

      isFetchingRef.current = true
      try {
        const response = await fetch(`/api/pedido/${pedidoId}/chat`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        })
        
        if (!response.ok) {
          isFetchingRef.current = false
          return
        }

        const data = await response.json()
        if (data.messages && Array.isArray(data.messages)) {
          const newMessageCount = data.messages.length

          if (newMessageCount > lastMessageCount) {
            const lastNewMessage = data.messages[data.messages.length - 1]

            if (lastNewMessage && lastNewMessage.sender === 'cliente' && lastMessageCount > 0) {
              const clienteNome = lastNewMessage.senderName || pedido?.cliente?.nome || 'Cliente'
              playSound()
              setToastMessage({
                title: clienteNome,
                message: lastNewMessage.content,
              })
              setShowToast(true)
              setTimeout(() => setShowToast(false), 4000)

              if (!isTabActive()) {
                notifyNewMessage(
                  clienteNome,
                  lastNewMessage.content,
                  'pedido'
                )
              }
            }

            setMessages(data.messages)
            lastMessageCount = newMessageCount
            prevMessagesCountRef.current = newMessageCount
          } else if (newMessageCount === lastMessageCount && data.messages.length > 0) {
            setMessages(data.messages)
          }
        }
      } catch (error) {
        console.error('Erro ao buscar mensagens:', error)
      } finally {
        isFetchingRef.current = false
      }
    }

    const interval = setInterval(pollMessages, 3000)

    return () => {
      isPolling = false
      clearInterval(interval)
    }
  }, [pedidoId, pedido?.status, isCompleting, playSound, notifyNewMessage, isTabActive, pedido?.cliente?.nome])

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
      const employeeName = getEmployeeName()
      const response = await fetch(`/api/pedido/${pedidoId}/chat`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({
          content: messageContent,
          sender: 'funcionario',
          senderName: employeeName,
        }),
      })

      if (response.ok) {
        const sentMessage = await response.json()
        setMessages((prev) => [...prev, sentMessage])
        prevMessagesCountRef.current = messages.length + 1
      } else {
        const errorData = await response.json()
        console.error('Erro ao enviar mensagem:', errorData)
        setNewMessage(messageContent)
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      setNewMessage(messageContent)
    } finally {
      setSending(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  async function handleStatusChange(newStatus: string) {
    if (!pedido) return

    if (pedido.status === 'PENDING' && newStatus === 'PROCESSING') {
      try {
        await fetch(`/api/pedido/${pedidoId}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: 'Olá! Estou iniciando o atendimento do seu pedido. Como posso ajudar?',
            sender: 'funcionario',
            senderName: 'AutoPier',
          }),
        })
      } catch (messageError) {
        console.error('Erro ao enviar mensagem automática:', messageError)

      }
    }

    if (newStatus === 'COMPLETED') {
      setIsCompleting(true)

      try {
        await fetch(`/api/dashboard/orders/${pedidoId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        })

        setPedido({ ...pedido, status: newStatus })

        setTimeout(() => {
          setIsFadingOut(true)
        }, 500)

        setTimeout(() => {
          router.push('/dashboard/pedidos')
        }, 3000)
      } catch (error) {
        console.error('Erro ao atualizar status:', error)
        setIsCompleting(false)
      }
    } else {

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
      className="space-y-4"
      initial={{ opacity: 1 }}
      animate={{ opacity: isFadingOut ? 0 : 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <NotificationToast
        show={showToast}
        title={toastMessage.title}
        message={toastMessage.message}
        onClose={() => setShowToast(false)}
      />

      {isCompleting && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-static p-4 bg-green-500/10 border-green-500/30"
        >
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <div className="flex-1">
              <h3 className="text-white font-semibold text-sm">Pedido Finalizado!</h3>
              <p className="text-text-secondary text-xs">
                O pedido foi marcado como finalizado e contará como venda. Redirecionando...
              </p>
            </div>
          </div>
        </motion.div>
      )}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/pedidos"
            className="p-2 hover:bg-surface rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div>
            <h1 className="text-xl font-display font-bold text-white">
              Pedido #{pedidoId.slice(0, 8)}
            </h1>
            <p className="text-text-secondary text-sm">
              {formatDate(pedido.dataPedido)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-text-muted text-xs">Status:</span>
          <div className="flex gap-1.5 flex-wrap">
            {statusOptions.map((s) => {
              const statusInfo = statusLabels[s]
              const isActive = pedido.status === s
              return (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card-static flex flex-col overflow-hidden">
          <div className="p-4 border-b border-surface-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">Chat com {pedido.cliente.nome}</h3>
                <p className="text-text-muted text-xs">Alinhe os detalhes da entrega</p>
              </div>
            </div>
          </div>

          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px] max-h-[400px]"
          >
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-center">
                <div>
                  <MessageSquare className="w-10 h-10 text-text-muted mx-auto mb-2" />
                  <p className="text-text-secondary text-sm">Nenhuma mensagem ainda</p>
                  <p className="text-text-muted text-xs">Inicie a conversa com o cliente!</p>
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

          {}
          {pedido.status !== 'COMPLETED' && !isCompleting && (
            <form onSubmit={handleSendMessage} className="p-4 border-t border-surface-border bg-surface-dark/50">
              <div className="flex items-center gap-3">
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
                  className="flex-1 input-field !py-2.5 text-sm"
                  disabled={sending || isCompleting}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending || isCompleting}
                  className="btn-primary !p-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </form>
          )}

          {(pedido.status === 'COMPLETED' || isCompleting) && (
            <div className="p-4 border-t border-surface-border bg-surface-dark/50">
              <div className="flex items-center justify-center gap-2 text-text-muted">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <p className="text-xs">Chat encerrado - Pedido finalizado</p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="card-static p-4 space-y-3">
            <h3 className="font-semibold text-white text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Dados do Cliente
            </h3>

            <div className="space-y-2">
              <div>
                <p className="text-text-muted text-xs">Nome Completo</p>
                <p className="text-white font-medium text-sm">{pedido.cliente.nome}</p>
              </div>
              <div>
                <p className="text-text-muted text-xs">RG</p>
                <p className="text-white text-sm">{pedido.cliente.rg}</p>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-text-muted" />
                <a href={`tel:${pedido.cliente.telefone}`} className="text-primary hover:underline text-sm">
                  {pedido.cliente.telefone}
                </a>
              </div>
            </div>
          </div>

          <div className="card-static p-4 space-y-3">
            <h3 className="font-semibold text-white text-sm flex items-center gap-2">
              <Car className="w-4 h-4 text-primary" />
              Veículo
            </h3>

            <div className="space-y-2">
              <div>
                <p className="text-text-muted text-xs">Modelo</p>
                <p className="text-white font-medium text-sm">{pedido.veiculo.nome}</p>
              </div>
              <div>
                <p className="text-text-muted text-xs">Ano</p>
                <p className="text-white text-sm">{pedido.veiculo.ano}</p>
              </div>
              <div className="flex items-center gap-2">
                <Palette className="w-3.5 h-3.5 text-text-muted" />
                <span className="text-white text-sm">{pedido.veiculo.cor}</span>
              </div>
            </div>
          </div>

          <div className="card-static p-4 space-y-3">
            <h3 className="font-semibold text-white text-sm flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary" />
              Pagamento
            </h3>

            <div className="space-y-2">
              <div>
                <p className="text-text-muted text-xs">Forma de Pagamento</p>
                <p className="text-white font-medium text-sm">{pedido.pagamento.metodo}</p>
              </div>
              {pedido.pagamento.parcelas > 1 && (
                <div>
                  <p className="text-text-muted text-xs">Parcelas</p>
                  <p className="text-white text-sm">
                    {pedido.pagamento.parcelas}x de {formatPrice(pedido.pagamento.valorParcela)}
                  </p>
                </div>
              )}
              <div className="pt-2 border-t border-surface-border">
                <p className="text-text-muted text-xs">Valor Total</p>
                <p className="text-accent font-bold text-xl">
                  {formatPrice(pedido.pagamento.valorTotal)}
                </p>
              </div>

              {pedido.entrega?.data && (
                <div className="pt-2 border-t border-surface-border space-y-1">
                  <p className="text-text-muted text-xs">Entrega Agendada</p>
                  <p className="text-white font-medium text-sm">
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

          <div className="card-static p-4 space-y-2">
            <button
              onClick={() => handleStatusChange('COMPLETED')}
              className="btn-primary w-full flex items-center justify-center gap-2 !py-2.5 text-sm"
            >
              <CheckCircle className="w-4 h-4" />
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
              className="btn-secondary w-full flex items-center justify-center gap-2 !py-2.5 text-sm"
            >
              <Calendar className="w-4 h-4" />
              Agendar Entrega
            </button>
          </div>
        </div>
      </div>

      {}
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

'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft,
  Send,
  Car,
  Users,
  Calendar,
  Phone,
  Mail,
  DollarSign,
  Clock,
  CheckCircle,
  MessageCircle,
  Loader2,
  AlertCircle,
  Bell,
  ImageIcon
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNotifications } from '@/hooks/useNotifications'
import TypingIndicator, { NotificationToast } from '@/components/TypingIndicator'

interface Message {
  id: string
  content: string
  createdAt: string
  sender: 'funcionario' | 'cliente'
  senderName: string
}

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
  mensagens: Message[]
}

const statusLabels: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: 'Aguardando Atendimento', color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  IN_PROGRESS: { label: 'Em Negociação', color: 'text-blue-400', bg: 'bg-blue-500/20' },
  COMPLETED: { label: 'Concluída', color: 'text-green-400', bg: 'bg-green-500/20' },
  CANCELLED: { label: 'Cancelada', color: 'text-red-400', bg: 'bg-red-500/20' },
}

const statusOptions = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']

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

function formatTime(date: string): string {
  return new Date(date).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function NegociacaoChatPage() {
  const params = useParams()
  const router = useRouter()
  const negociacaoId = params.id as string

  const [negociacao, setNegociacao] = useState<Negociacao | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
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

  const [otherUserTyping, setOtherUserTyping] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState({ title: '', message: '' })
  const lastTypingSentRef = useRef<number>(0)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const prevMessagesCountRef = useRef<number>(0)

  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { permission, requestPermission, notifyNewMessage, playSound, isTabActive } = useNotifications()

  useEffect(() => {
    async function fetchNegociacao() {
      try {
        const response = await fetch(`/api/dashboard/negotiations/${negociacaoId}`)
        if (response.ok) {
          const data = await response.json()
          setNegociacao(data)
          setMessages(data.mensagens || [])

          prevMessagesCountRef.current = (data.mensagens || []).length
          console.log('📋 [Dashboard] Carregamento inicial:', {
            messagesCount: (data.mensagens || []).length,
          })
        } else {
          setNegociacao(null)
        }
      } catch (error) {
        console.error('Erro ao buscar negociação:', error)
        setNegociacao(null)
      } finally {
        setLoading(false)
      }
    }
    fetchNegociacao()
  }, [negociacaoId])

  useEffect(() => {
    const interval = setInterval(async () => {
      if (!negociacaoId) return
      try {

        const response = await fetch(`/api/dashboard/negotiations/${negociacaoId}/messages`)
        if (response.ok) {
          const newMessages = await response.json()
          if (newMessages.length > messages.length) {

            const lastNewMessage = newMessages[newMessages.length - 1]

            console.log('📩 [Dashboard] Nova mensagem detectada:', {
              senderName: lastNewMessage?.senderName,
              sender: lastNewMessage?.sender,
              prevCount: prevMessagesCountRef.current,
              newCount: newMessages.length,
            })

            if (lastNewMessage && lastNewMessage.sender === 'cliente') {

              if (prevMessagesCountRef.current > 0) {
                console.log('🔔 [Dashboard] Disparando notificação!')

                playSound()

                setToastMessage({
                  title: `${lastNewMessage.senderName || 'Cliente'}`,
                  message: lastNewMessage.content,
                })
                setShowToast(true)
                setTimeout(() => setShowToast(false), 4000)

                if (!isTabActive()) {
                  notifyNewMessage(
                    lastNewMessage.senderName || 'Cliente',
                    lastNewMessage.content,
                    'negociacao'
                  )
                }
              } else {
                console.log('⏭️ [Dashboard] Primeira carga - não notificar')
              }
            } else {
              console.log('⏭️ [Dashboard] Mensagem própria (funcionário) - não notificar')
            }
            setMessages(newMessages)
            prevMessagesCountRef.current = newMessages.length
          }
        }

        const typingResponse = await fetch(`/api/typing?chatId=${negociacaoId}`)
        if (typingResponse.ok) {
          const typingData = await typingResponse.json()
          setOtherUserTyping(typingData.typing && typingData.userName !== 'AutoPier')
        }
      } catch (error) {
        console.error('Erro ao buscar mensagens:', error)
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [negociacaoId, messages.length, notifyNewMessage, playSound, isTabActive])

  const sendTypingStatus = useCallback(async (typing: boolean) => {
    if (!negociacaoId) return
    try {
      await fetch('/api/typing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: negociacaoId,
          userName: 'AutoPier',
          typing,
        }),
      })
    } catch (error) {

    }
  }, [negociacaoId])

  const handleTyping = useCallback(() => {
    const now = Date.now()

    if (now - lastTypingSentRef.current > 2000) {
      lastTypingSentRef.current = now
      sendTypingStatus(true)
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      sendTypingStatus(false)
    }, 3000)
  }, [sendTypingStatus])

  useEffect(() => {
    if (permission === 'default') {

      const timer = setTimeout(() => {
        requestPermission()
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [permission, requestPermission])

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      sendTypingStatus(false)
    }
  }, [sendTypingStatus])

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
      const response = await fetch(`/api/dashboard/negotiations/${negociacaoId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: messageContent }),
      })

      if (response.ok) {
        const sentMessage = await response.json()
        setMessages((prev) => [...prev, sentMessage])

        if (negociacao?.status === 'PENDING') {
          setNegociacao({ ...negociacao, status: 'IN_PROGRESS' })
        }
      } else {

        const employeeName = getEmployeeName()
        const localMessage: Message = {
          id: `msg-${Date.now()}`,
          content: messageContent,
          createdAt: new Date().toISOString(),
          sender: 'funcionario',
          senderName: employeeName,
        }
        setMessages((prev) => [...prev, localMessage])
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)

      const localMessage: Message = {
        id: `msg-${Date.now()}`,
        content: messageContent,
        createdAt: new Date().toISOString(),
        sender: 'funcionario',
        senderName: 'AutoPier',
      }
      setMessages((prev) => [...prev, localMessage])
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  async function handleStatusChange(newStatus: string) {
    if (!negociacao) return

    try {
      await fetch(`/api/dashboard/negotiations/${negociacaoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      setNegociacao({ ...negociacao, status: newStatus })
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-text-secondary">Carregando negociação...</p>
        </div>
      </div>
    )
  }

  if (!negociacao) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <AlertCircle className="w-16 h-16 text-text-muted mx-auto" />
          <h3 className="text-xl font-semibold text-white">Negociação não encontrada</h3>
          <p className="text-text-secondary">
            A negociação solicitada não existe ou foi removida.
          </p>
          <Link href="/dashboard/negociacoes" className="btn-primary inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Voltar para Negociações
          </Link>
        </div>
      </div>
    )
  }

  const currentStatus = statusLabels[negociacao.status] || statusLabels.PENDING

  return (
    <div className="space-y-6">
      {}
      <NotificationToast
        show={showToast}
        title={toastMessage.title}
        message={toastMessage.message}
        onClose={() => setShowToast(false)}
      />

      {}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/negociacoes"
            className="p-2 hover:bg-surface rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div>
            <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
              <MessageCircle className="w-6 h-6 text-primary" />
              Chat com {negociacao.cliente.nome}
            </h1>
            <p className="text-text-secondary text-sm">
              Iniciado em {formatDate(negociacao.criadoEm)}
            </p>
          </div>
        </div>

        {}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-text-muted text-sm">Status:</span>
          <div className="flex gap-2 flex-wrap">
            {statusOptions.map((s) => {
              const statusInfo = statusLabels[s]
              const isActive = negociacao.status === s
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {}
        <div className="lg:col-span-2 card-static flex flex-col overflow-hidden">
          {}
          <div className="p-5 border-b border-surface-border bg-surface-dark/30">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold">{negociacao.cliente.nome}</h3>
                <p className="text-text-muted text-sm">
                  Negociando: {negociacao.veiculo.nome}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${currentStatus.bg} ${currentStatus.color}`}>
                {currentStatus.label}
              </span>
            </div>
          </div>

          {}
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto p-5 space-y-4 min-h-[400px] max-h-[500px]"
          >
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-center">
                <div>
                  <MessageCircle className="w-12 h-12 text-text-muted mx-auto mb-3" />
                  <p className="text-text-secondary">Nenhuma mensagem ainda</p>
                  <p className="text-text-muted text-sm">
                    Envie a primeira mensagem para iniciar a negociação!
                  </p>
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

            {}
            <TypingIndicator
              isTyping={otherUserTyping}
              userName={negociacao.cliente.nome}
            />
          </div>

          {}
          <form onSubmit={handleSendMessage} className="p-5 border-t border-surface-border bg-surface-dark/50">
            <div className="flex items-center gap-4">
              <input
                ref={inputRef}
                type="text"
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value)
                  handleTyping()
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    if (newMessage.trim() && !sending) {
                      sendTypingStatus(false)
                      handleSendMessage(e as unknown as React.FormEvent)
                    }
                  }
                }}
                placeholder="Digite sua mensagem..."
                className="flex-1 input-field !py-3.5 text-base"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || sending}
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
        </div>

        {}
        <div className="space-y-5">
          {}
          <div className="card-static overflow-hidden">
            <div className="relative h-40 bg-surface-dark">
              {negociacao.veiculo.imageUrl ? (
                <Image
                  src={negociacao.veiculo.imageUrl}
                  alt={negociacao.veiculo.nome}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 400px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-surface">
                  <div className="text-center">
                    <ImageIcon className="w-12 h-12 text-text-muted mx-auto mb-2" />
                    <p className="text-text-muted text-sm">Sem imagem</p>
                  </div>
                </div>
              )}
            </div>
            <div className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Car className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-white">Veículo em Negociação</h3>
              </div>
              <div>
                <p className="text-white font-medium text-lg">{negociacao.veiculo.nome}</p>
                <p className="text-text-muted">Ano: {negociacao.veiculo.ano}</p>
              </div>
              <div className="pt-3 border-t border-surface-border">
                <p className="text-text-muted text-sm">Valor</p>
                <p className="text-accent font-bold text-2xl">
                  {formatPrice(negociacao.veiculo.preco)}
                </p>
              </div>
            </div>
          </div>

          {}
          <div className="card-static p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-white">Dados do Cliente</h3>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-text-muted text-sm">Nome</p>
                <p className="text-white font-medium">{negociacao.cliente.nome}</p>
              </div>
              {negociacao.cliente.telefone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-text-muted" />
                  <a href={`tel:${negociacao.cliente.telefone}`} className="text-primary hover:underline">
                    {negociacao.cliente.telefone}
                  </a>
                </div>
              )}
              {negociacao.cliente.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-text-muted" />
                  <a href={`mailto:${negociacao.cliente.email}`} className="text-primary hover:underline text-sm">
                    {negociacao.cliente.email}
                  </a>
                </div>
              )}
            </div>
          </div>

          {}
          <div className="card-static p-5 space-y-3">
            <h3 className="font-semibold text-white">Ações Rápidas</h3>

            <button
              onClick={() => handleStatusChange('COMPLETED')}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              Concluir Negociação
            </button>

            <button
              onClick={() => setNewMessage(`Olá ${negociacao.cliente.nome}! Obrigado pelo interesse no ${negociacao.veiculo.nome}. Como posso ajudar?`)}
              className="btn-secondary w-full flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-5 h-5" />
              Saudação Rápida
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}


'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Send, 
  Car, 
  DollarSign, 
  Calendar, 
  Gauge,
  User,
  Clock,
  CheckCircle,
  XCircle,
  MessageCircle,
  Bell
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNotifications } from '@/hooks/useNotifications'
import TypingIndicator, { NotificationToast } from '@/components/TypingIndicator'
import NameModal from '@/components/NameModal'
import { getUserName, setUserName, hasUserName } from '@/lib/userName'

// Interfaces
interface Message {
  id: string
  content: string
  createdAt: string
  sender: {
    id: string
    name: string
    role: string
  }
}

interface Negotiation {
  id: string
  type: string
  status: string
  vehicleName: string | null
  vehicleBrand: string | null
  vehicleYear: number | null
  vehicleMileage: number | null
  proposedPrice: number | null
  vehicleDescription: string | null
  buyer: {
    id: string
    name: string
    role: string
  }
  seller: {
    id: string
    name: string
    role: string
  }
  messages: Message[]
  createdAt: string
}

// Status labels
const statusLabels: Record<string, { label: string; color: string }> = {
  OPEN: { label: 'Aberta', color: 'bg-blue-500' },
  IN_PROGRESS: { label: 'Em Andamento', color: 'bg-yellow-500' },
  ACCEPTED: { label: 'Aceita', color: 'bg-green-500' },
  REJECTED: { label: 'Rejeitada', color: 'bg-red-500' },
  CLOSED: { label: 'Fechada', color: 'bg-gray-500' },
}

// Função para formatar preço
function formatPrice(price: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
  }).format(price)
}

// Função para formatar data
function formatDate(date: string): string {
  return new Date(date).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Função para formatar hora
function formatTime(date: string): string {
  return new Date(date).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function ChatPage() {
  const params = useParams()
  const router = useRouter()
  const negotiationId = params.id as string
  
  const [negotiation, setNegotiation] = useState<Negotiation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [showNameModal, setShowNameModal] = useState(false)
  const [userName, setUserNameState] = useState<string | null>(null)
  
  // Estados para notificações e digitação
  const [otherUserTyping, setOtherUserTyping] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState({ title: '', message: '' })
  const lastTypingSentRef = useRef<number>(0)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const prevMessagesCountRef = useRef<number>(0)
  
  // Hook de notificações
  const { permission, requestPermission, notifyNewMessage, playSound, isTabActive } = useNotifications()

  // Verificar nome ao carregar
  useEffect(() => {
    const name = getUserName()
    if (!hasUserName()) {
      setShowNameModal(true)
      setLoading(false)
    } else {
      setUserNameState(name)
    }
  }, [])

  // Handler para quando o nome for informado
  function handleNameSubmit(name: string) {
    setUserName(name)
    setUserNameState(name)
    setShowNameModal(false)
    setLoading(true)
    // Recarregar dados após salvar o nome
    fetchNegotiation()
  }

  // Scroll para última mensagem (dentro do container, sem mover a página)
  function scrollToBottom() {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }

  // Buscar dados da negociação
  async function fetchNegotiation() {
    if (!userName) return
    
    try {
      const url = `/api/negociacao/${negotiationId}?customerName=${encodeURIComponent(userName)}`
      
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.error) {
        if (response.status === 403) {
          alert('Acesso negado. Esta negociação não pertence a você.')
          router.push('/cliente')
          return
        }
        router.push('/negociacao')
        return
      }
      
      setNegotiation(data)
      setMessages(data.messages || [])
      // IMPORTANTE: Inicializar o contador de mensagens para evitar notificação na primeira carga
      prevMessagesCountRef.current = (data.messages || []).length
      // Por simplicidade, assumimos que o usuário atual é o buyer
      setCurrentUserId(data.buyer?.id || 'user-1')
      console.log('📋 Carregamento inicial:', {
        messagesCount: (data.messages || []).length,
        userId: data.buyer?.id,
      })
    } catch (error) {
      console.error('Erro ao buscar negociação:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (userName) {
      fetchNegotiation()
    }
  }, [negotiationId, userName, router])


  // Scroll quando mensagens atualizam
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Polling para novas mensagens + verificar digitação
  useEffect(() => {
    if (!userName || !negotiationId) return
    
    const interval = setInterval(async () => {
      try {
        // Buscar novas mensagens
        const response = await fetch(`/api/chat?negotiationId=${negotiationId}&customerName=${encodeURIComponent(userName)}`)
        if (response.ok) {
          const newMessages = await response.json()
          if (newMessages.length > messages.length) {
            // Verificar se é uma mensagem de outra pessoa
            const lastNewMessage = newMessages[newMessages.length - 1]
            
            console.log('📩 Nova mensagem detectada:', {
              senderName: lastNewMessage?.sender?.name,
              senderId: lastNewMessage?.sender?.id,
              currentUserId,
              prevCount: prevMessagesCountRef.current,
              newCount: newMessages.length,
            })
            
            if (lastNewMessage && lastNewMessage.sender?.id !== currentUserId) {
              // Notificar apenas se não for a primeira carga
              if (prevMessagesCountRef.current > 0) {
                console.log('🔔 Disparando notificação!')
                
                // SEMPRE tocar som
                playSound()
                
                // SEMPRE mostrar toast
                setToastMessage({
                  title: `${lastNewMessage.sender?.name || 'AutoPier'}`,
                  message: lastNewMessage.content,
                })
                setShowToast(true)
                setTimeout(() => setShowToast(false), 4000)
                
                // Se aba em segundo plano, também mostrar notificação do navegador
                if (!isTabActive()) {
                  notifyNewMessage(
                    lastNewMessage.sender?.name || 'AutoPier',
                    lastNewMessage.content,
                    'negociacao'
                  )
                }
              } else {
                console.log('⏭️ Primeira carga - não notificar')
              }
            } else {
              console.log('⏭️ Mensagem própria - não notificar')
            }
            setMessages(newMessages)
            prevMessagesCountRef.current = newMessages.length
          }
        }

        // Verificar se alguém está digitando
        const typingResponse = await fetch(`/api/typing?chatId=${negotiationId}`)
        if (typingResponse.ok) {
          const typingData = await typingResponse.json()
          setOtherUserTyping(typingData.typing && typingData.userName !== currentUserId)
        }
      } catch (error) {
        // Silenciar erros de polling
      }
    }, 2000) // A cada 2 segundos

    return () => clearInterval(interval)
  }, [negotiationId, messages.length, currentUserId, userName, notifyNewMessage, playSound, isTabActive])

  // Enviar status de digitação
  const sendTypingStatus = useCallback(async (typing: boolean) => {
    if (!negotiationId || !negotiation?.buyer?.name) return
    try {
      await fetch('/api/typing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: negotiationId,
          userName: negotiation.buyer.name,
          typing,
        }),
      })
    } catch (error) {
      // Erro silencioso
    }
  }, [negotiationId, negotiation?.buyer?.name])

  // Handler para digitação
  const handleTyping = useCallback(() => {
    const now = Date.now()
    
    // Evitar spam - só enviar a cada 2 segundos
    if (now - lastTypingSentRef.current > 2000) {
      lastTypingSentRef.current = now
      sendTypingStatus(true)
    }

    // Resetar timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Parar de digitar após 3 segundos de inatividade
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingStatus(false)
    }, 3000)
  }, [sendTypingStatus])

  // Solicitar permissão de notificação
  useEffect(() => {
    if (permission === 'default') {
      // Solicitar após 3 segundos para não ser intrusivo
      const timer = setTimeout(() => {
        requestPermission()
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [permission, requestPermission])

  // Limpar timeout ao desmontar
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      sendTypingStatus(false)
    }
  }, [sendTypingStatus])

  // Enviar mensagem
  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!newMessage.trim() || sending || !negotiation || !userName) return

    setSending(true)
    const messageContent = newMessage.trim()
    setNewMessage('')

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          negotiationId,
          senderId: currentUserId,
          content: messageContent,
          customerName: userName,
        }),
      })

      const savedMessage = await response.json()

      // Adicionar mensagem localmente
      const localMessage: Message = {
        id: savedMessage.id || `temp-${Date.now()}`,
        content: messageContent,
        createdAt: new Date().toISOString(),
        sender: {
          id: currentUserId,
          name: negotiation.buyer?.name || userName,
          role: 'CUSTOMER',
        },
      }

      setMessages((prev) => [...prev, localMessage])
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  // Mostrar modal de nome se necessário
  if (showNameModal) {
    return (
      <NameModal
        isOpen={showNameModal}
        onNameSubmit={handleNameSubmit}
      />
    )
  }

  // Loading state
  if (loading || !userName) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="spinner mx-auto" />
          <p className="text-text-secondary">Carregando negociação...</p>
        </div>
      </div>
    )
  }

  // Negociação não encontrada
  if (!negotiation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <MessageCircle className="w-16 h-16 text-text-muted mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Negociação não encontrada</h1>
          <Link href="/negociacao" className="btn-primary mt-4 inline-block">
            Voltar
          </Link>
        </div>
      </div>
    )
  }

  const status = statusLabels[negotiation.status] || statusLabels.OPEN

  return (
    <div className="min-h-screen flex flex-col">
      {/* Toast de Notificação */}
      <NotificationToast
        show={showToast}
        title={toastMessage.title}
        message={toastMessage.message}
        onClose={() => setShowToast(false)}
      />

      {/* Header */}
      <div className="sticky top-[80px] z-40 bg-background-secondary border-b border-surface-border">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link
                href="/negociacao"
                className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-text-secondary" />
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-semibold text-white">
                    {negotiation.type === 'SELL' ? 'Venda' : 'Compra'}: {negotiation.vehicleBrand} {negotiation.vehicleName}
                  </h1>
                  <span className={`px-2 py-0.5 text-xs font-medium text-white rounded-full ${status.color}`}>
                    {status.label}
                  </span>
                </div>
                <p className="text-text-muted text-sm">
                  Negociação com {negotiation.seller.name}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
          {/* Painel de Chat */}
          <div className="lg:col-span-2 flex flex-col bg-surface rounded-2xl border border-surface-border shadow-lg overflow-hidden">
            {/* Área de Mensagens */}
            <div 
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-5 space-y-4 min-h-[400px] max-h-[520px]"
            >
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-center">
                  <div>
                    <MessageCircle className="w-12 h-12 text-text-muted mx-auto mb-3" />
                    <p className="text-text-secondary">Nenhuma mensagem ainda</p>
                    <p className="text-text-muted text-sm">Inicie a conversa!</p>
                  </div>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                {messages.map((message) => {
                  const isOwn = message.sender.id === currentUserId
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
                        {/* Nome do remetente */}
                        {!isOwn && (
                          <p className="text-xs text-text-muted mb-1 px-1">
                            {message.sender.name}
                          </p>
                        )}
                        
                        {/* Bolha da mensagem */}
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
              
              {/* Indicador de Digitação */}
              <TypingIndicator 
                isTyping={otherUserTyping} 
                userName={negotiation.seller.name}
              />
            </div>

            {/* Input de Mensagem */}
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

          {/* Painel de Detalhes */}
          <div className="space-y-5">
            {/* Detalhes do Veículo */}
            <div className="card-static p-6 space-y-5 shadow-lg">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Car className="w-5 h-5 text-primary" />
                Detalhes do Veículo
              </h3>
              
              <div className="space-y-4">
                {negotiation.vehicleBrand && (
                  <div className="flex justify-between text-[15px]">
                    <span className="text-text-muted">Marca</span>
                    <span className="text-white font-medium">{negotiation.vehicleBrand}</span>
                  </div>
                )}
                {negotiation.vehicleName && (
                  <div className="flex justify-between text-[15px]">
                    <span className="text-text-muted">Modelo</span>
                    <span className="text-white font-medium">{negotiation.vehicleName}</span>
                  </div>
                )}
                {negotiation.vehicleYear && (
                  <div className="flex justify-between text-[15px]">
                    <span className="text-text-muted">Ano</span>
                    <span className="text-white font-medium">{negotiation.vehicleYear}</span>
                  </div>
                )}
                {negotiation.vehicleMileage && (
                  <div className="flex justify-between text-[15px]">
                    <span className="text-text-muted">Quilometragem</span>
                    <span className="text-white font-medium">{negotiation.vehicleMileage.toLocaleString('pt-BR')} km</span>
                  </div>
                )}
                {negotiation.proposedPrice && (
                  <div className="flex justify-between text-[15px] pt-3 border-t border-surface-border">
                    <span className="text-text-muted">Valor Proposto</span>
                    <span className="text-accent font-bold text-lg">
                      {formatPrice(negotiation.proposedPrice)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Participantes */}
            <div className="card-static p-6 space-y-5 shadow-lg">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Participantes
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 bg-primary/20 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-white text-[15px] font-medium">{negotiation.buyer.name}</p>
                    <p className="text-text-muted text-sm">Cliente</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 bg-accent/20 rounded-full flex items-center justify-center">
                    <Car className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-white text-[15px] font-medium">{negotiation.seller.name}</p>
                    <p className="text-text-muted text-sm">Concessionária</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="card-static p-6 space-y-4 shadow-lg">
              <div className="flex items-center gap-3 text-text-muted text-[15px]">
                <Clock className="w-5 h-5" />
                <span>Iniciada em {formatDate(negotiation.createdAt)}</span>
              </div>
              <div className="flex items-center gap-3 text-[15px]">
                <div className={`w-3 h-3 rounded-full ${status.color}`} />
                <span className="text-text-secondary">Status: <span className="text-white font-medium">{status.label}</span></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


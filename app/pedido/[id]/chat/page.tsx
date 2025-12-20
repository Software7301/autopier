'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Send, 
  ShoppingCart,
  MessageCircle,
  Clock,
  CheckCircle,
  Loader2,
  Bell
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNotifications } from '@/hooks/useNotifications'
import TypingIndicator, { NotificationToast } from '@/components/TypingIndicator'
import NameModal from '@/components/NameModal'
import { getUserName, setUserName, hasUserName } from '@/lib/userName'

interface Message {
  id: string
  content: string
  createdAt: string
  sender: 'cliente' | 'funcionario'
  senderName: string
}

const statusLabels: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  PENDING: { label: 'Aguardando', color: 'text-yellow-400', icon: Clock },
  PROCESSING: { label: 'Em Processamento', color: 'text-blue-400', icon: MessageCircle },
  COMPLETED: { label: 'Finalizado', color: 'text-green-400', icon: CheckCircle },
}

function formatTime(date: string): string {
  return new Date(date).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function PedidoChatPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string

  const [customerName, setCustomerName] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [showNameModal, setShowNameModal] = useState(false)
  const [userName, setUserNameState] = useState<string | null>(null)
  
  // Estados para notificações e digitação
  const [otherUserTyping, setOtherUserTyping] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState({ title: '', message: '' })
  const lastTypingSentRef = useRef<number>(0)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const prevMessagesCountRef = useRef<number>(0)
  
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  
  // Hook de notificações
  const { permission, requestPermission, notifyNewMessage, playSound, isTabActive } = useNotifications()

  useEffect(() => {
    const name = getUserName()
    if (!hasUserName()) {
      setShowNameModal(true)
      setLoading(false)
    } else if (name) {
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
    fetchChat()
  }

  async function fetchChat() {
    if (!userName) return
    
    try {
      const url = `/api/pedido/${orderId}/chat?customerName=${encodeURIComponent(userName)}`
      
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setCustomerName(data.customerName || userName)
        const safeMessages = Array.isArray(data.messages) ? data.messages : []
        setMessages(safeMessages)
        prevMessagesCountRef.current = safeMessages.length
      } else if (response.status === 403) {
        alert('Acesso negado. Este pedido não pertence a você.')
        window.location.href = '/cliente'
      }
    } catch (error) {
      console.error('Erro ao buscar chat:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (userName) {
      fetchChat()
    }
  }, [orderId, userName])

  useEffect(() => {
    if (!userName || !orderId) return
    
    const interval = setInterval(async () => {
      try {
        const url = `/api/pedido/${orderId}/chat?customerName=${encodeURIComponent(userName)}`
        
        const response = await fetch(url)
        if (response.ok) {
          const data = await response.json()
          const safeMessages = Array.isArray(data.messages) ? data.messages : []
          if (safeMessages.length > messages.length) {
            const lastNewMessage = safeMessages[safeMessages.length - 1]
            if (lastNewMessage && lastNewMessage.sender === 'funcionario') {
              if (prevMessagesCountRef.current > 0) {
                playSound()
                
                setToastMessage({
                  title: `${lastNewMessage.senderName || 'AutoPier'}`,
                  message: lastNewMessage.content,
                })
                setShowToast(true)
                setTimeout(() => setShowToast(false), 4000)
                
                if (!isTabActive()) {
                  notifyNewMessage(
                    lastNewMessage.senderName || 'AutoPier',
                    lastNewMessage.content,
                    'pedido'
                  )
                }
              }
            }
            setMessages(safeMessages)
            prevMessagesCountRef.current = safeMessages.length
          }
        }

        const typingResponse = await fetch(`/api/typing?chatId=order-${orderId}`)
        if (typingResponse.ok) {
          const typingData = await typingResponse.json()
          setOtherUserTyping(typingData.typing && typingData.userName !== customerName)
        }
      } catch (error) {
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [orderId, messages.length, customerName, userName, notifyNewMessage, playSound, isTabActive])

  const sendTypingStatus = useCallback(async (typing: boolean) => {
    if (!orderId || !customerName) return
    try {
      await fetch('/api/typing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: `order-${orderId}`,
          userName: customerName,
          typing,
        }),
      })
    } catch (error) {
    }
  }, [orderId, customerName])

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
    if (!newMessage.trim() || sending || !userName) {
      if (!userName) {
        alert('Erro: Nome do usuário não encontrado. Por favor, recarregue a página.')
      }
      return
    }

    setSending(true)
    sendTypingStatus(false)
    const messageContent = newMessage.trim()
    setNewMessage('')

    try {
      const response = await fetch(`/api/pedido/${orderId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: messageContent,
          sender: 'cliente',
          senderName: userName,
          customerName: userName,
        }),
      })

      if (response.ok) {
        const sentMessage = await response.json()
        setMessages((prev) => [...prev, sentMessage])
        prevMessagesCountRef.current = messages.length + 1
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Erro ao enviar mensagem' }))
        alert(errorData.error || 'Erro ao enviar mensagem')
        setNewMessage(messageContent)
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      alert('Erro ao enviar mensagem. Verifique sua conexão e tente novamente.')
      // Restaurar mensagem no input se houver erro
      setNewMessage(messageContent)
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  if (showNameModal) {
    return (
      <NameModal
        isOpen={showNameModal}
        onNameSubmit={handleNameSubmit}
      />
    )
  }

  if (loading || !userName) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-text-secondary">Carregando chat...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8">
      {/* Toast de Notificação */}
      <NotificationToast
        show={showToast}
        title={toastMessage.title}
        message={toastMessage.message}
        onClose={() => setShowToast(false)}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/"
            className="p-2 hover:bg-surface rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
              <ShoppingCart className="w-6 h-6 text-primary" />
              Chat do Pedido
            </h1>
            <p className="text-text-secondary text-sm">
              Pedido #{orderId.slice(0, 12)}
            </p>
          </div>
          
          {/* Indicador de permissão */}
          {permission === 'default' && (
            <button
              onClick={requestPermission}
              className="flex items-center gap-2 px-3 py-1.5 bg-primary/20 text-primary rounded-lg text-sm hover:bg-primary/30 transition-colors"
            >
              <Bell className="w-4 h-4" />
              Ativar notificações
            </button>
          )}
        </div>

        {/* Chat Card */}
        <div className="card-static flex flex-col overflow-hidden">
          {/* Header do Chat */}
          <div className="p-5 border-b border-surface-border bg-surface-dark/30">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Atendimento AutoPier</h3>
                <p className="text-text-muted text-sm">
                  Tire suas dúvidas e acompanhe seu pedido
                </p>
              </div>
            </div>
          </div>

          {/* Área de Mensagens */}
          <div 
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto p-5 space-y-4 min-h-[400px] max-h-[500px]"
          >
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-center">
                <div>
                  <MessageCircle className="w-12 h-12 text-text-muted mx-auto mb-3" />
                  <p className="text-text-secondary">Nenhuma mensagem ainda</p>
                  <p className="text-text-muted text-sm mt-2">
                    Envie uma mensagem para iniciar o atendimento!
                  </p>
                </div>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {messages.map((message) => {
                  const isOwn = message.sender === 'cliente'
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
                          <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
                            {message.content}
                          </p>
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
              userName="AutoPier"
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

        {/* Info Card */}
        <div className="card-static p-6 mt-6">
          <h3 className="font-semibold text-white mb-3">ℹ️ Informações</h3>
          <ul className="space-y-2 text-text-secondary text-sm">
            <li>• Nosso time responderá em breve</li>
            <li>• Você pode combinar a entrega do veículo</li>
            <li>• Tire dúvidas sobre pagamento e documentação</li>
            <li>• As mensagens ficam salvas para você acompanhar</li>
            <li>• 🔔 Ative as notificações para não perder mensagens</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

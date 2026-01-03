'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, ArrowRight, Bell } from 'lucide-react'

interface ActiveChat {
  id: string
  type: 'negotiation' | 'order'
  referenceId: string
  clientName: string
  vehicleName: string
  lastMessagePreview: string
  lastMessageAt: string
  unreadCount: number
  status: string
}

interface ActiveChatBannerProps {
  phone?: string
}

export default function ActiveChatBanner({ phone }: ActiveChatBannerProps) {
  const [activeChat, setActiveChat] = useState<ActiveChat | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkActiveChats() {

      const dismissedKey = 'autopier_chat_dismissed'
      const dismissedTime = sessionStorage.getItem(dismissedKey)
      if (dismissedTime) {
        const dismissedDate = new Date(dismissedTime)
        const now = new Date()

        if (now.getTime() - dismissedDate.getTime() < 30 * 60 * 1000) {
          setDismissed(true)
          setLoading(false)
          return
        }
      }

      const savedPhone = phone || localStorage.getItem('autopier_user_phone')

      if (!savedPhone) {
        setLoading(false)
        return
      }

      try {
        const response = await fetch('/api/chats/active', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: savedPhone }),
        })

        const data = await response.json()

        if (data.found && data.chat) {
          setActiveChat(data.chat)
        }
      } catch (error) {
        console.error('Erro ao verificar chats ativos:', error)
      } finally {
        setLoading(false)
      }
    }

    checkActiveChats()

    const interval = setInterval(checkActiveChats, 30000)
    return () => clearInterval(interval)
  }, [phone])

  function handleDismiss() {
    setDismissed(true)
    sessionStorage.setItem('autopier_chat_dismissed', new Date().toISOString())
  }

  function formatTime(dateString: string) {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()

    if (diff < 60 * 60 * 1000) {
      const minutes = Math.floor(diff / (60 * 1000))
      return minutes <= 1 ? 'agora mesmo' : `há ${minutes} min`
    }

    if (diff < 24 * 60 * 60 * 1000) {
      const hours = Math.floor(diff / (60 * 60 * 1000))
      return `há ${hours}h`
    }

    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  }

  if (loading || dismissed || !activeChat) {
    return null
  }

  const chatUrl = activeChat.type === 'negotiation'
    ? `/negociacao/${activeChat.referenceId}`
    : `/pedido/${activeChat.referenceId}/chat`

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed bottom-4 right-4 z-50 max-w-sm"
      >
        <div className="bg-surface border border-surface-border rounded-2xl shadow-2xl shadow-black/40 overflow-hidden">
          {}
          <div className="h-1.5 bg-gradient-to-r from-primary via-accent to-primary" />

          <div className="p-4">
            {}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <MessageCircle className="w-6 h-6 text-primary" />
                  </div>
                  {activeChat.unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {activeChat.unreadCount > 9 ? '9+' : activeChat.unreadCount}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm">
                    Conversa em andamento
                  </h3>
                  <p className="text-text-muted text-xs">
                    {activeChat.type === 'negotiation' ? 'Negociação' : 'Pedido'} • {formatTime(activeChat.lastMessageAt)}
                  </p>
                </div>
              </div>

              <button
                onClick={handleDismiss}
                className="text-text-muted hover:text-white transition-colors p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {}
            <div className="bg-surface-dark/50 rounded-xl p-3 mb-3">
              <p className="text-white font-medium text-sm mb-1">
                {activeChat.vehicleName}
              </p>
              {activeChat.lastMessagePreview && (
                <p className="text-text-secondary text-xs line-clamp-2">
                  "{activeChat.lastMessagePreview}"
                </p>
              )}
            </div>

            {}
            <Link
              href={chatUrl}
              className="w-full btn-primary flex items-center justify-center gap-2 text-sm py-2.5"
            >
              <MessageCircle className="w-4 h-4" />
              Acessar Chat
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

export function ActiveChatIndicator({ phone }: { phone?: string }) {
  const [hasActiveChat, setHasActiveChat] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [chatUrl, setChatUrl] = useState('')

  useEffect(() => {
    async function checkActiveChats() {
      const savedPhone = phone || localStorage.getItem('autopier_user_phone')

      if (!savedPhone) return

      try {
        const response = await fetch('/api/chats/active', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: savedPhone }),
        })

        const data = await response.json()

        if (data.found && data.chat) {
          setHasActiveChat(true)
          setUnreadCount(data.chat.unreadCount || 0)
          setChatUrl(
            data.chat.type === 'negotiation'
              ? `/negociacao/${data.chat.referenceId}`
              : `/pedido/${data.chat.referenceId}/chat`
          )
        } else {
          setHasActiveChat(false)
        }
      } catch (error) {
        console.error('Erro ao verificar chats:', error)
      }
    }

    checkActiveChats()
    const interval = setInterval(checkActiveChats, 15000)
    return () => clearInterval(interval)
  }, [phone])

  if (!hasActiveChat) return null

  return (
    <Link
      href={chatUrl}
      className="relative flex items-center gap-2 px-3 py-1.5 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg transition-colors text-sm font-medium"
    >
      <MessageCircle className="w-4 h-4" />
      <span className="hidden sm:inline">Chat</span>
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-accent text-white text-[10px] font-bold rounded-full flex items-center justify-center">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Link>
  )
}


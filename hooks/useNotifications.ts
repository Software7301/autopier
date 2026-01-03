'use client'

import { useEffect, useRef, useCallback, useState } from 'react'

interface NotificationOptions {
  title: string
  body: string
  icon?: string
  tag?: string
  onClick?: () => void
}

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const isTabActiveRef = useRef(true)

  useEffect(() => {

    if (typeof window !== 'undefined') {

      audioRef.current = new Audio('/sounds/notification.wav')
      audioRef.current.volume = 0.5

      audioRef.current.onerror = () => {
        console.log('Usando som gerado por Web Audio API')
        audioRef.current = null
      }

      if ('Notification' in window) {
        setPermission(Notification.permission)
      }
    }

    const handleVisibilityChange = () => {
      isTabActiveRef.current = !document.hidden
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  const requestPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const result = await Notification.requestPermission()
      setPermission(result)
      return result
    }
    return Notification.permission
  }, [])

  const playSound = useCallback(() => {
    console.log('🔊 Tentando tocar som de notificação...')

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

      const playTone = (frequency: number, startTime: number, duration: number) => {
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)

        oscillator.frequency.value = frequency
        oscillator.type = 'sine'

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + startTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + startTime + duration)

        oscillator.start(audioContext.currentTime + startTime)
        oscillator.stop(audioContext.currentTime + startTime + duration)
      }

      playTone(880, 0, 0.15)
      playTone(1174.66, 0.1, 0.2)

      console.log('🔊 Som tocado com sucesso!')
    } catch (e) {
      console.error('🔊 Erro ao tocar som:', e)

      if (audioRef.current) {
        audioRef.current.currentTime = 0
        audioRef.current.play().catch((err) => {
          console.error('🔊 Erro no fallback de áudio:', err)
        })
      }
    }
  }, [])

  const sendBrowserNotification = useCallback((options: NotificationOptions) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/images.png',
        tag: options.tag,
        badge: '/images.png',
        silent: true,
      })

      if (options.onClick) {
        notification.onclick = () => {
          window.focus()
          options.onClick?.()
          notification.close()
        }
      }

      setTimeout(() => notification.close(), 5000)
    }
  }, [])

  const notifyNewMessage = useCallback((
    senderName: string,
    messagePreview: string,
    type: 'negociacao' | 'pedido' = 'negociacao',
    onClick?: () => void
  ) => {

    if (!isTabActiveRef.current) {
      playSound()

      sendBrowserNotification({
        title: `Nova mensagem - AutoPier`,
        body: `${senderName}: ${messagePreview.slice(0, 50)}${messagePreview.length > 50 ? '...' : ''}`,
        tag: `message-${type}`,
        onClick,
      })
    }
  }, [playSound, sendBrowserNotification])

  const isTabActive = useCallback(() => isTabActiveRef.current, [])

  return {
    permission,
    requestPermission,
    playSound,
    sendBrowserNotification,
    notifyNewMessage,
    isTabActive,
  }
}

export function useTypingIndicator(chatId: string, userId: string) {
  const [isTyping, setIsTyping] = useState(false)
  const [otherUserTyping, setOtherUserTyping] = useState(false)
  const [otherUserName, setOtherUserName] = useState('')
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastTypingRef = useRef<number>(0)

  const sendTypingStatus = useCallback(async (typing: boolean) => {
    try {
      await fetch('/api/typing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId,
          typing,
          userName: userId,
        }),
      })
    } catch (error) {

    }
  }, [chatId, userId])

  const handleTyping = useCallback(() => {
    const now = Date.now()

    if (now - lastTypingRef.current > 2000) {
      lastTypingRef.current = now
      sendTypingStatus(true)
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    setIsTyping(true)

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      sendTypingStatus(false)
    }, 3000)
  }, [sendTypingStatus])

  const stopTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    setIsTyping(false)
    sendTypingStatus(false)
  }, [sendTypingStatus])

  useEffect(() => {
    const checkTypingStatus = async () => {
      try {
        const response = await fetch(`/api/typing?chatId=${chatId}`)
        if (response.ok) {
          const data = await response.json()
          if (data.typing && data.userName !== userId) {
            setOtherUserTyping(true)
            setOtherUserName(data.userName)
          } else {
            setOtherUserTyping(false)
          }
        }
      } catch (error) {

      }
    }

    const interval = setInterval(checkTypingStatus, 1500)
    return () => clearInterval(interval)
  }, [chatId, userId])

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

  return {
    isTyping,
    otherUserTyping,
    otherUserName,
    handleTyping,
    stopTyping,
  }
}


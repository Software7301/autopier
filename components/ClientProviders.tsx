'use client'

import { useEffect } from 'react'
import ActiveChatBanner from './ActiveChatBanner'

interface ClientProvidersProps {
  children: React.ReactNode
}

export default function ClientProviders({ children }: ClientProvidersProps) {

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {

      const timer = setTimeout(() => {
        Notification.requestPermission()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [])

  return (
    <>
      {children}
      <ActiveChatBanner />
    </>
  )
}


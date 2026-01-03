'use client'

import { motion, AnimatePresence } from 'framer-motion'

interface TypingIndicatorProps {
  isTyping: boolean
  userName?: string
  variant?: 'chat' | 'inline'
}

export default function TypingIndicator({
  isTyping,
  userName = 'Alguém',
  variant = 'chat'
}: TypingIndicatorProps) {
  if (variant === 'inline') {
    return (
      <AnimatePresence>
        {isTyping && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-text-muted text-sm italic"
          >
            {userName} está digitando
            <TypingDots />
          </motion.span>
        )}
      </AnimatePresence>
    )
  }

  return (
    <AnimatePresence>
      {isTyping && (
        <motion.div
          initial={{ opacity: 0, y: 10, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: 10, height: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="flex items-center gap-2 px-4 py-2"
        >
          <div className="flex items-center gap-3 bg-surface-dark/50 rounded-2xl px-4 py-2.5 border border-surface-border/50">
            {}
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-xs text-primary font-medium">
                {userName.charAt(0).toUpperCase()}
              </span>
            </div>

            {}
            <div className="flex items-center gap-1.5">
              <span className="text-text-muted text-sm">
                {userName} está digitando
              </span>
              <TypingDots />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-0.5 ml-0.5">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-1 h-1 bg-primary rounded-full"
          animate={{
            y: [0, -3, 0],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.15,
            ease: 'easeInOut',
          }}
        />
      ))}
    </span>
  )
}

interface NotificationToastProps {
  show: boolean
  title: string
  message: string
  onClose: () => void
  onClick?: () => void
}

export function NotificationToast({
  show,
  title,
  message,
  onClose,
  onClick
}: NotificationToastProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed top-24 right-4 z-[100] max-w-sm"
        >
          <div
            onClick={onClick}
            className={`bg-surface border border-surface-border rounded-xl shadow-2xl shadow-black/30 overflow-hidden ${onClick ? 'cursor-pointer hover:bg-surface-hover transition-colors' : ''}`}
          >
            {}
            <div className="h-1 bg-gradient-to-r from-primary to-accent" />

            <div className="p-4">
              <div className="flex items-start gap-3">
                {}
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm">{title}</p>
                  <p className="text-text-secondary text-sm mt-0.5 line-clamp-2">{message}</p>
                </div>

                {}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onClose()
                  }}
                  className="text-text-muted hover:text-white transition-colors p-1"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}


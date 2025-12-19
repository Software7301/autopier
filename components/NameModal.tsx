'use client'

import { useState, useEffect, useRef } from 'react'
import { User, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface NameModalProps {
  isOpen: boolean
  onNameSubmit: (name: string) => void
  currentName?: string
}

export default function NameModal({ isOpen, onNameSubmit, currentName }: NameModalProps) {
  const [name, setName] = useState(currentName || '')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen && inputRef.current) {
      // Focar no input quando o modal abrir
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [isOpen])

  useEffect(() => {
    if (currentName) {
      setName(currentName)
    }
  }, [currentName])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmedName = name.trim()
    if (trimmedName.length < 2) {
      alert('Por favor, informe um nome válido (mínimo 2 caracteres)')
      return
    }
    onNameSubmit(trimmedName)
  }

  // Modal obrigatório - não pode ser fechado
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999]"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="bg-surface border border-surface-border rounded-2xl shadow-2xl max-w-md w-full p-8 relative"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-display font-bold text-white mb-2">
                  Identificação Necessária
                </h2>
                <p className="text-text-secondary">
                  Para acessar suas negociações e pedidos, precisamos do seu nome
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="userName" className="block text-sm font-medium text-text-secondary mb-2">
                    Nome Completo ou Identificador *
                  </label>
                  <input
                    ref={inputRef}
                    type="text"
                    id="userName"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Digite seu nome"
                    className="input-field w-full"
                    required
                    minLength={2}
                    autoComplete="name"
                  />
                  <p className="text-text-muted text-xs mt-1">
                    Este nome será usado para identificar seus pedidos e negociações
                  </p>
                </div>

                <button
                  type="submit"
                  className="btn-primary w-full"
                  disabled={!name.trim() || name.trim().length < 2}
                >
                  Continuar
                </button>
              </form>

              {currentName && (
                <div className="mt-4 pt-4 border-t border-surface-border">
                  <button
                    onClick={() => {
                      if (confirm('Deseja realmente trocar de nome? Isso limpará seus dados locais e você precisará informar o nome novamente.')) {
                        localStorage.removeItem('negotiationUserName')
                        window.location.reload()
                      }
                    }}
                    className="text-sm text-text-muted hover:text-primary transition-colors w-full text-center"
                  >
                    Trocar nome
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}


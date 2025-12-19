/**
 * Utilitários para gerenciar o nome do usuário nas negociações
 */

const STORAGE_KEY = 'negotiationUserName'

/**
 * Obtém o nome do usuário do localStorage
 */
export function getUserName(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(STORAGE_KEY)
}

/**
 * Salva o nome do usuário no localStorage
 */
export function setUserName(name: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, name.trim())
}

/**
 * Remove o nome do usuário do localStorage
 */
export function clearUserName(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}

/**
 * Verifica se o usuário já tem um nome salvo
 */
export function hasUserName(): boolean {
  const name = getUserName()
  return name !== null && name.trim().length >= 2
}

/**
 * Obtém o nome do usuário ou retorna null se não existir
 */
export function requireUserName(): string | null {
  const name = getUserName()
  if (!name || name.trim().length < 2) {
    return null
  }
  return name.trim()
}


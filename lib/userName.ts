

const STORAGE_KEY = 'negotiationUserName'

export function getUserName(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(STORAGE_KEY)
}

export function setUserName(name: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, name.trim())
}

export function clearUserName(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}

export function hasUserName(): boolean {
  const name = getUserName()
  return name !== null && name.trim().length >= 2
}

export function requireUserName(): string | null {
  const name = getUserName()
  if (!name || name.trim().length < 2) {
    return null
  }
  return name.trim()
}


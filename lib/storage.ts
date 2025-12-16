// Sistema de armazenamento local para desenvolvimento
// Substitui o Prisma quando o banco de dados não está configurado

import fs from 'fs'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), '.data')
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json')
const NEGOTIATIONS_FILE = path.join(DATA_DIR, 'negotiations.json')
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json')
const CHAT_SESSIONS_FILE = path.join(DATA_DIR, 'chat_sessions.json')

// Garantir que o diretório existe
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

// Ler arquivo JSON
function readJsonFile<T>(filePath: string, defaultValue: T[]): T[] {
  ensureDataDir()
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8')
      return JSON.parse(data)
    }
  } catch (error) {
    console.error(`Erro ao ler ${filePath}:`, error)
  }
  return defaultValue
}

// Escrever arquivo JSON
function writeJsonFile<T>(filePath: string, data: T[]) {
  ensureDataDir()
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
  } catch (error) {
    console.error(`Erro ao escrever ${filePath}:`, error)
  }
}

// ========== ORDERS ==========
export interface LocalOrder {
  id: string
  carId: string
  customerName: string
  customerRg: string
  customerPhone: string
  paymentMethod: string
  installments: number
  selectedColor: string
  totalPrice: number
  status: string
  // Dados de entrega (opcional)
  deliveryDate?: string
  deliveryNotes?: string
  createdAt: string
  updatedAt: string
}

export function getOrders(): LocalOrder[] {
  return readJsonFile<LocalOrder>(ORDERS_FILE, [])
}

export function getOrderById(id: string): LocalOrder | undefined {
  const orders = getOrders()
  return orders.find(o => o.id === id)
}

export function createOrder(data: Omit<LocalOrder, 'id' | 'createdAt' | 'updatedAt'>): LocalOrder {
  const orders = getOrders()
  const now = new Date().toISOString()
  const order: LocalOrder = {
    ...data,
    id: `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: now,
    updatedAt: now,
  }
  orders.push(order)
  writeJsonFile(ORDERS_FILE, orders)
  return order
}

export function updateOrder(id: string, data: Partial<LocalOrder>): LocalOrder | null {
  const orders = getOrders()
  const index = orders.findIndex(o => o.id === id)
  if (index === -1) return null
  
  orders[index] = {
    ...orders[index],
    ...data,
    updatedAt: new Date().toISOString(),
  }
  writeJsonFile(ORDERS_FILE, orders)
  return orders[index]
}

// ========== NEGOTIATIONS ==========
export interface LocalNegotiation {
  id: string
  carId: string
  customerName: string
  customerPhone: string
  customerEmail: string
  type: string
  status: string
  vehicleName?: string
  vehicleBrand?: string
  vehicleYear?: number
  vehicleMileage?: number
  vehicleDescription?: string
  proposedPrice?: number
  vehicleInterest?: string
  message?: string
  createdAt: string
  updatedAt: string
}

export function getNegotiations(): LocalNegotiation[] {
  return readJsonFile<LocalNegotiation>(NEGOTIATIONS_FILE, [])
}

export function getNegotiationById(id: string): LocalNegotiation | undefined {
  const negotiations = getNegotiations()
  return negotiations.find(n => n.id === id)
}

export function createNegotiation(data: Omit<LocalNegotiation, 'id' | 'createdAt' | 'updatedAt'>): LocalNegotiation {
  const negotiations = getNegotiations()
  const now = new Date().toISOString()
  const negotiation: LocalNegotiation = {
    ...data,
    id: `neg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: now,
    updatedAt: now,
  }
  negotiations.push(negotiation)
  writeJsonFile(NEGOTIATIONS_FILE, negotiations)
  return negotiation
}

export function updateNegotiation(id: string, data: Partial<LocalNegotiation>): LocalNegotiation | null {
  const negotiations = getNegotiations()
  const index = negotiations.findIndex(n => n.id === id)
  if (index === -1) return null
  
  negotiations[index] = {
    ...negotiations[index],
    ...data,
    updatedAt: new Date().toISOString(),
  }
  writeJsonFile(NEGOTIATIONS_FILE, negotiations)
  return negotiations[index]
}

// ========== MESSAGES ==========
export interface LocalMessage {
  id: string
  negotiationId?: string
  orderId?: string
  content: string
  sender: 'cliente' | 'funcionario'
  senderName: string
  createdAt: string
}

export function getMessages(): LocalMessage[] {
  return readJsonFile<LocalMessage>(MESSAGES_FILE, [])
}

export function getMessagesByNegotiationId(negotiationId: string): LocalMessage[] {
  const messages = getMessages()
  return messages.filter(m => m.negotiationId === negotiationId).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )
}

export function getMessagesByOrderId(orderId: string): LocalMessage[] {
  const messages = getMessages()
  return messages.filter(m => m.orderId === orderId).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )
}

export function createMessage(data: Omit<LocalMessage, 'id' | 'createdAt'>): LocalMessage {
  const messages = getMessages()
  const message: LocalMessage = {
    ...data,
    id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
  }
  messages.push(message)
  writeJsonFile(MESSAGES_FILE, messages)
  return message
}

// ========== MOCK CAR DATA ==========
export const mockCars = [
  { id: 'suv-1', name: 'Volkswagen T-Cross', brand: 'Volkswagen', year: 2024, price: 139900, imageUrl: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800' },
  { id: 'suv-2', name: 'Hyundai Creta', brand: 'Hyundai', year: 2024, price: 149900, imageUrl: 'https://images.unsplash.com/photo-1619682817481-e994891cd1f5?w=800' },
  { id: 'suv-3', name: 'Honda HR-V', brand: 'Honda', year: 2024, price: 159900, imageUrl: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800' },
  { id: 'esp-1', name: 'BMW X5 M Sport', brand: 'BMW', year: 2024, price: 589000, imageUrl: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800' },
  { id: 'esp-2', name: 'Mercedes-Benz C300', brand: 'Mercedes-Benz', year: 2023, price: 389000, imageUrl: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800' },
  { id: 'esp-3', name: 'BMW M5 Competition', brand: 'BMW', year: 2024, price: 899000, imageUrl: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800' },
  { id: 'sedan-1', name: 'Chevrolet Onix Plus', brand: 'Chevrolet', year: 2024, price: 89900, imageUrl: 'https://images.unsplash.com/photo-1590362891991-f776e747a588?w=800' },
  { id: 'sedan-2', name: 'Hyundai HB20S', brand: 'Hyundai', year: 2024, price: 94900, imageUrl: 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=800' },
]

export function getCarById(carId: string) {
  return mockCars.find(c => c.id === carId) || { id: carId, name: 'Veículo', brand: 'N/A', year: 2024, price: 0, imageUrl: '' }
}

// ========== CHAT SESSIONS (Persistência) ==========
export interface ChatSession {
  id: string
  type: 'negotiation' | 'order'
  referenceId: string // negotiationId ou orderId
  
  // Identificação do cliente
  clientId: string
  clientName: string
  clientPhone: string
  
  // Dados do veículo/pedido
  vehicleName: string
  vehiclePrice: number
  
  // Status do chat
  status: 'active' | 'closed' | 'waiting_response'
  lastMessageAt: string
  lastMessagePreview: string
  unreadCount: number
  
  createdAt: string
  updatedAt: string
}

export function getChatSessions(): ChatSession[] {
  return readJsonFile<ChatSession>(CHAT_SESSIONS_FILE, [])
}

export function getChatSessionById(id: string): ChatSession | undefined {
  const sessions = getChatSessions()
  return sessions.find(s => s.id === id)
}

export function getChatSessionByReference(type: 'negotiation' | 'order', referenceId: string): ChatSession | undefined {
  const sessions = getChatSessions()
  return sessions.find(s => s.type === type && s.referenceId === referenceId)
}

export function getActiveChatsForClient(clientPhone: string): ChatSession[] {
  const sessions = getChatSessions()
  return sessions
    .filter(s => s.clientPhone === clientPhone && s.status !== 'closed')
    .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime())
}

export function getAllActiveChats(): ChatSession[] {
  const sessions = getChatSessions()
  return sessions
    .filter(s => s.status !== 'closed')
    .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime())
}

export function createChatSession(data: Omit<ChatSession, 'id' | 'createdAt' | 'updatedAt' | 'lastMessageAt' | 'lastMessagePreview' | 'unreadCount'>): ChatSession {
  const sessions = getChatSessions()
  const now = new Date().toISOString()
  
  // Verificar se já existe sessão para essa referência
  const existing = sessions.find(s => s.type === data.type && s.referenceId === data.referenceId)
  if (existing) {
    return existing
  }
  
  const session: ChatSession = {
    ...data,
    id: `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    lastMessageAt: now,
    lastMessagePreview: '',
    unreadCount: 0,
    createdAt: now,
    updatedAt: now,
  }
  sessions.push(session)
  writeJsonFile(CHAT_SESSIONS_FILE, sessions)
  return session
}

export function updateChatSession(id: string, data: Partial<ChatSession>): ChatSession | null {
  const sessions = getChatSessions()
  const index = sessions.findIndex(s => s.id === id)
  if (index === -1) return null
  
  sessions[index] = {
    ...sessions[index],
    ...data,
    updatedAt: new Date().toISOString(),
  }
  writeJsonFile(CHAT_SESSIONS_FILE, sessions)
  return sessions[index]
}

export function updateChatSessionByReference(
  type: 'negotiation' | 'order', 
  referenceId: string, 
  data: Partial<ChatSession>
): ChatSession | null {
  const sessions = getChatSessions()
  const index = sessions.findIndex(s => s.type === type && s.referenceId === referenceId)
  if (index === -1) return null
  
  sessions[index] = {
    ...sessions[index],
    ...data,
    updatedAt: new Date().toISOString(),
  }
  writeJsonFile(CHAT_SESSIONS_FILE, sessions)
  return sessions[index]
}

// Função para atualizar sessão quando uma mensagem é enviada
export function onMessageSent(
  type: 'negotiation' | 'order',
  referenceId: string,
  message: LocalMessage,
  isFromClient: boolean
): void {
  const session = getChatSessionByReference(type, referenceId)
  
  if (session) {
    updateChatSession(session.id, {
      lastMessageAt: message.createdAt,
      lastMessagePreview: message.content.slice(0, 100),
      status: isFromClient ? 'waiting_response' : 'active',
      unreadCount: isFromClient ? session.unreadCount + 1 : 0,
    })
  }
}

// Marcar mensagens como lidas
export function markChatAsRead(type: 'negotiation' | 'order', referenceId: string): void {
  updateChatSessionByReference(type, referenceId, {
    unreadCount: 0,
    status: 'active',
  })
}


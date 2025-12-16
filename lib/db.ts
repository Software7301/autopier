// Configuração do banco de dados
// Suporta modo LOCAL (desenvolvimento) e DATABASE (produção com PostgreSQL)

import { PrismaClient } from '@prisma/client'
import * as localStorage from './storage'

// Verificar modo de armazenamento
const STORAGE_MODE = process.env.STORAGE_MODE || 'DATABASE'
const HAS_DATABASE = !!process.env.DATABASE_URL

// Inicializar Prisma apenas se DATABASE_URL estiver configurado
let prisma: PrismaClient | null = null

if (HAS_DATABASE && STORAGE_MODE === 'DATABASE') {
  const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
  prisma = globalForPrisma.prisma || new PrismaClient()
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma
  }
}

// ========== INTERFACE UNIFICADA ==========

export interface Order {
  id: string
  carId: string
  customerName: string
  customerRg: string
  customerPhone: string
  paymentMethod: string
  installments: number
  selectedColor: string | null
  totalPrice: number
  status: string
  createdAt: string | Date
  updatedAt: string | Date
}

export interface Negotiation {
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
  createdAt: string | Date
  updatedAt: string | Date
}

export interface Message {
  id: string
  negotiationId?: string
  orderId?: string
  content: string
  sender: 'cliente' | 'funcionario'
  senderName: string
  createdAt: string | Date
}

// ========== DATABASE ABSTRACTION ==========

export const db = {
  // ========== ORDERS ==========
  async getOrders(): Promise<Order[]> {
    if (prisma && STORAGE_MODE === 'DATABASE') {
      const orders = await prisma.order.findMany({
        orderBy: { createdAt: 'desc' }
      })
      return orders.map(o => ({
        ...o,
        createdAt: o.createdAt.toISOString(),
        updatedAt: o.updatedAt.toISOString(),
      }))
    }
    return localStorage.getOrders()
  },

  async getOrderById(id: string): Promise<Order | null> {
    if (prisma && STORAGE_MODE === 'DATABASE') {
      const order = await prisma.order.findUnique({ where: { id } })
      if (!order) return null
      return {
        ...order,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
      }
    }
    return localStorage.getOrderById(id) || null
  },

  async createOrder(data: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<Order> {
    if (prisma && STORAGE_MODE === 'DATABASE') {
      const order = await prisma.order.create({
        data: {
          carId: data.carId,
          customerName: data.customerName,
          customerRg: data.customerRg,
          customerPhone: data.customerPhone,
          paymentMethod: data.paymentMethod as any,
          installments: data.installments,
          selectedColor: data.selectedColor,
          totalPrice: data.totalPrice,
          status: data.status as any,
        }
      })
      return {
        ...order,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
      }
    }
    return localStorage.createOrder(data)
  },

  async updateOrder(id: string, data: Partial<Order>): Promise<Order | null> {
    if (prisma && STORAGE_MODE === 'DATABASE') {
      const order = await prisma.order.update({
        where: { id },
        data: data as any
      })
      return {
        ...order,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
      }
    }
    // Filtrar createdAt e updatedAt pois não devem ser atualizados manualmente
    // e LocalOrder espera apenas string, não string | Date
    const { createdAt, updatedAt, ...updateData } = data
    return localStorage.updateOrder(id, updateData)
  },

  // ========== NEGOTIATIONS ==========
  async getNegotiations(): Promise<Negotiation[]> {
    if (prisma && STORAGE_MODE === 'DATABASE') {
      const negotiations = await prisma.negotiation.findMany({
        orderBy: { createdAt: 'desc' }
      })
      return negotiations.map(n => ({
        id: n.id,
        carId: n.carId || '',
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        type: n.type,
        status: n.status,
        vehicleName: n.vehicleName || undefined,
        vehicleBrand: n.vehicleBrand || undefined,
        vehicleYear: n.vehicleYear || undefined,
        vehicleMileage: n.vehicleMileage || undefined,
        vehicleDescription: n.vehicleDescription || undefined,
        proposedPrice: n.proposedPrice || undefined,
        createdAt: n.createdAt.toISOString(),
        updatedAt: n.updatedAt.toISOString(),
      }))
    }
    return localStorage.getNegotiations()
  },

  async getNegotiationById(id: string): Promise<Negotiation | null> {
    if (prisma && STORAGE_MODE === 'DATABASE') {
      const n = await prisma.negotiation.findUnique({ where: { id } })
      if (!n) return null
      return {
        id: n.id,
        carId: n.carId || '',
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        type: n.type,
        status: n.status,
        vehicleName: n.vehicleName || undefined,
        vehicleBrand: n.vehicleBrand || undefined,
        vehicleYear: n.vehicleYear || undefined,
        vehicleMileage: n.vehicleMileage || undefined,
        vehicleDescription: n.vehicleDescription || undefined,
        proposedPrice: n.proposedPrice || undefined,
        createdAt: n.createdAt.toISOString(),
        updatedAt: n.updatedAt.toISOString(),
      }
    }
    return localStorage.getNegotiationById(id) || null
  },

  async createNegotiation(data: any): Promise<Negotiation> {
    if (prisma && STORAGE_MODE === 'DATABASE') {
      const n = await prisma.negotiation.create({ data })
      return {
        id: n.id,
        carId: n.carId || '',
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        type: n.type,
        status: n.status,
        createdAt: n.createdAt.toISOString(),
        updatedAt: n.updatedAt.toISOString(),
      }
    }
    return localStorage.createNegotiation(data)
  },

  async updateNegotiation(id: string, data: Partial<Negotiation>): Promise<Negotiation | null> {
    if (prisma && STORAGE_MODE === 'DATABASE') {
      const n = await prisma.negotiation.update({
        where: { id },
        data: data as any
      })
      return {
        id: n.id,
        carId: n.carId || '',
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        type: n.type,
        status: n.status,
        createdAt: n.createdAt.toISOString(),
        updatedAt: n.updatedAt.toISOString(),
      }
    }
    // Filtrar createdAt e updatedAt pois não devem ser atualizados manualmente
    // e LocalNegotiation espera apenas string, não string | Date
    const { createdAt, updatedAt, ...updateData } = data
    return localStorage.updateNegotiation(id, updateData)
  },

  // ========== MESSAGES ==========
  async getMessagesByNegotiationId(negotiationId: string): Promise<Message[]> {
    if (prisma && STORAGE_MODE === 'DATABASE') {
      const messages = await prisma.message.findMany({
        where: { negotiationId },
        orderBy: { createdAt: 'asc' },
        include: { sender: true }
      })
      return messages.map(m => ({
        id: m.id,
        negotiationId: m.negotiationId,
        content: m.content,
        sender: m.sender.role === 'CUSTOMER' ? 'cliente' : 'funcionario',
        senderName: m.sender.name,
        createdAt: m.createdAt.toISOString(),
      }))
    }
    return localStorage.getMessagesByNegotiationId(negotiationId)
  },

  async getMessagesByOrderId(orderId: string): Promise<Message[]> {
    return localStorage.getMessagesByOrderId(orderId)
  },

  async createMessage(data: Omit<Message, 'id' | 'createdAt'>): Promise<Message> {
    // Sempre usar local storage para mensagens (mais simples)
    return localStorage.createMessage(data)
  },

  // ========== STATS ==========
  async getStats() {
    const orders = await this.getOrders()
    const negotiations = await this.getNegotiations()
    
    const totalVendas = orders.filter(o => o.status === 'COMPLETED').length
    const faturamento = orders
      .filter(o => o.status === 'COMPLETED')
      .reduce((acc, o) => acc + o.totalPrice, 0)
    const ticketMedio = totalVendas > 0 ? faturamento / totalVendas : 0
    const negociacoesAtivas = negotiations.filter(n => 
      n.status === 'PENDING' || n.status === 'IN_PROGRESS'
    ).length

    return {
      totalVendas,
      faturamento,
      ticketMedio,
      negociacoesAtivas,
      totalPedidos: orders.length,
      totalNegociacoes: negotiations.length,
    }
  }
}

// Exportar também as funções auxiliares
export { localStorage }


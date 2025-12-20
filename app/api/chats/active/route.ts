import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { NegotiationStatus } from '@prisma/client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET - Buscar chats ativos (negociações ativas)
// Query params:
// - phone: telefone do cliente (retorna chats do cliente)
// - all: true (retorna todos os chats ativos - para dashboard)
export async function GET(request: NextRequest) {
  try {
    const phone = request.nextUrl.searchParams.get('phone')
    const all = request.nextUrl.searchParams.get('all')

    if (all === 'true') {
      // Dashboard - retornar todos os chats ativos (negociações)
      const negotiations = await prisma.negotiation.findMany({
        where: {
          status: {
            in: [NegotiationStatus.OPEN, NegotiationStatus.IN_PROGRESS],
          },
        },
        include: {
          car: true,
          buyer: true,
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { updatedAt: 'desc' },
      })

      const chats = negotiations.map(neg => ({
        type: 'negotiation',
        referenceId: neg.id,
        clientId: neg.buyer.id,
        clientName: neg.buyer.name,
        clientPhone: neg.buyer.phone || '',
        vehicleName: neg.car?.name || neg.vehicleName || 'Veículo não especificado',
        vehiclePrice: neg.car?.price || neg.proposedPrice || 0,
        status: 'active',
        lastMessage: neg.messages[0]?.content || '',
        lastMessageAt: neg.messages[0]?.createdAt || neg.updatedAt,
      }))

      return NextResponse.json({ chats })
    }

    if (phone) {
      // Cliente - retornar chats do cliente específico
      const normalizedPhone = phone.replace(/\D/g, '')
      
      const user = await prisma.user.findFirst({
        where: { phone: normalizedPhone },
      })

      if (!user) {
        return NextResponse.json({ chats: [] })
      }

      const negotiations = await prisma.negotiation.findMany({
        where: {
          buyerId: user.id,
          status: {
            in: [NegotiationStatus.OPEN, NegotiationStatus.IN_PROGRESS],
          },
        },
        include: {
          car: true,
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { updatedAt: 'desc' },
      })

      const chats = negotiations.map(neg => ({
        type: 'negotiation',
        referenceId: neg.id,
        clientId: user.id,
        clientName: user.name,
        clientPhone: user.phone || '',
        vehicleName: neg.car?.name || neg.vehicleName || 'Veículo não especificado',
        vehiclePrice: neg.car?.price || neg.proposedPrice || 0,
        status: 'active',
        lastMessage: neg.messages[0]?.content || '',
        lastMessageAt: neg.messages[0]?.createdAt || neg.updatedAt,
      }))

      return NextResponse.json({ chats })
    }

    // Sem filtro - retornar lista vazia
    return NextResponse.json({ chats: [] })
  } catch (error: any) {
    console.error('❌ Erro ao buscar chats ativos:', error)
    console.error('Error code:', error.code)
    console.error('Error message:', error.message)

    // Erros de conexão do Prisma
    if (
      error.code === 'P1001' ||
      error.code === 'P1000' ||
      error.code === 'P1017' ||
      error.name === 'PrismaClientInitializationError'
    ) {
      console.warn('⚠️ Banco indisponível. Retornando array vazio.')
      return NextResponse.json({ chats: [] })
    }

    return NextResponse.json(
      { error: 'Erro ao buscar chats ativos' },
      { status: 500 }
    )
  }
}

// POST - Verificar se existe chat ativo para um telefone
// Usado para reconexão automática
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, negotiationId } = body

    // Verificar por referência específica
    if (negotiationId) {
      const negotiation = await prisma.negotiation.findUnique({
        where: { id: negotiationId },
        include: {
          car: true,
          buyer: true,
          seller: true,
          messages: {
            include: {
              sender: true,
            },
            orderBy: { createdAt: 'asc' },
          },
        },
      })

      if (negotiation) {
        return NextResponse.json({
          found: true,
          chat: {
            type: 'negotiation',
            referenceId: negotiation.id,
            clientId: negotiation.buyer.id,
            clientName: negotiation.buyer.name,
            clientPhone: negotiation.buyer.phone || '',
            vehicleName: negotiation.car?.name || negotiation.vehicleName || 'Veículo não especificado',
            vehiclePrice: negotiation.car?.price || negotiation.proposedPrice || 0,
            status: 'active',
            messages: negotiation.messages.map(msg => ({
              id: msg.id,
              content: msg.content,
              sender: msg.sender.role === 'CUSTOMER' ? 'cliente' : 'funcionario',
              senderName: msg.sender.name,
              createdAt: msg.createdAt.toISOString(),
            })),
            negotiation,
          },
        })
      }
    }

    // Verificar por telefone
    if (phone) {
      const normalizedPhone = phone.replace(/\D/g, '')
      
      const user = await prisma.user.findFirst({
        where: { phone: normalizedPhone },
      })

      if (!user) {
        return NextResponse.json({ found: false })
      }

      const negotiations = await prisma.negotiation.findMany({
        where: {
          buyerId: user.id,
          status: {
            in: [NegotiationStatus.OPEN, NegotiationStatus.IN_PROGRESS],
          },
        },
        include: {
          car: true,
          messages: {
            include: {
              sender: true,
            },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { updatedAt: 'desc' },
      })

      if (negotiations.length > 0) {
        // Retornar o chat mais recente
        const mostRecent = negotiations[0]

        return NextResponse.json({
          found: true,
          chat: {
            type: 'negotiation',
            referenceId: mostRecent.id,
            clientId: user.id,
            clientName: user.name,
            clientPhone: user.phone || '',
            vehicleName: mostRecent.car?.name || mostRecent.vehicleName || 'Veículo não especificado',
            vehiclePrice: mostRecent.car?.price || mostRecent.proposedPrice || 0,
            status: 'active',
            messages: mostRecent.messages.map(msg => ({
              id: msg.id,
              content: msg.content,
              sender: msg.sender.role === 'CUSTOMER' ? 'cliente' : 'funcionario',
              senderName: msg.sender.name,
              createdAt: msg.createdAt.toISOString(),
            })),
            negotiation: mostRecent,
          },
          totalChats: negotiations.length,
          allChats: negotiations.map(neg => ({
            type: 'negotiation',
            referenceId: neg.id,
            clientId: user.id,
            clientName: user.name,
            clientPhone: user.phone || '',
            vehicleName: neg.car?.name || neg.vehicleName || 'Veículo não especificado',
            vehiclePrice: neg.car?.price || neg.proposedPrice || 0,
            status: 'active',
          })),
        })
      }
    }

    return NextResponse.json({ found: false })
  } catch (error: any) {
    console.error('❌ Erro ao verificar chat ativo:', error)
    console.error('Error code:', error.code)
    console.error('Error message:', error.message)

    return NextResponse.json({ found: false, error: 'Erro interno' })
  }
}


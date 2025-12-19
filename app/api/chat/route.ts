import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { NegotiationStatus } from '@prisma/client'
import { getOrCreateSeller, getOrCreateBuyer } from '@/lib/users'

// 🔴 OBRIGATÓRIO PARA PRISMA FUNCIONAR NA VERCEL
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// POST - Enviar mensagem
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { negotiationId, senderId, senderName, content, sender, customerName } = body

    // Validação básica
    if (!negotiationId || !content) {
      return NextResponse.json(
        { error: 'Negociação e conteúdo são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se a negociação existe
    const negotiation = await prisma.negotiation.findUnique({
      where: { id: negotiationId },
      include: {
        buyer: true,
      },
    })

    if (!negotiation) {
      return NextResponse.json(
        { error: 'Negociação não encontrada' },
        { status: 404 }
      )
    }

    // Determinar se é cliente ou funcionário
    const isEmployee = sender === 'funcionario' || senderId === 'seller-autopier'
    
    // Obter senderId correto
    let finalSenderId: string
    if (isEmployee) {
      finalSenderId = await getOrCreateSeller()
    } else {
      // Se é cliente, validar pelo nome
      if (customerName) {
        const normalizedCustomerName = customerName.trim().toLowerCase()
        const normalizedBuyerName = negotiation.buyer.name?.trim().toLowerCase() || ''
        
        if (normalizedCustomerName !== normalizedBuyerName) {
          return NextResponse.json(
            { error: 'Acesso negado. Esta negociação não pertence a você.' },
            { status: 403 }
          )
        }
      }
      // Usar o buyerId da negociação
      finalSenderId = negotiation.buyerId
    }

    // Criar mensagem
    const message = await prisma.message.create({
      data: {
        negotiationId,
        content: content.trim(),
        senderId: finalSenderId,
      },
      include: {
        sender: true,
      },
    })

    // Atualizar status da negociação para IN_PROGRESS se estiver OPEN
    if (negotiation.status === NegotiationStatus.OPEN) {
      await prisma.negotiation.update({
        where: { id: negotiationId },
        data: { status: NegotiationStatus.IN_PROGRESS },
      })
    }

    console.log('✅ Mensagem enviada via chat:', message.id)

    return NextResponse.json({
      id: message.id,
      content: message.content,
      createdAt: message.createdAt.toISOString(),
      sender: {
        id: message.sender.id,
        name: message.sender.name,
        role: message.sender.role,
      },
    }, { status: 201 })
  } catch (error: any) {
    console.error('❌ Erro ao enviar mensagem:', error)
    console.error('Error code:', error.code)
    console.error('Error message:', error.message)

    return NextResponse.json(
      { error: 'Erro ao enviar mensagem' },
      { status: 500 }
    )
  }
}

// GET - Buscar mensagens de uma negociação
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const negotiationId = searchParams.get('negotiationId')
    const customerName = searchParams.get('customerName')

    if (!negotiationId) {
      return NextResponse.json(
        { error: 'ID da negociação é obrigatório' },
        { status: 400 }
      )
    }

    const negotiation = await prisma.negotiation.findUnique({
      where: { id: negotiationId },
      include: {
        buyer: true,
      },
    })

    if (!negotiation) {
      return NextResponse.json(
        { error: 'Negociação não encontrada' },
        { status: 404 }
      )
    }

    // Validar acesso pelo nome se fornecido
    if (customerName) {
      const normalizedCustomerName = customerName.trim().toLowerCase()
      const normalizedBuyerName = negotiation.buyer.name?.trim().toLowerCase() || ''
      
      if (normalizedCustomerName !== normalizedBuyerName) {
        return NextResponse.json(
          { error: 'Acesso negado. Esta negociação não pertence a você.' },
          { status: 403 }
        )
      }
    }

    const messages = await prisma.message.findMany({
      where: { negotiationId },
      include: {
        sender: true,
      },
      orderBy: { createdAt: 'asc' },
    })

    const formattedMessages = messages.map(msg => ({
      id: msg.id,
      content: msg.content,
      createdAt: msg.createdAt.toISOString(),
      sender: {
        id: msg.sender.id,
        name: msg.sender.name,
        role: msg.sender.role,
      },
    }))

    return NextResponse.json(formattedMessages)
  } catch (error: any) {
    console.error('❌ Erro ao buscar mensagens:', error)
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
      return NextResponse.json([])
    }

    return NextResponse.json(
      { error: 'Erro ao buscar mensagens' },
      { status: 500 }
    )
  }
}

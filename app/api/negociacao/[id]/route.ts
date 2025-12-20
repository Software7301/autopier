import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { NegotiationStatus } from '@prisma/client'
import { getOrCreateBuyer } from '@/lib/users'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const searchParams = request.nextUrl.searchParams
    const customerName = searchParams.get('customerName') // Nome do cliente para validação
    
    const negotiation = await prisma.negotiation.findUnique({
      where: { id },
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

    if (!negotiation) {
      return NextResponse.json(
        { error: 'Negociação não encontrada' },
        { status: 404 }
      )
    }

    // Validação de acesso: cliente só pode acessar suas próprias negociações pelo nome
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

    const formattedNegotiation = {
      id: negotiation.id,
      type: negotiation.type,
      status: negotiation.status,
      vehicleName: negotiation.car?.name || negotiation.vehicleName || 'Veículo não especificado',
      vehicleBrand: negotiation.car?.brand || negotiation.vehicleBrand || '',
      vehicleYear: negotiation.car?.year || negotiation.vehicleYear || null,
      proposedPrice: negotiation.car?.price || negotiation.proposedPrice || null,
      buyer: {
        id: negotiation.buyer.id,
        name: negotiation.buyer.name,
        role: negotiation.buyer.role,
      },
      seller: {
        id: negotiation.seller.id,
        name: negotiation.seller.name,
        role: negotiation.seller.role,
      },
      car: negotiation.car,
      messages: negotiation.messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        createdAt: msg.createdAt.toISOString(),
        sender: {
          id: msg.sender.id,
          name: msg.sender.name,
          role: msg.sender.role,
        },
      })),
      createdAt: negotiation.createdAt.toISOString(),
    }

    return NextResponse.json(formattedNegotiation)
  } catch (error: any) {
    console.error('❌ Erro ao buscar negociação:', error)
    console.error('Error code:', error.code)
    console.error('Error message:', error.message)

    return NextResponse.json(
      { error: 'Erro ao buscar negociação' },
      { status: 500 }
    )
  }
}

// PATCH - Atualizar status da negociação
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status } = body

    if (!status || !Object.values(NegotiationStatus).includes(status)) {
      return NextResponse.json(
        { error: 'Status inválido' },
        { status: 400 }
      )
    }

    const negotiation = await prisma.negotiation.update({
      where: { id },
      data: { status: status as NegotiationStatus },
      include: {
        car: true,
        buyer: true,
        seller: true,
      },
    })

    return NextResponse.json(negotiation)
  } catch (error: any) {
    console.error('❌ Erro ao atualizar negociação:', error)
    console.error('Error code:', error.code)
    console.error('Error message:', error.message)

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Negociação não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Erro ao atualizar negociação' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { content, senderName, customerName } = body

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Mensagem não pode ser vazia' },
        { status: 400 }
      )
    }

    if (!customerName || !customerName.trim()) {
      return NextResponse.json(
        { error: 'Nome do cliente é obrigatório' },
        { status: 400 }
      )
    }

    const negotiation = await prisma.negotiation.findUnique({
      where: { id },
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

    // Validar que o nome corresponde ao buyer da negociação
    const normalizedCustomerName = customerName.trim().toLowerCase()
    const normalizedBuyerName = negotiation.buyer.name?.trim().toLowerCase() || ''
    
    if (normalizedCustomerName !== normalizedBuyerName) {
      return NextResponse.json(
        { error: 'Acesso negado. Esta negociação não pertence a você.' },
        { status: 403 }
      )
    }

    // Usar o buyerId da negociação
    const senderId = negotiation.buyerId

    // Criar mensagem do cliente
    const message = await prisma.message.create({
      data: {
        negotiationId: id,
        content: content.trim(),
        senderId,
      },
      include: {
        sender: true,
      },
    })

    // Atualizar status da negociação para IN_PROGRESS se estiver OPEN
    if (negotiation.status === NegotiationStatus.OPEN) {
      await prisma.negotiation.update({
        where: { id },
        data: { status: NegotiationStatus.IN_PROGRESS },
      })
    }

    console.log('✅ Mensagem do cliente:', message.id)

    return NextResponse.json({
      id: message.id,
      content: message.content,
      createdAt: message.createdAt.toISOString(),
      sender: {
        id: message.sender.id,
        name: message.sender.name,
        role: message.sender.role,
      },
    })
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

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { NegotiationStatus } from '@prisma/client'

// 🔴 OBRIGATÓRIO PARA PRISMA FUNCIONAR NA VERCEL
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const negotiation = await prisma.negotiation.findUnique({
      where: { id },
      include: {
        car: true,
        buyer: true,
        seller: true,
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: true,
          },
        },
      },
    })

    if (!negotiation) {
      return NextResponse.json(
        { error: 'Negociação não encontrada' },
        { status: 404 }
      )
    }

    const formattedNegotiation = {
      id: negotiation.id,
      cliente: {
        id: negotiation.buyer.id,
        nome: negotiation.buyer.name,
        telefone: negotiation.buyer.phone || '',
        email: negotiation.buyer.email,
      },
      veiculo: negotiation.car
        ? {
            id: negotiation.car.id,
            nome: negotiation.car.name,
            ano: negotiation.car.year,
            preco: negotiation.car.price,
            imageUrl: negotiation.car.imageUrl,
          }
        : {
            id: '',
            nome: negotiation.vehicleName || 'Veículo não especificado',
            ano: negotiation.vehicleYear || null,
            preco: negotiation.proposedPrice || 0,
            imageUrl: negotiation.vehicleImageUrl || '',
          },
      tipo: negotiation.type,
      status: negotiation.status,
      criadoEm: negotiation.createdAt.toISOString(),
      mensagens: negotiation.messages.map((msg) => ({
        id: msg.id,
        content: msg.content,
        sender: msg.sender.role === 'CUSTOMER' ? 'cliente' : 'funcionario',
        senderName: msg.sender.name,
        createdAt: msg.createdAt.toISOString(),
      })),
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

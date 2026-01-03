import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { NegotiationType, NegotiationStatus } from '@prisma/client'
import { getOrCreateBuyer, getOrCreateSeller } from '@/lib/users'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Endpoint para criar negociação rápida',
    method: 'POST',
    requiredFields: ['carId', 'customerPhone'],
    optionalFields: ['customerName'],
    example: {
      carId: 'abc123',
      customerPhone: '11999999999',
      customerName: 'João Silva'
    }
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { carId, customerPhone, customerName } = body

    if (!carId || !customerPhone) {
      return NextResponse.json(
        { error: 'carId e customerPhone são obrigatórios' },
        { status: 400 }
      )
    }

    const normalizedPhone = customerPhone.replace(/\D/g, '')

    const car = await prisma.car.findUnique({
      where: { id: carId },
    })

    if (!car) {
      return NextResponse.json(
        { error: 'Veículo não encontrado' },
        { status: 404 }
      )
    }

    const buyerId = await getOrCreateBuyer(normalizedPhone, customerName || 'Cliente')
    const sellerId = await getOrCreateSeller()

    const existingNegotiation = await prisma.negotiation.findFirst({
      where: {
        carId,
        buyerId,
        status: {
          in: [NegotiationStatus.OPEN, NegotiationStatus.IN_PROGRESS],
        },
      },
    })

    if (existingNegotiation) {

      return NextResponse.json({
        negotiationId: existingNegotiation.id,
        chatId: existingNegotiation.id,
        isNew: false,
        message: 'Negociação existente encontrada',
      })
    }

    const negotiation = await prisma.negotiation.create({
      data: {
        type: NegotiationType.BUY,
        carId,
        buyerId,
        sellerId,
        status: NegotiationStatus.OPEN,
      },
    })

    const initialMessage = `Olá! Tenho interesse em negociar o veículo ${car.name}.`
    await prisma.message.create({
      data: {
        negotiationId: negotiation.id,
        content: initialMessage,
        senderId: buyerId,
      },
    })

    console.log('✅ Negociação criada:', negotiation.id)

    return NextResponse.json({
      negotiationId: negotiation.id,
      chatId: negotiation.id,
      isNew: true,
      message: 'Negociação criada com sucesso',
    }, { status: 201 })
  } catch (error: any) {
    console.error('❌ Erro ao criar/reutilizar negociação:', error)
    console.error('Error code:', error.code)
    console.error('Error message:', error.message)

    return NextResponse.json(
      { error: 'Erro ao criar negociação' },
      { status: 500 }
    )
  }
}


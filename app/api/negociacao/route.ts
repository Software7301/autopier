import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { NegotiationType, NegotiationStatus } from '@prisma/client'
import { getOrCreateBuyer, getOrCreateSeller } from '@/lib/users'
import { isPrismaConnectionError } from '@/lib/utils'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      type,
      customerName,
      customerPhone,
      customerEmail,
      vehicleName,
      vehicleBrand,
      vehicleYear,
      vehicleMileage,
      vehicleDescription,
      vehicleImageUrl,
      proposedPrice,
      vehicleInterest,
      message,
      carId
    } = body

    if (!customerName || !customerPhone) {
      return NextResponse.json(
        { error: 'Nome e telefone são obrigatórios' },
        { status: 400 }
      )
    }

    // Validar telefone (deve ter pelo menos 10 dígitos)
    const normalizedPhone = customerPhone.replace(/\D/g, '')
    if (normalizedPhone.length < 10) {
      return NextResponse.json(
        { error: 'Telefone inválido. Deve conter pelo menos 10 dígitos.' },
        { status: 400 }
      )
    }

    const negotiationType = (type === 'VENDA' || type === 'SELL')
      ? NegotiationType.SELL
      : NegotiationType.BUY

    let buyerId: string
    let sellerId: string

    try {
      buyerId = await getOrCreateBuyer(normalizedPhone, customerName.trim(), customerEmail)
      if (!buyerId) {
        return NextResponse.json(
          { error: 'Erro ao criar ou buscar comprador' },
          { status: 500 }
        )
      }
    } catch (buyerError: any) {
      console.error('❌ Erro ao criar/buscar comprador:', buyerError)
      return NextResponse.json(
        { error: `Erro ao processar dados do cliente: ${buyerError.message || 'Erro desconhecido'}` },
        { status: 500 }
      )
    }

    try {
      sellerId = await getOrCreateSeller()
      if (!sellerId) {
        return NextResponse.json(
          { error: 'Erro ao criar ou buscar vendedor' },
          { status: 500 }
        )
      }
    } catch (sellerError: any) {
      console.error('❌ Erro ao criar/buscar vendedor:', sellerError)
      return NextResponse.json(
        { error: `Erro ao processar vendedor: ${sellerError.message || 'Erro desconhecido'}` },
        { status: 500 }
      )
    }

    if (carId) {
      const car = await prisma.car.findUnique({ where: { id: carId } })
      if (!car) {
        return NextResponse.json(
          { error: 'Veículo não encontrado' },
          { status: 404 }
        )
      }
    }

    // Validar e converter valores numéricos
    const parsedYear = vehicleYear 
      ? (typeof vehicleYear === 'string' && vehicleYear.trim() 
          ? (isNaN(parseInt(vehicleYear)) ? null : parseInt(vehicleYear))
          : (typeof vehicleYear === 'number' ? vehicleYear : null))
      : null

    const parsedMileage = vehicleMileage
      ? (typeof vehicleMileage === 'string' && vehicleMileage.trim()
          ? (isNaN(parseInt(vehicleMileage)) ? null : parseInt(vehicleMileage))
          : (typeof vehicleMileage === 'number' ? vehicleMileage : null))
      : null

    const parsedPrice = proposedPrice
      ? (typeof proposedPrice === 'string' && proposedPrice.trim()
          ? (isNaN(parseFloat(proposedPrice.toString().replace(/\./g, '').replace(',', '.'))) 
              ? null 
              : parseFloat(proposedPrice.toString().replace(/\./g, '').replace(',', '.')))
          : (typeof proposedPrice === 'number' ? proposedPrice : null))
      : null

    try {
      const negotiation = await prisma.negotiation.create({
        data: {
          type: negotiationType,
          carId: carId || null,
          buyerId,
          sellerId,
          status: NegotiationStatus.OPEN,
          vehicleName: vehicleName?.trim() || null,
          vehicleBrand: vehicleBrand?.trim() || null,
          vehicleYear: parsedYear,
          vehicleMileage: parsedMileage,
          vehicleDescription: vehicleDescription?.trim() || null,
          vehicleImageUrl: vehicleImageUrl?.trim() || null,
          proposedPrice: parsedPrice,
        },
      })

      const initialMessage = negotiationType === NegotiationType.SELL
        ? `Olá! Gostaria de vender meu veículo: ${vehicleBrand || ''} ${vehicleName || ''} ${parsedYear || ''}. ${parsedMileage ? `Quilometragem: ${parsedMileage} km.` : ''} ${parsedPrice ? `Valor pretendido: R$ ${parsedPrice.toLocaleString('pt-BR')}.` : ''} ${vehicleDescription || ''}`.trim()
        : message?.trim() || `Olá! Tenho interesse em negociar. ${vehicleInterest || ''}`.trim()

      await prisma.message.create({
        data: {
          negotiationId: negotiation.id,
          content: initialMessage || 'Olá! Tenho interesse em negociar.',
          senderId: buyerId,
        },
      })

      console.log('✅ Negociação criada:', negotiation.id)

      return NextResponse.json({
        id: negotiation.id,
        message: 'Negociação criada com sucesso',
        status: negotiation.status,
      }, { status: 201 })
    } catch (dbError: any) {
      console.error('❌ Erro ao salvar no banco de dados:', dbError)
      console.error('Error code:', dbError.code)
      console.error('Error message:', dbError.message)
      console.error('Error meta:', dbError.meta)

      // Retornar mensagem de erro mais específica
      if (dbError.code === 'P2002') {
        return NextResponse.json(
          { error: 'Já existe uma negociação com estes dados' },
          { status: 409 }
        )
      }
      if (dbError.code === 'P2003') {
        return NextResponse.json(
          { error: 'Referência inválida. Verifique os dados do veículo ou cliente.' },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { error: `Erro ao salvar negociação: ${dbError.message || 'Erro desconhecido'}` },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('❌ Erro ao criar negociação:', error)
    console.error('Error code:', error.code)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack?.substring(0, 500))

    return NextResponse.json(
      { error: `Erro ao processar requisição: ${error.message || 'Erro desconhecido'}` },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  console.log('📋 [GET /api/negociacao] Iniciando busca de negociações...')

  try {
    const negotiations = await prisma.negotiation.findMany({
      include: {
        car: true,
        buyer: true,
        seller: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    console.log(`✅ [GET /api/negociacao] Encontradas ${negotiations.length} negociações`)

    const formattedNegotiations = negotiations.map(neg => ({
      id: neg.id,
      type: neg.type,
      status: neg.status,
      carId: neg.carId,
      buyerId: neg.buyerId,
      sellerId: neg.sellerId,
      vehicleName: neg.vehicleName,
      vehicleBrand: neg.vehicleBrand,
      vehicleYear: neg.vehicleYear,
      vehicleMileage: neg.vehicleMileage,
      vehicleDescription: neg.vehicleDescription,
      proposedPrice: neg.proposedPrice,
      createdAt: neg.createdAt.toISOString(),
      updatedAt: neg.updatedAt.toISOString(),
      car: neg.car,
    }))

    return NextResponse.json(formattedNegotiations)
  } catch (error: any) {
    console.error('❌ [GET /api/negociacao] Erro ao buscar negociações:', error)
    console.error('Error code:', error.code)
    console.error('Error name:', error.name)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack?.substring(0, 500))

    if (isPrismaConnectionError(error)) {
      console.warn('⚠️ [GET /api/negociacao] Banco indisponível. Retornando array vazio.')
      return NextResponse.json([], { status: 200 })
    }

    console.warn('⚠️ [GET /api/negociacao] Erro desconhecido. Retornando array vazio.')
    return NextResponse.json([], { status: 200 })
  }
}

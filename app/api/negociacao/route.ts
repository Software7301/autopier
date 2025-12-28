import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { NegotiationType, NegotiationStatus } from '@prisma/client'
import { getOrCreateBuyer, getOrCreateSeller } from '@/lib/users'
import { isPrismaConnectionError } from '@/lib/utils'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// POST - Criar nova negociação
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
      proposedPrice,
      vehicleInterest,
      message,
      carId
    } = body

    // Validação básica
    if (!customerName || !customerPhone) {
      return NextResponse.json(
        { error: 'Nome e telefone são obrigatórios' },
        { status: 400 }
      )
    }

    // Validar tipo
    const negotiationType = (type === 'VENDA' || type === 'SELL') 
      ? NegotiationType.SELL 
      : NegotiationType.BUY

    // Obter ou criar buyer e seller
    const buyerId = await getOrCreateBuyer(customerPhone, customerName, customerEmail)
    const sellerId = await getOrCreateSeller()

    // Verificar se carId existe (se fornecido)
    if (carId) {
      const car = await prisma.car.findUnique({ where: { id: carId } })
      if (!car) {
        return NextResponse.json(
          { error: 'Veículo não encontrado' },
          { status: 404 }
        )
      }
    }

    // Criar negociação
    const negotiation = await prisma.negotiation.create({
      data: {
        type: negotiationType,
        carId: carId || null,
        buyerId,
        sellerId,
        status: NegotiationStatus.OPEN,
        vehicleName: vehicleName || null,
        vehicleBrand: vehicleBrand || null,
        vehicleYear: vehicleYear ? parseInt(vehicleYear) : null,
        vehicleMileage: vehicleMileage ? parseInt(vehicleMileage) : null,
        vehicleDescription: vehicleDescription || null,
        proposedPrice: proposedPrice ? parseFloat(proposedPrice) : null,
      },
    })

    // Criar mensagem inicial
    const initialMessage = negotiationType === NegotiationType.SELL
      ? `Olá! Gostaria de vender meu veículo: ${vehicleBrand} ${vehicleName} ${vehicleYear}. Quilometragem: ${vehicleMileage} km. Valor pretendido: R$ ${proposedPrice?.toLocaleString('pt-BR') || 'A combinar'}. ${vehicleDescription || ''}`
      : message || `Olá! Tenho interesse em negociar. ${vehicleInterest || ''}`

    await prisma.message.create({
      data: {
        negotiationId: negotiation.id,
        content: initialMessage,
        senderId: buyerId,
      },
    })

    console.log('✅ Negociação criada:', negotiation.id)

    return NextResponse.json({
      id: negotiation.id,
      message: 'Negociação criada com sucesso',
      status: negotiation.status,
    }, { status: 201 })
  } catch (error: any) {
    console.error('❌ Erro ao criar negociação:', error)
    console.error('Error code:', error.code)
    console.error('Error message:', error.message)

    return NextResponse.json(
      { error: 'Erro ao criar negociação' },
      { status: 500 }
    )
  }
}

// GET - Listar negociações
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

    // SEMPRE retornar array vazio em caso de erro (não objeto de erro)
    console.warn('⚠️ [GET /api/negociacao] Erro desconhecido. Retornando array vazio.')
    return NextResponse.json([], { status: 200 })
  }
}

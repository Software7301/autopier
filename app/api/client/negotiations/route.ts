import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  console.log('📋 [GET /api/client/negotiations] Iniciando busca de negociações do cliente...')
  
  try {
    const searchParams = request.nextUrl.searchParams
    const customerName = searchParams.get('customerName')

    console.log('📋 [GET /api/client/negotiations] Parâmetros:', {
      hasCustomerName: !!customerName,
      customerName: customerName?.substring(0, 20) + '...',
    })

    if (!customerName || !customerName.trim()) {
      console.warn('⚠️ [GET /api/client/negotiations] Nome do cliente não fornecido. Retornando array vazio.')
      return NextResponse.json([])
    }

    const normalizedName = customerName.trim()
    
    const user = await prisma.user.findFirst({
      where: {
        name: {
          equals: normalizedName,
          mode: 'insensitive',
        },
        role: 'CUSTOMER',
      },
    })

    if (!user) {
      console.warn('⚠️ [GET /api/client/negotiations] Usuário não encontrado. Retornando array vazio.')
      return NextResponse.json([])
    }
    
    const negotiations = await prisma.negotiation.findMany({
      where: {
        buyerId: user.id,
      },
      include: {
        car: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })
    
    console.log(`✅ [GET /api/client/negotiations] Encontradas ${negotiations.length} negociações`)
    
    const clientNegotiations = negotiations.map(neg => {
      const lastMessage = neg.messages[0]
      
      return {
        id: neg.id,
        carId: neg.carId || '',
        carName: neg.car?.name || neg.vehicleName || 'Veículo não especificado',
        carBrand: neg.car?.brand || neg.vehicleBrand || '',
        carImage: neg.car?.imageUrl || '',
        status: neg.status,
        createdAt: neg.createdAt.toISOString(),
        updatedAt: neg.updatedAt.toISOString(),
        lastMessage: lastMessage?.content || '',
        lastMessageAt: lastMessage?.createdAt.toISOString() || neg.updatedAt.toISOString(),
        unreadCount: 0,
      }
    })

    return NextResponse.json(clientNegotiations)
  } catch (error: any) {
    console.error('❌ [GET /api/client/negotiations] Erro ao buscar negociações do cliente:', error)
    console.error('Error code:', error.code)
    console.error('Error name:', error.name)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack?.substring(0, 500))

    const isConnectionError = 
      error.code === 'P1001' ||
      error.code === 'P1000' ||
      error.code === 'P1017' ||
      error.code === 'P1002' ||
      error.name === 'PrismaClientInitializationError' ||
      error.message?.includes('Can\'t reach database server') ||
      error.message?.includes('Connection') ||
      error.message?.includes('timeout')

    if (isConnectionError) {
      console.warn('⚠️ [GET /api/client/negotiations] Banco indisponível. Retornando array vazio.')
      return NextResponse.json([], { status: 200 })
    }

    console.warn('⚠️ [GET /api/client/negotiations] Erro desconhecido. Retornando array vazio.')
    return NextResponse.json([], { status: 200 })
  }
}



import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const customerName = searchParams.get('customerName')

    if (!customerName || !customerName.trim()) {
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
    console.error('Erro ao buscar negociações do cliente:', error)
    console.error('Error code:', error.code)
    console.error('Error message:', error.message)

    if (
      error.code === 'P1001' ||
      error.code === 'P1000' ||
      error.code === 'P1017' ||
      error.name === 'PrismaClientInitializationError'
    ) {
      console.warn('Banco indisponível. Retornando array vazio.')
      return NextResponse.json([])
    }

    console.warn('Erro ao buscar negociações. Retornando array vazio.')
    return NextResponse.json([])
  }
}



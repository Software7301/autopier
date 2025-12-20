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
    
    const orders = await prisma.order.findMany({
      where: {
        customerName: {
          equals: normalizedName,
          mode: 'insensitive',
        },
      },
      include: {
        car: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })
    
    const clientOrders = orders.map(order => ({
      id: order.id,
      carId: order.carId,
      carName: order.car.name,
      carBrand: order.car.brand,
      carImage: order.car.imageUrl,
      status: order.status,
      totalPrice: order.totalPrice,
      selectedColor: order.selectedColor,
      paymentMethod: order.paymentMethod,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      lastMessage: '',
      lastMessageAt: order.updatedAt.toISOString(),
      unreadCount: 0,
    }))

    return NextResponse.json(clientOrders)
  } catch (error: any) {
    console.error('Erro ao buscar pedidos do cliente:', error)
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

    console.warn('Erro ao buscar pedidos. Retornando array vazio.')
    return NextResponse.json([])
  }
}



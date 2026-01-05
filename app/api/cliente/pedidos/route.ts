import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { OrderStatus } from '@prisma/client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const user = await getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const orders = await prisma.order.findMany({
      where: {
        userId: user.id,
      },
      include: {
        car: true,
        messages: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })

    const formattedOrders = orders.map((order) => {
      const lastMessage = order.messages[0]
      return {
        id: order.id,
        carName: order.car.name,
        carBrand: order.car.brand,
        carImage: order.car.imageUrl,
        status: order.status,
        totalPrice: order.totalPrice,
        selectedColor: order.selectedColor || 'Não especificada',
        paymentMethod: order.paymentMethod,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
        lastMessage: lastMessage?.content || null,
        lastMessageAt: lastMessage?.createdAt.toISOString() || null,
        unreadCount: 0,
      }
    })

    return NextResponse.json(formattedOrders)
  } catch (error: any) {
    console.error('Erro ao buscar pedidos:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar pedidos' },
      { status: 500 }
    )
  }
}


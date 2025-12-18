import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 🔴 OBRIGATÓRIO PARA PRISMA FUNCIONAR NA VERCEL
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET - Buscar pedidos do cliente por telefone
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const phone = searchParams.get('phone')

    if (!phone) {
      return NextResponse.json(
        { error: 'Telefone é obrigatório' },
        { status: 400 }
      )
    }

    const normalizedPhone = phone.replace(/\D/g, '')
    
    // Buscar pedidos do cliente pelo telefone
    const orders = await prisma.order.findMany({
      where: {
        customerPhone: normalizedPhone,
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
      lastMessage: '', // Não há sistema de chat para orders no schema atual
      lastMessageAt: order.updatedAt.toISOString(),
      unreadCount: 0,
    }))

    return NextResponse.json(clientOrders)
  } catch (error: any) {
    console.error('❌ Erro ao buscar pedidos do cliente:', error)
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
      { error: 'Erro ao buscar pedidos do cliente' },
      { status: 500 }
    )
  }
}



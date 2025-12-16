import { NextResponse } from 'next/server'
import { getOrders, getCarById, getChatSessionByReference } from '@/lib/storage'

// Forçar renderização dinâmica (usa request.url)
export const dynamic = 'force-dynamic'

// GET - Buscar pedidos do cliente por telefone
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const phone = searchParams.get('phone')

    if (!phone) {
      return NextResponse.json(
        { error: 'Telefone é obrigatório' },
        { status: 400 }
      )
    }

    const normalizedPhone = phone.replace(/\D/g, '')
    const orders = getOrders()
    
    // Filtrar pedidos do cliente
    const clientOrders = orders
      .filter(o => o.customerPhone.replace(/\D/g, '') === normalizedPhone)
      .map(order => {
        const car = getCarById(order.carId)
        const chatSession = getChatSessionByReference('order', order.id)
        
        return {
          id: order.id,
          carId: order.carId,
          carName: car.name,
          carBrand: car.brand,
          carImage: car.imageUrl,
          status: order.status,
          totalPrice: order.totalPrice,
          selectedColor: order.selectedColor,
          paymentMethod: order.paymentMethod,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          lastMessage: chatSession?.lastMessagePreview || '',
          lastMessageAt: chatSession?.lastMessageAt || order.updatedAt,
          unreadCount: chatSession?.unreadCount || 0,
        }
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

    return NextResponse.json(clientOrders)
  } catch (error) {
    console.error('Erro ao buscar pedidos do cliente:', error)
    return NextResponse.json([])
  }
}



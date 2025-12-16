import { NextResponse } from 'next/server'
import { getNegotiations, getCarById, getChatSessionByReference } from '@/lib/storage'

// Forçar renderização dinâmica (usa request.url)
export const dynamic = 'force-dynamic'

// GET - Buscar negociações do cliente por telefone
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
    const negotiations = getNegotiations()
    
    // Filtrar negociações do cliente
    const clientNegotiations = negotiations
      .filter(n => n.customerPhone.replace(/\D/g, '') === normalizedPhone)
      .map(neg => {
        const car = getCarById(neg.carId)
        const chatSession = getChatSessionByReference('negotiation', neg.id)
        
        return {
          id: neg.id,
          carId: neg.carId,
          carName: car.name,
          carBrand: car.brand,
          carImage: car.imageUrl,
          status: neg.status,
          createdAt: neg.createdAt,
          updatedAt: neg.updatedAt,
          lastMessage: chatSession?.lastMessagePreview || '',
          lastMessageAt: chatSession?.lastMessageAt || neg.updatedAt,
          unreadCount: chatSession?.unreadCount || 0,
        }
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

    return NextResponse.json(clientNegotiations)
  } catch (error) {
    console.error('Erro ao buscar negociações do cliente:', error)
    return NextResponse.json([])
  }
}



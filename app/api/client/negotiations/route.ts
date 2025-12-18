import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 🔴 OBRIGATÓRIO PARA PRISMA FUNCIONAR NA VERCEL
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET - Buscar negociações do cliente por telefone
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const phone = searchParams.get('phone')

    if (!phone) {
      // ⚠️ SEMPRE retornar array, mesmo sem telefone
      return NextResponse.json([])
    }

    const normalizedPhone = phone.replace(/\D/g, '')
    
    // Buscar usuário pelo telefone
    const user = await prisma.user.findFirst({
      where: {
        phone: normalizedPhone,
      },
    })

    if (!user) {
      return NextResponse.json([])
    }
    
    // Buscar negociações do cliente
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
        unreadCount: 0, // Não há sistema de unread no schema atual
      }
    })

    return NextResponse.json(clientNegotiations)
  } catch (error: any) {
    console.error('❌ Erro ao buscar negociações do cliente:', error)
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

    // ⚠️ SEMPRE retornar array, mesmo em erro, para não quebrar o frontend
    console.warn('⚠️ Erro ao buscar negociações. Retornando array vazio.')
    return NextResponse.json([])
  }
}



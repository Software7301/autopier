import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { NegotiationStatus, NegotiationType } from '@prisma/client'

// 🔴 OBRIGATÓRIO PARA PRISMA FUNCIONAR NA VERCEL
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const negotiations = await prisma.negotiation.findMany({
      include: {
        car: true,
        buyer: true,
        seller: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const formattedNegotiations = negotiations.map((neg) => {
      const lastMessage = neg.messages[0]

      return {
        id: neg.id,
        cliente: {
          id: neg.buyer.id,
          nome: neg.buyer.name,
          telefone: neg.buyer.phone || '',
          email: neg.buyer.email,
        },
        veiculo: neg.car
          ? {
              id: neg.car.id,
              nome: neg.car.name,
              ano: neg.car.year,
              preco: neg.car.price,
              imageUrl: neg.car.imageUrl,
            }
          : {
              id: '',
              nome: neg.vehicleName || 'Veículo não especificado',
              ano: neg.vehicleYear || null,
              preco: neg.proposedPrice || 0,
              imageUrl: '',
            },
        tipo: neg.type,
        status: neg.status,
        criadoEm: neg.createdAt.toISOString(),
        atualizadoEm: neg.updatedAt.toISOString(),
        ultimaMensagem: lastMessage?.content || null,
        mensagensNaoLidas: 0,
      }
    })

    return NextResponse.json(formattedNegotiations)
  } catch (error: any) {
    console.error('❌ Erro ao buscar negociações:', error)
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
      { error: 'Erro ao buscar negociações' },
      { status: 500 }
    )
  }
}

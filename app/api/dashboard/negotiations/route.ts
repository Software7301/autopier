import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { NegotiationStatus, NegotiationType } from '@prisma/client'
import { isPrismaConnectionError } from '@/lib/utils'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  console.log('📋 [GET /api/dashboard/negotiations] Iniciando busca de negociações...')
  
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

    console.log(`✅ [GET /api/dashboard/negotiations] Encontradas ${negotiations.length} negociações`)

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
    console.error('❌ [GET /api/dashboard/negotiations] Erro ao buscar negociações:', error)
    console.error('Error code:', error.code)
    console.error('Error name:', error.name)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack?.substring(0, 500))

    if (isPrismaConnectionError(error)) {
      console.warn('⚠️ [GET /api/dashboard/negotiations] Banco indisponível. Retornando array vazio.')
      return NextResponse.json([], { status: 200 })
    }

    // SEMPRE retornar array vazio em caso de erro (não objeto de erro)
    console.warn('⚠️ [GET /api/dashboard/negotiations] Erro desconhecido. Retornando array vazio.')
    return NextResponse.json([], { status: 200 })
  }
}

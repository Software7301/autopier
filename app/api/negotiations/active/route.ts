import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { NegotiationStatus, NegotiationType, CarCategory } from '@prisma/client'

// 🔴 OBRIGATÓRIO PARA PRISMA FUNCIONAR NA VERCEL
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET - Buscar negociações ativas para exibir na home
export async function GET(request: NextRequest) {
  try {
    // Filtrar apenas negociações ativas
    const negotiations = await prisma.negotiation.findMany({
      where: {
        status: {
          in: [NegotiationStatus.OPEN, NegotiationStatus.IN_PROGRESS],
        },
      },
      include: {
        car: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: true,
          },
        },
        buyer: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 6,
    })

    const formattedNegotiations = negotiations.map((neg) => {
      const lastMessage = neg.messages[0]

      // Contar interessados (número de mensagens de clientes diferentes)
      const uniqueBuyers = new Set(
        neg.messages
          .filter(m => m.sender.role === 'CUSTOMER')
          .map(m => m.senderId)
      )
      const interessados = uniqueBuyers.size || 1

      // Calcular última atividade
      const lastActivity = lastMessage?.createdAt || neg.updatedAt || neg.createdAt
      const lastActivityDate = new Date(lastActivity)
      const now = new Date()
      const diffMinutes = Math.floor((now.getTime() - lastActivityDate.getTime()) / (1000 * 60))

      let lastActivityText = ''
      if (diffMinutes < 1) {
        lastActivityText = 'agora mesmo'
      } else if (diffMinutes < 60) {
        lastActivityText = `há ${diffMinutes} minuto${diffMinutes > 1 ? 's' : ''}`
      } else if (diffMinutes < 1440) {
        const hours = Math.floor(diffMinutes / 60)
        lastActivityText = `há ${hours} hora${hours > 1 ? 's' : ''}`
      } else {
        const days = Math.floor(diffMinutes / 1440)
        lastActivityText = `há ${days} dia${days > 1 ? 's' : ''}`
      }

      // Determinar categoria do veículo
      let category: CarCategory = CarCategory.SUV
      if (neg.car) {
        category = neg.car.category
      } else {
        const name = (neg.vehicleName || '').toLowerCase()
        if (name.includes('sedan') || name.includes('civic') || name.includes('corolla')) {
          category = CarCategory.SEDAN
        } else if (name.includes('compacto') || name.includes('onix') || name.includes('hb20')) {
          category = CarCategory.COMPACTO
        } else if (name.includes('esportivo') || name.includes('bmw') || name.includes('mercedes')) {
          category = CarCategory.ESPORTIVO
        }
      }

      const altaProcura = interessados > 2 || diffMinutes < 10

      const isVenda = neg.type === NegotiationType.SELL

      const veiculoNome = isVenda
        ? `${neg.vehicleBrand || ''} ${neg.vehicleName || ''}`.trim() || (neg.car?.name || 'Veículo não especificado')
        : (neg.car?.name || neg.vehicleName || 'Veículo não especificado')

      return {
        id: neg.id,
        veiculo: {
          nome: veiculoNome,
          marca: isVenda ? (neg.vehicleBrand || neg.car?.brand || '') : (neg.car?.brand || ''),
          modelo: isVenda ? (neg.vehicleName || neg.car?.model || '') : (neg.car?.model || ''),
          categoria: category,
          imagem:
            neg.car?.imageUrl ||
            'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800',
          ano: isVenda ? (neg.vehicleYear || neg.car?.year || null) : (neg.car?.year || null),
        },
        status: 'Em negociação',
        interessados,
        ultimaAtividade: lastActivityText,
        altaProcura,
        tipo: neg.type,
        createdAt: neg.createdAt.toISOString(),
      }
    })

    formattedNegotiations.sort((a, b) => {
      const dateDiff =
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()

      if (Math.abs(dateDiff) < 60000) {
        return b.interessados - a.interessados
      }
      return dateDiff
    })

    return NextResponse.json(formattedNegotiations)
  } catch (error: any) {
    console.error('❌ Erro ao buscar negociações ativas:', error)
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
      { error: 'Erro ao buscar negociações ativas' },
      { status: 500 }
    )
  }
}
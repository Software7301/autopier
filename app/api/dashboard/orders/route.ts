import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { OrderStatus, PaymentMethod } from '@prisma/client'
import { retryQuery } from '@/lib/db-helpers'
import { isPrismaConnectionError } from '@/lib/utils'
import { paymentLabels } from '@/lib/utils'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function formatPaymentMethod(method: PaymentMethod): string {
  return paymentLabels[method] || method
}

export async function GET(request: NextRequest) {
  console.log('📋 [GET /api/dashboard/orders] Iniciando busca de pedidos...')
  
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    console.log('📋 [GET /api/dashboard/orders] Parâmetros:', {
      status,
      search: search?.substring(0, 20) + '...',
    })

    // Construir filtro where
    const where: any = {}

    // Por padrão, excluir pedidos finalizados da lista
    if (!status || status === 'TODOS') {
      where.status = { not: OrderStatus.COMPLETED }
    } else if (status && status !== 'TODOS') {
      // Validar se o status é válido
      if (Object.values(OrderStatus).includes(status as OrderStatus)) {
        where.status = status as OrderStatus
      }
    }

    // Filtrar por busca
    if (search) {
      where.customerName = {
        contains: search,
        mode: 'insensitive',
      }
    }

    // Buscar pedidos com Prisma (com retry)
    const orders = await retryQuery(() =>
      prisma.order.findMany({
        where,
        include: {
          car: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      })
    )

    console.log(`✅ [GET /api/dashboard/orders] Encontrados ${orders.length} pedidos`)

    const formattedOrders = orders.map(order => ({
      id: order.id,
      cliente: order.customerName,
      email: '',
      telefone: order.customerPhone,
      veiculo: order.car.name,
      cor: order.selectedColor || 'Não especificada',
      valor: order.totalPrice,
      pagamento: formatPaymentMethod(order.paymentMethod),
      parcelas: order.installments || 1,
      status: order.status,
      data: order.createdAt.toISOString(),
      mensagensNaoLidas: 0,
    }))

    return NextResponse.json(formattedOrders)
  } catch (error: any) {
    console.error('❌ [GET /api/dashboard/orders] Erro ao buscar pedidos:', error)
    console.error('Error code:', error.code)
    console.error('Error name:', error.name)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack?.substring(0, 500))

    // Erros de conexão do Prisma
    if (isPrismaConnectionError(error)) {
      console.warn('⚠️ [GET /api/dashboard/orders] Banco indisponível. Retornando array vazio.')
      return NextResponse.json([], { status: 200 })
    }

    console.warn('⚠️ [GET /api/dashboard/orders] Erro desconhecido. Retornando array vazio.')
    return NextResponse.json([], { status: 200 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status } = body

    if (!id) {
      return NextResponse.json(
        { error: 'ID do pedido é obrigatório' },
        { status: 400 }
      )
    }

    // Validar status se fornecido
    if (status && !Object.values(OrderStatus).includes(status)) {
      return NextResponse.json(
        { error: 'Status inválido' },
        { status: 400 }
      )
    }

    const order = await prisma.order.update({
      where: { id },
      data: {
        ...(status && { status: status as OrderStatus }),
      },
      include: {
        car: true,
      },
    })

    return NextResponse.json(order)
  } catch (error: any) {
    console.error('❌ Erro ao atualizar pedido:', error)
    console.error('Error code:', error.code)
    console.error('Error message:', error.message)

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Pedido não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Erro ao atualizar pedido' },
      { status: 500 }
    )
  }
}

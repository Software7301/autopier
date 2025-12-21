import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { OrderStatus, PaymentMethod } from '@prisma/client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function formatPaymentMethod(method: PaymentMethod): string {
  const methods: Record<PaymentMethod, string> = {
    PIX: 'Pix',
    DINHEIRO: 'Dinheiro',
    CARTAO_CREDITO: 'Cartão de Crédito',
    CARTAO_DEBITO: 'Cartão de Débito',
    FINANCIAMENTO: 'Financiamento',
    OUTROS: 'Outros',
  }
  return methods[method] || method
}

// Função helper para retry de queries do Prisma
async function retryQuery<T>(
  queryFn: () => Promise<T>,
  maxRetries = 2,
  delay = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await queryFn()
    } catch (error: any) {
      const isConnectionError = 
        error.code === 'P1001' ||
        error.code === 'P1000' ||
        error.code === 'P1017' ||
        error.code === 'P1002' ||
        error.name === 'PrismaClientInitializationError' ||
        error.message?.includes('Can\'t reach database server') ||
        error.message?.includes('Connection') ||
        error.message?.includes('timeout')

      if (isConnectionError && i < maxRetries - 1) {
        console.warn(`⚠️ Tentativa ${i + 1} falhou. Tentando novamente em ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      throw error
    }
  }
  throw new Error('Max retries exceeded')
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const search = searchParams.get('search')

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
    console.error('❌ Erro ao buscar pedidos:', error)
    console.error('Error code:', error.code)
    console.error('Error message:', error.message)

    // Erros de conexão do Prisma
    const isConnectionError = 
      error.code === 'P1001' ||
      error.code === 'P1000' ||
      error.code === 'P1017' ||
      error.code === 'P1002' ||
      error.name === 'PrismaClientInitializationError' ||
      error.message?.includes('Can\'t reach database server') ||
      error.message?.includes('Connection') ||
      error.message?.includes('timeout')

    if (isConnectionError) {
      console.warn('⚠️ Banco indisponível. Retornando array vazio.')
      return NextResponse.json([], { status: 503 })
    }

    console.warn('Erro ao buscar pedidos. Retornando array vazio.')
    return NextResponse.json([])
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

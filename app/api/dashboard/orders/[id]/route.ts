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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        car: true,
      },
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Pedido não encontrado' },
        { status: 404 }
      )
    }

    const formattedOrder = {
      id: order.id,
      cliente: {
        nome: order.customerName,
        telefone: order.customerPhone,
        rg: order.customerRg,
      },
      veiculo: {
        id: order.car.id,
        nome: order.car.name,
        ano: order.car.year,
        cor: order.selectedColor || 'Não especificada',
      },
      pagamento: {
        metodo: formatPaymentMethod(order.paymentMethod),
        parcelas: order.installments || 1,
        valorTotal: order.totalPrice,
        valorParcela:
          order.installments > 1
            ? order.totalPrice / order.installments
            : order.totalPrice,
      },
      status: order.status,
      dataPedido: order.createdAt.toISOString(),
      entrega: {
        data: null,
        observacoes: '',
      },
    }

    return NextResponse.json(formattedOrder)
  } catch (error: any) {
    console.error('❌ Erro ao buscar pedido:', error)
    console.error('Error code:', error.code)
    console.error('Error message:', error.message)

    return NextResponse.json(
      { error: 'Erro ao buscar pedido' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const { status } = body

    if (status && !Object.values(OrderStatus).includes(status)) {
      return NextResponse.json(
        { error: 'Status inválido' },
        { status: 400 }
      )
    }

    const updateData: any = {}
    if (status) {
      updateData.status = status as OrderStatus
    }

    const order = await prisma.order.update({
      where: { id },
      data: updateData,
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

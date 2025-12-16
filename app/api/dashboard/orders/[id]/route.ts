import { NextResponse } from 'next/server'
import { getOrderById, updateOrder, getCarById } from '@/lib/storage'

function formatPaymentMethod(method: string): string {
  const methods: Record<string, string> = {
    PIX: 'Pix',
    DINHEIRO: 'Dinheiro',
    CARTAO_CREDITO: 'Cartão de Crédito',
  }
  return methods[method] || method
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const order = getOrderById(id)

    if (!order) {
      return NextResponse.json(
        { error: 'Pedido não encontrado' },
        { status: 404 }
      )
    }

    const car = getCarById(order.carId)

    const formattedOrder = {
      id: order.id,
      cliente: {
        nome: order.customerName,
        telefone: order.customerPhone,
        rg: order.customerRg,
      },
      veiculo: {
        id: car.id,
        nome: car.name,
        ano: car.year,
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
      dataPedido: order.createdAt,
      entrega: {
        data: order.deliveryDate || null,
        observacoes: order.deliveryNotes || '',
      },
    }

    return NextResponse.json(formattedOrder)
  } catch (error) {
    console.error('Erro ao buscar pedido:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar pedido' },
      { status: 500 }
    )
  }
}

// PATCH - Atualizar status do pedido
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const { status, deliveryDate, deliveryNotes } = body

    const updateData: any = {}
    if (typeof status === 'string') {
      updateData.status = status
    }
    if (typeof deliveryDate === 'string') {
      updateData.deliveryDate = deliveryDate
    }
    if (typeof deliveryNotes === 'string') {
      updateData.deliveryNotes = deliveryNotes
    }

    const order = updateOrder(id, updateData)

    if (!order) {
      return NextResponse.json(
        { error: 'Pedido não encontrado' },
        { status: 404 },
      )
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error('Erro ao atualizar pedido:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar pedido' },
      { status: 500 }
    )
  }
}

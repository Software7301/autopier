import { NextResponse } from 'next/server'
import { getOrders, updateOrder, getCarById } from '@/lib/storage'

function formatPaymentMethod(method: string): string {
  const methods: Record<string, string> = {
    PIX: 'Pix',
    DINHEIRO: 'Dinheiro',
    CARTAO_CREDITO: 'Cartão de Crédito',
  }
  return methods[method] || method
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    let orders = getOrders()

    // Por padrão, excluir pedidos finalizados da lista (mas ainda permitir filtrar por eles)
    if (!status || status === 'TODOS') {
      orders = orders.filter(o => o.status !== 'COMPLETED')
    } else if (status && status !== 'TODOS') {
      // Se filtro específico, aplicar normalmente
      orders = orders.filter(o => o.status === status)
    }

    // Filtrar por busca
    if (search) {
      const searchLower = search.toLowerCase()
      orders = orders.filter(o => 
        o.customerName.toLowerCase().includes(searchLower)
      )
    }

    // Ordenar por data (mais recente primeiro)
    orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    const formattedOrders = orders.map(order => {
      const car = getCarById(order.carId)
      return {
        id: order.id,
        cliente: order.customerName,
        email: '',
        telefone: order.customerPhone,
        veiculo: car.name,
        cor: order.selectedColor || 'Não especificada',
        valor: order.totalPrice,
        pagamento: formatPaymentMethod(order.paymentMethod),
        parcelas: order.installments || 1,
        status: order.status,
        data: order.createdAt,
        mensagensNaoLidas: 0,
      }
    })

    return NextResponse.json(formattedOrders)
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error)
    return NextResponse.json([])
  }
}

// PATCH - Atualizar status do pedido
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, status } = body

    const order = updateOrder(id, { status })

    if (!order) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error('Erro ao atualizar pedido:', error)
    return NextResponse.json({ error: 'Erro ao atualizar pedido' }, { status: 500 })
  }
}

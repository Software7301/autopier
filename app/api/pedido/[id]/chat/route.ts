import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let orderId = ''
  try {
    const { id } = await params
    orderId = id
    const searchParams = request.nextUrl.searchParams
    const customerName = searchParams.get('customerName')
    
    // Primeiro, buscar o pedido sem as mensagens para validar acesso
    const order = await prisma.order.findUnique({
      where: { id },
    })

    if (!order) {
      return NextResponse.json({
        orderId: id,
        customerName: '',
        messages: [],
      }, { status: 200 })
    }

    // Validar acesso se customerName for fornecido
    if (customerName) {
      const normalizedCustomerName = customerName.trim().toLowerCase()
      const normalizedOrderName = order.customerName?.trim().toLowerCase() || ''
      
      if (normalizedCustomerName !== normalizedOrderName) {
        return NextResponse.json(
          { error: 'Acesso negado. Este pedido não pertence a você.' },
          { status: 403 }
        )
      }
    }

    // Buscar mensagens separadamente para evitar erro se a tabela não existir
    let messages: any[] = []
    try {
      const orderWithMessages = await prisma.order.findUnique({
        where: { id },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
      })
      messages = orderWithMessages?.messages || []
    } catch (messageError: any) {
      console.error('Erro ao buscar mensagens (tabela pode não existir):', messageError)
      // Se der erro ao buscar mensagens, retornar array vazio
      messages = []
    }

    const formattedMessages = messages.map(msg => ({
      id: msg.id,
      content: msg.content,
      createdAt: msg.createdAt.toISOString(),
      sender: msg.sender as 'cliente' | 'funcionario',
      senderName: msg.senderName,
    }))

    return NextResponse.json({
      orderId: id,
      customerName: order.customerName,
      messages: formattedMessages,
    })
  } catch (error: any) {
    console.error('❌ Erro ao buscar mensagens do pedido:', error)
    console.error('Error code:', error.code)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    
    // Sempre retornar 200 com array vazio para não quebrar o frontend
    return NextResponse.json({
      orderId: orderId || '',
      customerName: '',
      messages: [],
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    }, { status: 200 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { content, sender, senderName, customerName } = body

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Mensagem não pode ser vazia' },
        { status: 400 }
      )
    }

    const order = await prisma.order.findUnique({
      where: { id },
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Pedido não encontrado' },
        { status: 404 }
      )
    }

    if (sender === 'funcionario') {
    } else {
      if (!customerName || !customerName.trim()) {
        return NextResponse.json(
          { error: 'Nome do cliente é obrigatório' },
          { status: 400 }
        )
      }

      const normalizedCustomerName = customerName.trim().toLowerCase()
      const normalizedOrderName = order.customerName?.trim().toLowerCase() || ''
      
      if (normalizedCustomerName !== normalizedOrderName) {
        return NextResponse.json(
          { error: 'Acesso negado. Este pedido não pertence a você.' },
          { status: 403 }
        )
      }
    }

    const message = await prisma.orderMessage.create({
      data: {
        orderId: id,
        content: content.trim(),
        sender: sender || 'cliente',
        senderName: senderName || customerName || 'Sistema',
      },
    })

    return NextResponse.json({
      id: message.id,
      content: message.content,
      createdAt: message.createdAt.toISOString(),
      sender: message.sender as 'cliente' | 'funcionario',
      senderName: message.senderName,
    }, { status: 201 })
  } catch (error: any) {
    console.error('Erro ao enviar mensagem:', error)
    
    if (error.code === 'P2021' || error.message?.includes('does not exist')) {
      console.error('Tabela order_messages não existe. Execute: npx prisma db push')
      return NextResponse.json(
        { error: 'Sistema em manutenção. Tente novamente em alguns instantes.' },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: 'Erro ao enviar mensagem' },
      { status: 500 }
    )
  }
}


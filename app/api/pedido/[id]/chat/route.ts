import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 🔴 OBRIGATÓRIO PARA PRISMA FUNCIONAR NA VERCEL
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET - Buscar mensagens do pedido
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let orderId = ''
  try {
    const { id } = await params
    orderId = id
    const searchParams = request.nextUrl.searchParams
    const customerName = searchParams.get('customerName') // Nome do cliente para validação
    
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!order) {
      // ⚠️ Retornar estrutura vazia ao invés de erro para não quebrar frontend
      return NextResponse.json({
        orderId: id,
        customerName: '',
        messages: [], // ⚠️ Sempre array
      })
    }

    // Validação de acesso: cliente só pode acessar seus próprios pedidos pelo nome
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

    // Formatar mensagens para o frontend
    const formattedMessages = order.messages.map(msg => ({
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

    // ⚠️ SEMPRE retornar estrutura com array vazio, mesmo em erro
    console.warn('⚠️ Erro ao buscar mensagens. Retornando estrutura vazia.')
    return NextResponse.json({
      orderId: orderId || '',
      customerName: '',
      messages: [], // ⚠️ Sempre array
    })
  }
}

// POST - Enviar mensagem no chat do pedido
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

    if (!customerName || !customerName.trim()) {
      return NextResponse.json(
        { error: 'Nome do cliente é obrigatório' },
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

    // Validar acesso pelo nome
    const normalizedCustomerName = customerName.trim().toLowerCase()
    const normalizedOrderName = order.customerName?.trim().toLowerCase() || ''
    
    if (normalizedCustomerName !== normalizedOrderName) {
      return NextResponse.json(
        { error: 'Acesso negado. Este pedido não pertence a você.' },
        { status: 403 }
      )
    }

    // Criar mensagem
    const message = await prisma.orderMessage.create({
      data: {
        orderId: id,
        content: content.trim(),
        sender: sender || 'cliente',
        senderName: senderName || customerName,
      },
    })

    console.log('✅ Mensagem do pedido criada:', message.id)

    return NextResponse.json({
      id: message.id,
      content: message.content,
      createdAt: message.createdAt.toISOString(),
      sender: message.sender as 'cliente' | 'funcionario',
      senderName: message.senderName,
    }, { status: 201 })
  } catch (error: any) {
    console.error('❌ Erro ao enviar mensagem:', error)
    console.error('Error code:', error.code)
    console.error('Error message:', error.message)

    return NextResponse.json(
      { error: 'Erro ao enviar mensagem' },
      { status: 500 }
    )
  }
}


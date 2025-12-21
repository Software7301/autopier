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
  let orderId = ''
  try {
    const { id } = await params
    orderId = id
    const body = await request.json()
    const { content, sender, senderName, customerName } = body

    console.log('📨 [Chat POST] Recebendo mensagem:', {
      orderId: id,
      hasContent: !!content,
      sender,
      hasSenderName: !!senderName,
      hasCustomerName: !!customerName,
    })

    if (!content || !content.trim()) {
      console.error('❌ [Chat POST] Mensagem vazia')
      return NextResponse.json(
        { error: 'Mensagem não pode ser vazia' },
        { status: 400 }
      )
    }

    const order = await prisma.order.findUnique({
      where: { id },
    })

    if (!order) {
      console.error('❌ [Chat POST] Pedido não encontrado:', id)
      return NextResponse.json(
        { error: 'Pedido não encontrado' },
        { status: 404 }
      )
    }

    if (sender === 'funcionario') {
      console.log('✅ [Chat POST] Mensagem de funcionário - sem validação de nome')
    } else {
      if (!customerName || !customerName.trim()) {
        console.error('❌ [Chat POST] Nome do cliente não fornecido')
        return NextResponse.json(
          { error: 'Nome do cliente é obrigatório' },
          { status: 400 }
        )
      }

      const normalizedCustomerName = customerName.trim().toLowerCase()
      const normalizedOrderName = order.customerName?.trim().toLowerCase() || ''
      
      if (normalizedCustomerName !== normalizedOrderName) {
        console.error('❌ [Chat POST] Acesso negado:', {
          provided: normalizedCustomerName,
          expected: normalizedOrderName,
        })
        return NextResponse.json(
          { error: 'Acesso negado. Este pedido não pertence a você.' },
          { status: 403 }
        )
      }
    }

    console.log('✅ [Chat POST] Criando mensagem...', {
      orderId: id,
      contentLength: content.trim().length,
      sender: sender || 'cliente',
      senderName: senderName || customerName || 'Sistema',
    })

    const message = await prisma.orderMessage.create({
      data: {
        orderId: id,
        content: content.trim(),
        sender: sender || 'cliente',
        senderName: senderName || customerName || 'Sistema',
      },
    })

    console.log('✅ [Chat POST] Mensagem criada com sucesso:', message.id)

    return NextResponse.json({
      id: message.id,
      content: message.content,
      createdAt: message.createdAt.toISOString(),
      sender: message.sender as 'cliente' | 'funcionario',
      senderName: message.senderName,
    }, { status: 201 })
  } catch (error: any) {
    console.error('❌ [Chat POST] Erro ao enviar mensagem:', error)
    console.error('Error code:', error.code)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    console.error('Order ID:', orderId)
    
    // Erro de tabela não encontrada
    if (error.code === 'P2021' || error.message?.includes('does not exist') || error.message?.includes('order_messages')) {
      console.error('❌ [Chat POST] Tabela order_messages não existe')
      return NextResponse.json(
        { 
          error: 'Sistema em manutenção. A tabela de mensagens não foi criada. Tente novamente em alguns instantes.',
          code: 'TABLE_NOT_FOUND'
        },
        { status: 503 }
      )
    }

    // Erros de conexão do Prisma
    if (
      error.code === 'P1001' ||
      error.code === 'P1000' ||
      error.code === 'P1017' ||
      error.code === 'P1002' ||
      error.name === 'PrismaClientInitializationError' ||
      error.message?.includes('Can\'t reach database server') ||
      error.message?.includes('Connection')
    ) {
      console.error('❌ [Chat POST] Erro de conexão com banco de dados')
      return NextResponse.json(
        { 
          error: 'Erro de conexão com o banco de dados. Tente novamente em alguns instantes.',
          code: 'DATABASE_CONNECTION_ERROR'
        },
        { status: 503 }
      )
    }

    // Erros de validação do Prisma
    if (error.code === 'P2002') {
      console.error('❌ [Chat POST] Dados duplicados')
      return NextResponse.json(
        { error: 'Erro: Dados duplicados' },
        { status: 409 }
      )
    }

    if (error.code === 'P2003') {
      console.error('❌ [Chat POST] Foreign key constraint failed')
      return NextResponse.json(
        { error: 'Erro: Pedido inválido' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        error: 'Erro ao enviar mensagem',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        code: error.code || 'UNKNOWN_ERROR'
      },
      { status: 500 }
    )
  }
}


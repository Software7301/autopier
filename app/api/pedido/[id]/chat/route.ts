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
    
    console.log('📋 [GET /api/pedido/[id]/chat] Buscando mensagens do pedido:', {
      orderId: id,
      hasCustomerName: !!customerName,
    })
    
    // Buscar pedido e mensagens em uma única query para evitar problemas com prepared statements
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!order) {
      console.warn('⚠️ [GET /api/pedido/[id]/chat] Pedido não encontrado:', id)
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
        console.warn('⚠️ [GET /api/pedido/[id]/chat] Acesso negado:', {
          provided: normalizedCustomerName,
          expected: normalizedOrderName,
        })
        return NextResponse.json(
          { error: 'Acesso negado. Este pedido não pertence a você.' },
          { status: 403 }
        )
      }
    }

    // Formatar mensagens (pode estar vazio se a tabela não existir ou não houver mensagens)
    const formattedMessages = (order.messages || []).map(msg => ({
      id: msg.id,
      content: msg.content,
      createdAt: msg.createdAt.toISOString(),
      sender: msg.sender as 'cliente' | 'funcionario',
      senderName: msg.senderName,
    }))

    console.log(`✅ [GET /api/pedido/[id]/chat] Retornando ${formattedMessages.length} mensagens`)

    return NextResponse.json({
      orderId: id,
      customerName: order.customerName,
      messages: formattedMessages,
    })
  } catch (error: any) {
    console.error('❌ [GET /api/pedido/[id]/chat] Erro ao buscar mensagens do pedido:', error)
    console.error('Error code:', error.code)
    console.error('Error name:', error.name)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack?.substring(0, 500))
    
    // Erro específico de prepared statement - pode ser problema de conexão
    if (error.message?.includes('bind message supplies') || error.message?.includes('prepared statement')) {
      console.error('❌ [GET /api/pedido/[id]/chat] Erro de prepared statement - possivelmente problema de conexão ou Prisma Client desatualizado')
      // Retornar resposta vazia mas válida
      return NextResponse.json({
        orderId: orderId || '',
        customerName: '',
        messages: [],
      }, { status: 200 })
    }
    
    // Erro de tabela não encontrada
    if (error.code === 'P2021' || error.message?.includes('does not exist') || error.message?.includes('order_messages')) {
      console.error('❌ [GET /api/pedido/[id]/chat] Tabela order_messages não existe')
      return NextResponse.json({
        orderId: orderId || '',
        customerName: '',
        messages: [],
      }, { status: 200 })
    }
    
    // Erros de conexão
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
      console.warn('⚠️ [GET /api/pedido/[id]/chat] Erro de conexão. Retornando array vazio.')
    }
    
    // Sempre retornar 200 com estrutura válida para não quebrar o frontend
    return NextResponse.json({
      orderId: orderId || '',
      customerName: '',
      messages: [],
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

    // Verificar se o pedido existe e está acessível
    const order = await prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        customerName: true,
        status: true,
      },
    })

    if (!order) {
      console.error('❌ [Chat POST] Pedido não encontrado:', id)
      return NextResponse.json(
        { error: 'Pedido não encontrado' },
        { status: 404 }
      )
    }

    console.log('✅ [Chat POST] Pedido encontrado:', {
      orderId: order.id,
      customerName: order.customerName,
      status: order.status,
    })

    // Validar sender
    const validSender = sender === 'funcionario' || sender === 'cliente' ? sender : 'cliente'
    
    if (validSender === 'funcionario') {
      // Mensagem de funcionário - garantir que senderName existe
      if (!senderName || !senderName.trim()) {
        console.error('❌ [Chat POST] senderName obrigatório para funcionário')
        return NextResponse.json(
          { error: 'Nome do remetente é obrigatório' },
          { status: 400 }
        )
      }
      console.log('✅ [Chat POST] Mensagem de funcionário:', senderName)
    } else {
      // Mensagem de cliente - validar nome
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

    // Garantir que senderName está definido
    const finalSenderName = validSender === 'funcionario' 
      ? (senderName?.trim() || 'AutoPier')
      : (customerName?.trim() || order.customerName || 'Cliente')

    console.log('✅ [Chat POST] Criando mensagem...', {
      orderId: id,
      contentLength: content.trim().length,
      sender: validSender,
      senderName: finalSenderName,
    })

    let message
    try {
      message = await prisma.orderMessage.create({
        data: {
          orderId: id,
          content: content.trim(),
          sender: validSender,
          senderName: finalSenderName,
        },
      })
      console.log('✅ [Chat POST] Mensagem criada com sucesso:', message.id)
    } catch (createError: any) {
      console.error('❌ [Chat POST] Erro ao criar mensagem no Prisma:', {
        code: createError.code,
        name: createError.name,
        message: createError.message,
        meta: createError.meta,
      })
      throw createError // Re-throw para ser capturado pelo catch externo
    }

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

    // Log detalhado do erro
    console.error('❌ [Chat POST] Erro desconhecido:', {
      code: error.code,
      name: error.name,
      message: error.message,
      stack: error.stack?.substring(0, 1000),
      orderId,
      sender: body?.sender,
      hasSenderName: !!body?.senderName,
    })

    return NextResponse.json(
      { 
        error: 'Erro ao enviar mensagem',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        code: error.code || 'UNKNOWN_ERROR',
        hint: error.message?.includes('order_messages') 
          ? 'A tabela order_messages pode não existir. Execute: npx prisma db push'
          : undefined
      },
      { status: 500 }
    )
  }
}


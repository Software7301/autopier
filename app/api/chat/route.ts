import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { NegotiationStatus } from '@prisma/client'
import { getOrCreateSeller, getOrCreateBuyer } from '@/lib/users'
import { isPrismaConnectionError, isPreparedStatementError } from '@/lib/utils'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { negotiationId, senderId, senderName, content, sender, customerName } = body

    if (!negotiationId || !content) {
      return NextResponse.json(
        { error: 'Negociação e conteúdo são obrigatórios' },
        { status: 400 }
      )
    }

    const negotiation = await prisma.negotiation.findUnique({
      where: { id: negotiationId },
      include: {
        buyer: true,
      },
    })

    if (!negotiation) {
      return NextResponse.json(
        { error: 'Negociação não encontrada' },
        { status: 404 }
      )
    }

    const isEmployee = sender === 'funcionario' || senderId === 'seller-autopier'

    let finalSenderId: string
    if (isEmployee) {
      finalSenderId = await getOrCreateSeller()
    } else {
      if (customerName) {
        const normalizedCustomerName = customerName.trim().toLowerCase()
        const normalizedBuyerName = negotiation.buyer.name?.trim().toLowerCase() || ''

        if (normalizedCustomerName !== normalizedBuyerName) {
          return NextResponse.json(
            { error: 'Acesso negado. Esta negociação não pertence a você.' },
            { status: 403 }
          )
        }
      }
      finalSenderId = negotiation.buyerId
    }

    const message = await prisma.message.create({
      data: {
        negotiationId,
        content: content.trim(),
        senderId: finalSenderId,
      },
      include: {
        sender: true,
      },
    })

    if (negotiation.status === NegotiationStatus.OPEN) {
      await prisma.negotiation.update({
        where: { id: negotiationId },
        data: { status: NegotiationStatus.IN_PROGRESS },
      })
    }

    console.log('Mensagem enviada via chat:', message.id)

    return NextResponse.json({
      id: message.id,
      content: message.content,
      createdAt: message.createdAt.toISOString(),
      sender: {
        id: message.sender.id,
        name: message.sender.name,
        role: message.sender.role,
      },
    }, { status: 201 })
  } catch (error: any) {
    console.error('❌ Erro ao enviar mensagem:', error)
    console.error('Error code:', error.code)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack?.substring(0, 500))

    if (error.message?.includes('bind message supplies') || error.message?.includes('prepared statement')) {
      console.error('❌ Erro de prepared statement - possivelmente problema de conexão')
      return NextResponse.json(
        { error: 'Erro temporário. Tente novamente.' },
        { status: 500 }
      )
    }

    if (
      error.code === 'P1001' ||
      error.code === 'P1000' ||
      error.code === 'P1017' ||
      error.code === 'P1002' ||
      error.code === 'P1003' ||
      error.name === 'PrismaClientInitializationError' ||
      error.message?.includes('Can\'t reach database server') ||
      error.message?.includes('Connection') ||
      error.message?.includes('timeout')
    ) {
      return NextResponse.json(
        { error: 'Erro de conexão com o banco de dados. Tente novamente.' },
        { status: 500 }
      )
    }

    if (error.code === 'P2003' || error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Negociação ou usuário não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        error: 'Erro ao enviar mensagem',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  console.log('📋 [GET /api/chat] Iniciando busca de mensagens...')

  try {
    const searchParams = request.nextUrl.searchParams
    const negotiationId = searchParams.get('negotiationId')
    const customerName = searchParams.get('customerName')

    console.log('📋 [GET /api/chat] Parâmetros:', {
      negotiationId,
      hasCustomerName: !!customerName,
    })

    if (!negotiationId) {
      console.warn('⚠️ [GET /api/chat] ID da negociação não fornecido')
      return NextResponse.json({
        message: 'Endpoint de chat - buscar mensagens de uma negociação',
        method: 'GET',
        requiredParams: ['negotiationId'],
        optionalParams: ['customerName'],
        example: '/api/chat?negotiationId=abc123&customerName=João Silva',
        error: 'ID da negociação é obrigatório'
      }, { status: 400 })
    }

    const negotiation = await prisma.negotiation.findUnique({
      where: { id: negotiationId },
      include: {
        buyer: true,
      },
    })

    if (!negotiation) {
      console.warn('⚠️ [GET /api/chat] Negociação não encontrada:', negotiationId)
      return NextResponse.json(
        { error: 'Negociação não encontrada' },
        { status: 404 }
      )
    }

    if (customerName) {
      const normalizedCustomerName = customerName.trim().toLowerCase()
      const normalizedBuyerName = negotiation.buyer.name?.trim().toLowerCase() || ''

      if (normalizedCustomerName !== normalizedBuyerName) {
        console.warn('⚠️ [GET /api/chat] Acesso negado:', {
          provided: normalizedCustomerName,
          expected: normalizedBuyerName,
        })
        return NextResponse.json(
          { error: 'Acesso negado. Esta negociação não pertence a você.' },
          { status: 403 }
        )
      }
    }

    let messages: any[] = []
    try {
      messages = await prisma.message.findMany({
        where: { negotiationId },
        include: {
          sender: true,
        },
        orderBy: { createdAt: 'asc' },
      })
      console.log(`✅ [GET /api/chat] Encontradas ${messages.length} mensagens`)
    } catch (messageError: any) {
      console.error('❌ [GET /api/chat] Erro ao buscar mensagens:', messageError)

      messages = []
    }

    const formattedMessages = messages.map(msg => ({
      id: msg.id,
      content: msg.content,
      createdAt: msg.createdAt.toISOString(),
      sender: {
        id: msg.sender.id,
        name: msg.sender.name,
        role: msg.sender.role,
      },
    }))

    return NextResponse.json(formattedMessages)
  } catch (error: any) {
    console.error('❌ [GET /api/chat] Erro ao buscar mensagens:', error)
    console.error('Error code:', error.code)
    console.error('Error name:', error.name)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack?.substring(0, 500))

    if (isPreparedStatementError(error)) {
      console.error('❌ [GET /api/chat] Erro de prepared statement')
      return NextResponse.json([], { status: 200 })
    }

    if (isPrismaConnectionError(error)) {
      console.warn('⚠️ [GET /api/chat] Banco indisponível. Retornando array vazio.')
      return NextResponse.json([], { status: 200 })
    }

    console.warn('⚠️ [GET /api/chat] Erro desconhecido. Retornando array vazio.')
    return NextResponse.json([], { status: 200 })
  }
}

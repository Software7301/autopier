import { NextResponse } from 'next/server'
import { getNegotiationById, updateNegotiation, getMessagesByNegotiationId, createMessage, onMessageSent } from '@/lib/storage'

// POST - Enviar mensagem
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { negotiationId, senderId, senderName, content, sender } = body

    // Validação básica
    if (!negotiationId || !content) {
      return NextResponse.json(
        { error: 'Negociação e conteúdo são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se a negociação existe
    const negotiation = getNegotiationById(negotiationId)

    if (!negotiation) {
      return NextResponse.json(
        { error: 'Negociação não encontrada' },
        { status: 404 }
      )
    }

    // Determinar se é cliente ou funcionário
    const isEmployee = sender === 'funcionario' || senderId === 'seller-autopier'
    
    // Criar mensagem
    const message = createMessage({
      negotiationId,
      content: content.trim(),
      sender: isEmployee ? 'funcionario' : 'cliente',
      senderName: senderName || (isEmployee ? 'AutoPier' : negotiation.customerName),
    })

    // Atualizar status da negociação para IN_PROGRESS se estiver PENDING
    if (negotiation.status === 'PENDING') {
      updateNegotiation(negotiationId, { status: 'IN_PROGRESS' })
    }

    // Atualizar sessão de chat (persistência)
    onMessageSent('negotiation', negotiationId, message, !isEmployee)

    console.log('✅ Mensagem enviada via chat:', message.id)

    return NextResponse.json({
      id: message.id,
      content: message.content,
      createdAt: message.createdAt,
      sender: {
        id: isEmployee ? 'seller-autopier' : 'buyer-' + negotiationId,
        name: message.senderName,
        role: isEmployee ? 'DEALER' : 'CUSTOMER',
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error)
    return NextResponse.json(
      { error: 'Erro ao enviar mensagem' },
      { status: 500 }
    )
  }
}

// Forçar renderização dinâmica (usa request.url)
export const dynamic = 'force-dynamic'

// GET - Buscar mensagens de uma negociação
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const negotiationId = searchParams.get('negotiationId')

    if (!negotiationId) {
      return NextResponse.json(
        { error: 'ID da negociação é obrigatório' },
        { status: 400 }
      )
    }

    const negotiation = getNegotiationById(negotiationId)
    const messages = getMessagesByNegotiationId(negotiationId)

    const formattedMessages = messages.map(msg => ({
      id: msg.id,
      content: msg.content,
      createdAt: msg.createdAt,
      sender: {
        id: msg.sender === 'funcionario' ? 'seller-autopier' : 'buyer-' + negotiationId,
        name: msg.senderName,
        role: msg.sender === 'funcionario' ? 'DEALER' : 'CUSTOMER',
      },
    }))

    return NextResponse.json(formattedMessages)
  } catch (error) {
    console.error('Erro ao buscar mensagens:', error)
    return NextResponse.json([])
  }
}

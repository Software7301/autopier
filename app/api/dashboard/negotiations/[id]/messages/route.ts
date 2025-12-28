import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { NegotiationStatus } from '@prisma/client'
import { getOrCreateSeller } from '@/lib/users'
import { isPrismaConnectionError } from '@/lib/utils'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET - Buscar mensagens da negociação
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const negotiation = await prisma.negotiation.findUnique({
      where: { id },
    })

    if (!negotiation) {
      return NextResponse.json(
        { error: 'Negociação não encontrada' },
        { status: 404 }
      )
    }

    const messages = await prisma.message.findMany({
      where: { negotiationId: id },
      include: {
        sender: true,
      },
      orderBy: { createdAt: 'asc' },
    })

    const formattedMessages = messages.map((msg) => ({
      id: msg.id,
      content: msg.content,
      sender: msg.sender.role === 'CUSTOMER' ? 'cliente' : 'funcionario',
      senderName: msg.sender.name,
      createdAt: msg.createdAt.toISOString(),
    }))

    return NextResponse.json(formattedMessages)
  } catch (error: any) {
    console.error('❌ [GET /api/dashboard/negotiations/[id]/messages] Erro ao buscar mensagens:', error)
    console.error('Error code:', error.code)
    console.error('Error name:', error.name)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack?.substring(0, 500))

    if (isPrismaConnectionError(error)) {
      console.warn('⚠️ [GET /api/dashboard/negotiations/[id]/messages] Banco indisponível. Retornando array vazio.')
      return NextResponse.json([], { status: 200 })
    }

    // SEMPRE retornar array vazio em caso de erro (não objeto de erro)
    console.warn('⚠️ [GET /api/dashboard/negotiations/[id]/messages] Erro desconhecido. Retornando array vazio.')
    return NextResponse.json([], { status: 200 })
  }
}

// POST - Enviar mensagem (funcionário)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { content } = body

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Mensagem não pode ser vazia' },
        { status: 400 }
      )
    }

    const negotiation = await prisma.negotiation.findUnique({
      where: { id },
    })

    if (!negotiation) {
      return NextResponse.json(
        { error: 'Negociação não encontrada' },
        { status: 404 }
      )
    }

    // Obter ID do vendedor
    const sellerId = await getOrCreateSeller()

    // Criar mensagem do funcionário
    const message = await prisma.message.create({
      data: {
        negotiationId: id,
        content: content.trim(),
        senderId: sellerId,
      },
      include: {
        sender: true,
      },
    })

    // Atualizar status da negociação para "em andamento" se estiver pendente
    if (negotiation.status === NegotiationStatus.OPEN) {
      await prisma.negotiation.update({
        where: { id },
        data: { status: NegotiationStatus.IN_PROGRESS },
      })
    }

    console.log('✅ Mensagem enviada:', message.id)

    return NextResponse.json({
      id: message.id,
      content: message.content,
      sender: {
        id: message.sender.id,
        name: message.sender.name,
        role: message.sender.role,
      },
      createdAt: message.createdAt.toISOString(),
    })
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

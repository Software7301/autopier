import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 🔴 OBRIGATÓRIO PARA PRISMA FUNCIONAR NA VERCEL
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET - Buscar mensagens do pedido
// NOTA: O schema Prisma atual não tem Message vinculada a Order, apenas a Negotiation
// Esta rota retorna vazio por enquanto, mas mantém a estrutura para compatibilidade
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

    // NOTA: Messages não estão vinculadas a Orders no schema atual
    // Retornar array vazio de mensagens para manter compatibilidade
    // ⚠️ IMPORTANTE: Sempre retornar array de mensagens, mesmo que vazio
    return NextResponse.json({
      orderId: id,
      customerName: order.customerName,
      messages: [], // ⚠️ Sempre array, nunca objeto
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
// NOTA: O schema Prisma atual não suporta mensagens para Orders
// Esta rota retorna erro informativo, mas mantém a estrutura para compatibilidade
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

    const order = await prisma.order.findUnique({
      where: { id },
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Pedido não encontrado' },
        { status: 404 }
      )
    }

    // NOTA: Messages não estão vinculadas a Orders no schema atual
    // Retornar erro informativo
    return NextResponse.json(
      { error: 'Mensagens para pedidos não estão disponíveis no momento. Use negociações para comunicação.' },
      { status: 501 }
    )
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


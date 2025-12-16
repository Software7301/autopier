import { NextRequest, NextResponse } from 'next/server'
import { 
  getActiveChatsForClient, 
  getAllActiveChats, 
  getChatSessionByReference,
  getMessagesByNegotiationId,
  getMessagesByOrderId,
  getNegotiationById,
  getOrderById,
  getCarById,
  markChatAsRead
} from '@/lib/storage'

// Forçar renderização dinâmica (usa searchParams)
export const dynamic = 'force-dynamic'

// GET - Buscar chats ativos
// Query params:
// - phone: telefone do cliente (retorna chats do cliente)
// - all: true (retorna todos os chats ativos - para dashboard)
export async function GET(request: NextRequest) {
  try {
    const phone = request.nextUrl.searchParams.get('phone')
    const all = request.nextUrl.searchParams.get('all')

    if (all === 'true') {
      // Dashboard - retornar todos os chats ativos
      const chats = getAllActiveChats()
      return NextResponse.json({ chats })
    }

    if (phone) {
      // Cliente - retornar chats do cliente específico
      const chats = getActiveChatsForClient(phone)
      return NextResponse.json({ chats })
    }

    // Sem filtro - retornar lista vazia
    return NextResponse.json({ chats: [] })
  } catch (error) {
    console.error('Erro ao buscar chats ativos:', error)
    return NextResponse.json({ chats: [] })
  }
}

// POST - Verificar se existe chat ativo para um telefone
// Usado para reconexão automática
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, negotiationId, orderId } = body

    // Verificar por referência específica
    if (negotiationId) {
      const session = getChatSessionByReference('negotiation', negotiationId)
      if (session) {
        const messages = getMessagesByNegotiationId(negotiationId)
        const negotiation = getNegotiationById(negotiationId)
        
        return NextResponse.json({
          found: true,
          chat: {
            ...session,
            messages,
            negotiation,
          }
        })
      }
    }

    if (orderId) {
      const session = getChatSessionByReference('order', orderId)
      if (session) {
        const messages = getMessagesByOrderId(orderId)
        const order = getOrderById(orderId)
        
        return NextResponse.json({
          found: true,
          chat: {
            ...session,
            messages,
            order,
          }
        })
      }
    }

    // Verificar por telefone
    if (phone) {
      const chats = getActiveChatsForClient(phone)
      
      if (chats.length > 0) {
        // Retornar o chat mais recente
        const mostRecent = chats[0]
        
        let messages = []
        let reference = null
        
        if (mostRecent.type === 'negotiation') {
          messages = getMessagesByNegotiationId(mostRecent.referenceId)
          reference = getNegotiationById(mostRecent.referenceId)
        } else {
          messages = getMessagesByOrderId(mostRecent.referenceId)
          reference = getOrderById(mostRecent.referenceId)
        }
        
        return NextResponse.json({
          found: true,
          chat: {
            ...mostRecent,
            messages,
            reference,
          },
          totalChats: chats.length,
          allChats: chats,
        })
      }
    }

    return NextResponse.json({ found: false })
  } catch (error) {
    console.error('Erro ao verificar chat ativo:', error)
    return NextResponse.json({ found: false, error: 'Erro interno' })
  }
}


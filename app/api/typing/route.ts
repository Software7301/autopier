import { NextRequest, NextResponse } from 'next/server'

// Armazenamento em memória para status de digitação
// Em produção, usar Redis ou similar
const typingStatus: Map<string, { userName: string; timestamp: number }> = new Map()

// Limpar entradas antigas a cada 10 segundos
setInterval(() => {
  const now = Date.now()
  const keysToDelete: string[] = []
  
  typingStatus.forEach((value, key) => {
    // Remover entradas mais antigas que 5 segundos
    if (now - value.timestamp > 5000) {
      keysToDelete.push(key)
    }
  })
  
  keysToDelete.forEach(key => typingStatus.delete(key))
}, 10000)

// Forçar renderização dinâmica (usa searchParams)
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET - Verificar se alguém está digitando
export async function GET(request: NextRequest) {
  const chatId = request.nextUrl.searchParams.get('chatId')
  
  if (!chatId) {
    return NextResponse.json({ typing: false })
  }

  const status = typingStatus.get(chatId)
  
  if (status && Date.now() - status.timestamp < 5000) {
    return NextResponse.json({
      typing: true,
      userName: status.userName,
    })
  }

  return NextResponse.json({ typing: false })
}

// POST - Atualizar status de digitação
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { chatId, userName, typing } = body

    if (!chatId || !userName) {
      return NextResponse.json({ error: 'chatId e userName são obrigatórios' }, { status: 400 })
    }

    if (typing) {
      typingStatus.set(chatId, {
        userName,
        timestamp: Date.now(),
      })
    } else {
      typingStatus.delete(chatId)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao processar requisição' }, { status: 500 })
  }
}


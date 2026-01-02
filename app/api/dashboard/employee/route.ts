import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET - Obter informações do funcionário
export async function GET() {
  try {
    // Por enquanto, retornar dados padrão ou do localStorage
    // Em produção, pode ser salvo no banco de dados
    return NextResponse.json({
      firstName: '',
      lastName: '',
      role: '',
      avatarUrl: '',
      email: 'autopiernovacapitalrp@gmail.com',
    })
  } catch (error: any) {
    console.error('❌ Erro ao buscar informações do funcionário:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar informações do funcionário' },
      { status: 500 }
    )
  }
}

// POST - Salvar informações do funcionário
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { firstName, lastName, role, avatarUrl } = body

    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: 'Nome e sobrenome são obrigatórios' },
        { status: 400 }
      )
    }

    if (!role) {
      return NextResponse.json(
        { error: 'Função é obrigatória' },
        { status: 400 }
      )
    }

    // Por enquanto, apenas retornar sucesso
    // Em produção, pode ser salvo no banco de dados
    return NextResponse.json({
      success: true,
      firstName,
      lastName,
      role,
      avatarUrl: avatarUrl || '',
      email: 'autopiernovacapitalrp@gmail.com',
    })
  } catch (error: any) {
    console.error('❌ Erro ao salvar informações do funcionário:', error)
    return NextResponse.json(
      { error: 'Erro ao salvar informações do funcionário' },
      { status: 500 }
    )
  }
}


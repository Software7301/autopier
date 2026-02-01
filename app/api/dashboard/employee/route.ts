import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {

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


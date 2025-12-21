import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// API simplificada para usuários (sem Prisma)
export async function GET() {
  try {
    return NextResponse.json([])
  } catch (error: any) {
    console.error('❌ Erro ao buscar usuários:', error)
    return NextResponse.json([])
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    return NextResponse.json({
      id: `user-${Date.now()}`,
      name: body.name,
      email: body.email,
      phone: body.phone,
      role: body.role || 'CUSTOMER',
      createdAt: new Date().toISOString(),
    }, { status: 201 })
  } catch (error: any) {
    console.error('❌ Erro ao criar usuário:', error)
    return NextResponse.json(
      { error: 'Erro ao criar usuário' },
      { status: 500 }
    )
  }
}

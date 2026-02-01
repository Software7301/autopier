import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id || typeof id !== 'string' || id.trim() === '') {
      return NextResponse.json(
        { error: 'ID do veículo é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se o veículo existe
    const car = await prisma.car.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!car) {
      return NextResponse.json(
        { error: 'Veículo não encontrado' },
        { status: 404 }
      )
    }

    // Verificar pedidos vinculados
    const ordersCount = await prisma.order.count({
      where: { carId: id },
    })

    // Verificar negociações vinculadas
    const negotiationsCount = await prisma.negotiation.count({
      where: { carId: id },
    })

    const hasConstraints = ordersCount > 0 || negotiationsCount > 0

    return NextResponse.json({
      hasConstraints,
      ordersCount,
      negotiationsCount,
      canDelete: !hasConstraints,
    })
  } catch (error: any) {
    console.error('❌ [GET /api/cars/[id]/check-constraints] Erro:', error)
    return NextResponse.json(
      {
        error: 'Erro ao verificar vínculos do veículo',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    )
  }
}


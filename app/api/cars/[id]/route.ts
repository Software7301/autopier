import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 🔴 OBRIGATÓRIO PARA PRISMA FUNCIONAR NA VERCEL
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET - Buscar carro por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let carId = ''
  try {
    const { id } = await params
    carId = id
    console.log('🚗 [Cars API] Buscando carro:', id)
    
    const car = await prisma.car.findUnique({
      where: { id },
    })
    
    if (!car) {
      console.error('❌ [Cars API] Veículo não encontrado:', id)
      return NextResponse.json(
        { error: 'Veículo não encontrado' },
        { status: 404 }
      )
    }

    console.log('✅ [Cars API] Carro encontrado:', car.name)
    return NextResponse.json(car)
  } catch (error: any) {
    console.error('❌ [Cars API] Erro ao buscar veículo:', carId)
    console.error('Error code:', error.code)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    
    return NextResponse.json(
      { 
        error: 'Erro ao buscar veículo',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

// PUT - Atualizar veículo
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const {
      name,
      brand,
      model,
      year,
      price,
      category,
      imageUrl,
      mileage,
      description,
      color,
      fuel,
      transmission,
      available,
    } = body

    // Validações obrigatórias
    if (!name || !brand || !model || !year || !price || !category || !imageUrl) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: name, brand, model, year, price, category, imageUrl' },
        { status: 400 }
      )
    }

    // Validar categoria
    const validCategories = ['SUV', 'SEDAN', 'COMPACTO', 'ESPORTIVO']
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: 'Categoria inválida. Use: SUV, SEDAN, COMPACTO ou ESPORTIVO' },
        { status: 400 }
      )
    }

    const car = await prisma.car.update({
      where: { id },
      data: {
        name,
        brand,
        model,
        year: parseInt(year),
        price: parseFloat(price),
        category,
        imageUrl,
        mileage: mileage ? parseInt(mileage) : null,
        description: description || null,
        color: color || null,
        fuel: fuel || 'FLEX',
        transmission: transmission || 'AUTOMATIC',
        available: available !== false,
      },
    })

    return NextResponse.json(car)
  } catch (error: any) {
    console.error('Erro ao atualizar veículo:', error)
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Veículo não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Erro ao atualizar veículo' },
      { status: 500 }
    )
  }
}

// DELETE - Deletar veículo
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let carId = ''
  try {
    const { id } = await params
    carId = id

    // Validar se o ID foi fornecido
    if (!id || typeof id !== 'string' || id.trim() === '') {
      console.error('❌ [DELETE /api/cars/[id]] ID inválido ou não fornecido')
      return NextResponse.json(
        { error: 'ID do veículo é obrigatório' },
        { status: 400 }
      )
    }

    console.log('🗑️ [DELETE /api/cars/[id]] Iniciando exclusão do veículo:', id)

    // Verificar se o veículo existe antes de deletar
    const existingCar = await prisma.car.findUnique({
      where: { id },
      select: { id: true, name: true, brand: true },
    })

    if (!existingCar) {
      console.warn('⚠️ [DELETE /api/cars/[id]] Veículo não encontrado:', id)
      return NextResponse.json(
        { error: 'Veículo não encontrado' },
        { status: 404 }
      )
    }

    console.log('✅ [DELETE /api/cars/[id]] Veículo encontrado:', {
      id: existingCar.id,
      name: existingCar.name,
      brand: existingCar.brand,
    })

    // Deletar o veículo
    await prisma.car.delete({
      where: { id },
    })

    console.log('✅ [DELETE /api/cars/[id]] Veículo deletado com sucesso:', id)

    return NextResponse.json(
      { 
        success: true,
        message: 'Veículo deletado com sucesso',
        deletedId: id,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('❌ [DELETE /api/cars/[id]] Erro ao deletar veículo:', carId)
    console.error('Error code:', error.code)
    console.error('Error name:', error.name)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack?.substring(0, 500))

    // Erro específico do Prisma: registro não encontrado
    if (error.code === 'P2025') {
      console.warn('⚠️ [DELETE /api/cars/[id]] Veículo não encontrado (P2025):', carId)
      return NextResponse.json(
        { error: 'Veículo não encontrado' },
        { status: 404 }
      )
    }

    // Erros de validação
    if (error.code === 'P2003') {
      console.error('❌ [DELETE /api/cars/[id]] Erro de foreign key constraint')
      return NextResponse.json(
        { 
          error: 'Não é possível deletar este veículo. Ele está sendo usado em pedidos ou negociações.',
          code: 'FOREIGN_KEY_CONSTRAINT',
        },
        { status: 400 }
      )
    }

    // Erro genérico
    return NextResponse.json(
      { 
        error: 'Erro ao deletar veículo',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        code: error.code || 'UNKNOWN_ERROR',
      },
      { status: 500 }
    )
  }
}

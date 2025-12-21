import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Função helper para retry de queries do Prisma
async function retryQuery<T>(
  queryFn: () => Promise<T>,
  maxRetries = 2,
  delay = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await queryFn()
    } catch (error: any) {
      const isConnectionError = 
        error.code === 'P1001' ||
        error.code === 'P1000' ||
        error.code === 'P1017' ||
        error.code === 'P1002' ||
        error.name === 'PrismaClientInitializationError' ||
        error.message?.includes('Can\'t reach database server') ||
        error.message?.includes('Connection') ||
        error.message?.includes('timeout')

      if (isConnectionError && i < maxRetries - 1) {
        console.warn(`⚠️ Tentativa ${i + 1} falhou. Tentando novamente em ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      throw error
    }
  }
  throw new Error('Max retries exceeded')
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')
    const available = searchParams.get('available') !== 'false'

    const where: any = {}

    if (category && category !== 'TODOS') {
      where.category = category
    }

    if (available) {
      where.available = true
    }

    const cars = await retryQuery(() =>
      prisma.car.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
      })
    )

    return NextResponse.json(Array.isArray(cars) ? cars : [])
  } catch (error: any) {
    console.error('Erro ao buscar carros:', error)
    console.error('Error code:', error.code)
    console.error('Error name:', error.name)
    console.error('Error message:', error.message)

    // Erros de conexão - retornar array vazio
    const isConnectionError = 
      error.code === 'P1001' ||
      error.code === 'P1000' ||
      error.code === 'P1017' ||
      error.code === 'P1002' ||
      error.name === 'PrismaClientInitializationError' ||
      error.message?.includes('Can\'t reach database server') ||
      error.message?.includes('Connection') ||
      error.message?.includes('timeout')

    if (isConnectionError) {
      console.warn('⚠️ Erro de conexão com o banco. Retornando array vazio.')
      return NextResponse.json([], { status: 503 })
    }

    console.warn('Erro ao buscar carros. Retornando array vazio.')
    return NextResponse.json([])
  }
}

// =======================
export async function POST(request: NextRequest) {
  try {
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
        {
          error:
            'Campos obrigatórios: name, brand, model, year, price, category, imageUrl',
        },
        { status: 400 }
      )
    }

    const validCategories = ['SUV', 'SEDAN', 'COMPACTO', 'ESPORTIVO']
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: 'Categoria inválida' },
        { status: 400 }
      )
    }

    const carData = {
      name,
      brand,
      model,
      year: Number(year),
      price: Number(price),
      category,
      imageUrl,
      mileage: mileage ? Number(mileage) : null,
      description: description || null,
      color: color || null,
      fuel: fuel || 'FLEX',
      transmission: transmission || 'AUTOMATIC',
      available: available !== false,
      featured: false,
    }

    console.log('🚗 Criando veículo:', carData)

    const car = await prisma.car.create({
      data: carData,
    })

    return NextResponse.json(car, { status: 201 })
  } catch (error: any) {
    console.error('❌ Erro ao criar veículo:', error)
    console.error('Error code:', error.code)
    console.error('Error name:', error.name)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack?.substring(0, 500))

    // Erros de conexão do Prisma - retornar mensagem real do Prisma
    if (
      error.code === 'P1001' || // Can't reach database server
      error.code === 'P1000' || // Authentication failed
      error.code === 'P1017' || // Server has closed the connection
      error.code === 'P1002' || // Database server connection timeout
      error.code === 'P1003' || // Database does not exist
      error.name === 'PrismaClientInitializationError' ||
      error.message?.includes('Can\'t reach database server') ||
      error.message?.includes('Environment variable not found') ||
      error.message?.includes('Connection') ||
      error.message?.includes('SSL') ||
      error.message?.includes('timeout') ||
      error.message?.includes('certificate')
    ) {
      return NextResponse.json(
        {
          error: 'Erro de conexão com o banco de dados',
          details: error.message,
          code: error.code || error.name,
        },
        { status: 500 }
      )
    }

    // Erros de validação do Prisma
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Veículo com dados duplicados' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { 
        error: 'Erro ao criar veículo',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

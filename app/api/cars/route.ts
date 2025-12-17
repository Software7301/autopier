import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 🔴 OBRIGATÓRIO PARA PRISMA FUNCIONAR NA VERCEL
// Edge runtime NÃO suporta Prisma - FORÇAR Node.js
export const runtime = 'nodejs'

// Forçar renderização dinâmica
export const dynamic = 'force-dynamic'

// =======================
// GET - Listar veículos
// =======================
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

    const cars = await prisma.car.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(cars)
  } catch (error: any) {
    console.error('❌ Erro ao buscar carros:', error)
    console.error('Error code:', error.code)
    console.error('Error name:', error.name)
    console.error('Error message:', error.message)

    // Erros de conexão do Prisma - deixar o Prisma lidar com a mensagem
    if (
      error.code === 'P1001' ||
      error.code === 'P1000' ||
      error.code === 'P1017' ||
      error.name === 'PrismaClientInitializationError' ||
      error.message?.includes('Can\'t reach database server')
    ) {
      console.warn('⚠️ Banco indisponível. Retornando array vazio.')
      return NextResponse.json([])
    }

    return NextResponse.json(
      { error: 'Erro ao buscar carros' },
      { status: 500 }
    )
  }
}

// =======================
// POST - Criar veículo
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
    console.error('Error stack:', error.stack)

    // Erros de conexão do Prisma - retornar mensagem real do Prisma
    if (
      error.code === 'P1001' ||
      error.code === 'P1000' ||
      error.code === 'P1017' ||
      error.name === 'PrismaClientInitializationError' ||
      error.message?.includes('Can\'t reach database server') ||
      error.message?.includes('Environment variable not found')
    ) {
      return NextResponse.json(
        {
          error: 'Erro de conexão com o banco de dados',
          details: error.message,
          code: error.code,
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

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Forçar renderização dinâmica (usa searchParams)
export const dynamic = 'force-dynamic'

// GET - Listar todos os carros disponíveis (apenas disponíveis)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')
    const available = searchParams.get('available') !== 'false' // Por padrão, só mostra disponíveis

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
    console.error('Erro ao buscar carros:', error)
    
    // Se for erro de conexão com banco, retornar array vazio para não quebrar o frontend
    if (error.code === 'P1001' || error.message?.includes('DATABASE_URL') || error.message?.includes('Environment variable')) {
      console.warn('Banco de dados não configurado. Retornando array vazio.')
      return NextResponse.json([])
    }
    
    return NextResponse.json(
      { error: 'Erro ao buscar carros' },
      { status: 500 }
    )
  }
}

// POST - Criar novo veículo
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

    const carData = {
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
      available: available !== false, // Por padrão, disponível
      featured: false,
    }

    console.log('Criando veículo com dados:', carData)

    const car = await prisma.car.create({
      data: carData,
    })

    console.log('Veículo criado com sucesso:', car.id, car.name, 'Available:', car.available)

    return NextResponse.json(car, { status: 201 })
  } catch (error: any) {
    console.error('Erro ao criar veículo:', error)
    
    // Se for erro de conexão com banco
    if (error.code === 'P1001' || error.message?.includes('DATABASE_URL') || error.message?.includes('Environment variable')) {
      return NextResponse.json(
        { error: 'Banco de dados não configurado. Configure a variável DATABASE_URL no arquivo .env' },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: error.message || 'Erro ao criar veículo' },
      { status: 500 }
    )
  }
}

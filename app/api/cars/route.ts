import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 🔴 OBRIGATÓRIO PARA PRISMA FUNCIONAR NA VERCEL
// Edge runtime NÃO suporta Prisma - FORÇAR Node.js
export const runtime = 'nodejs'

// Forçar renderização dinâmica
export const dynamic = 'force-dynamic'

// Verificar se DATABASE_URL está disponível em runtime
function checkDatabaseConnection() {
  const databaseUrl = process.env.DATABASE_URL
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL não encontrada em process.env')
    console.error('Variáveis disponíveis:', Object.keys(process.env).filter(k => k.includes('DATABASE')))
    return false
  }
  
  // Verificar se a URL é válida
  if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
    console.error('❌ DATABASE_URL formato inválido:', databaseUrl.substring(0, 20) + '...')
    return false
  }
  
  return true
}

// =======================
// GET - Listar veículos
// =======================
export async function GET(request: NextRequest) {
  try {
    // Verificar conexão antes de usar Prisma
    if (!checkDatabaseConnection()) {
      console.warn('⚠️ DATABASE_URL não configurada. Retornando array vazio.')
      return NextResponse.json([])
    }

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

    // Erros de conexão do Prisma
    if (
      error.code === 'P1001' ||
      error.code === 'P1000' ||
      error.code === 'P1017' ||
      error.name === 'PrismaClientInitializationError' ||
      error.message?.includes('DATABASE_URL') ||
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
    // Verificar conexão ANTES de processar o body
    if (!checkDatabaseConnection()) {
      console.error('❌ DATABASE_URL não configurada em runtime')
      return NextResponse.json(
        {
          error: 'Banco de dados não configurado. Verifique DATABASE_URL na Vercel.',
          details: 'A variável DATABASE_URL não está disponível em runtime. Verifique se está configurada corretamente no painel da Vercel.',
        },
        { status: 500 }
      )
    }

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

    // Erros de conexão do Prisma
    if (
      error.code === 'P1001' ||
      error.code === 'P1000' ||
      error.code === 'P1017' ||
      error.name === 'PrismaClientInitializationError' ||
      error.message?.includes('DATABASE_URL') ||
      error.message?.includes('Can\'t reach database server') ||
      error.message?.includes('Environment variable not found')
    ) {
      return NextResponse.json(
        {
          error: 'Banco de dados não configurado. Verifique DATABASE_URL na Vercel.',
          details: `Erro do Prisma: ${error.code || error.name} - ${error.message}`,
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

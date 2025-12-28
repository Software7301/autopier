import { NextRequest, NextResponse } from 'next/server'
import { prisma, resetPrismaConnection } from '@/lib/prisma'
import { retryQuery } from '@/lib/db-helpers'
import { isPrismaConnectionError, isPreparedStatementError } from '@/lib/utils'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  console.log('📋 [GET /api/cars] Iniciando busca de carros...')
  
  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')
    const available = searchParams.get('available') !== 'false'

    console.log('📋 [GET /api/cars] Parâmetros:', {
      category,
      available,
    })

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

    console.log(`✅ [GET /api/cars] Encontrados ${Array.isArray(cars) ? cars.length : 0} carros`)

    return NextResponse.json(Array.isArray(cars) ? cars : [])
  } catch (error: any) {
    console.error('❌ [GET /api/cars] Erro ao buscar carros:', error)
    console.error('Error code:', error.code)
    console.error('Error name:', error.name)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack?.substring(0, 500))

    // Erros de conexão - retornar array vazio
    if (isPrismaConnectionError(error)) {
      console.warn('⚠️ [GET /api/cars] Erro de conexão com o banco. Retornando array vazio.')
      return NextResponse.json([], { status: 200 })
    }

    console.warn('⚠️ [GET /api/cars] Erro desconhecido. Retornando array vazio.')
    return NextResponse.json([], { status: 200 })
  }
}

// =======================
export async function POST(request: NextRequest) {
  console.log('🚗 [POST /api/cars] Iniciando criação de veículo...')
  
  try {
    const body = await request.json()
    console.log('🚗 [POST /api/cars] Dados recebidos:', {
      hasName: !!body.name,
      hasBrand: !!body.brand,
      hasModel: !!body.model,
      hasYear: !!body.year,
      hasPrice: !!body.price,
      hasCategory: !!body.category,
      hasImageUrl: !!body.imageUrl,
      category: body.category,
      year: body.year,
      price: body.price,
    })

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
      console.error('❌ [POST /api/cars] Campos obrigatórios faltando:', {
        name: !!name,
        brand: !!brand,
        model: !!model,
        year: !!year,
        price: !!price,
        category: !!category,
        imageUrl: !!imageUrl,
      })
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
      console.error('❌ [POST /api/cars] Categoria inválida:', category)
      return NextResponse.json(
        { error: `Categoria inválida. Use uma das seguintes: ${validCategories.join(', ')}` },
        { status: 400 }
      )
    }

    // Validar tipos numéricos
    const yearNum = Number(year)
    const priceNum = Number(price)
    
    if (isNaN(yearNum) || yearNum < 1900 || yearNum > 2100) {
      console.error('❌ [POST /api/cars] Ano inválido:', year)
      return NextResponse.json(
        { error: 'Ano inválido. Deve ser um número entre 1900 e 2100' },
        { status: 400 }
      )
    }

    if (isNaN(priceNum) || priceNum <= 0) {
      console.error('❌ [POST /api/cars] Preço inválido:', price)
      return NextResponse.json(
        { error: 'Preço inválido. Deve ser um número maior que zero' },
        { status: 400 }
      )
    }

    // Validar enums
    const validFuelTypes = ['FLEX', 'GASOLINA', 'DIESEL', 'ELETRICO', 'HIBRIDO']
    const validTransmissionTypes = ['MANUAL', 'AUTOMATIC']
    
    const finalFuel = validFuelTypes.includes(fuel) ? fuel : 'FLEX'
    const finalTransmission = validTransmissionTypes.includes(transmission) ? transmission : 'AUTOMATIC'

    const carData = {
      name: name.trim(),
      brand: brand.trim(),
      model: model.trim(),
      year: yearNum,
      price: priceNum,
      category: category as 'SUV' | 'SEDAN' | 'COMPACTO' | 'ESPORTIVO',
      imageUrl: imageUrl.trim(),
      mileage: mileage ? Number(mileage) : null,
      description: description ? description.trim() : null,
      color: color ? color.trim() : null,
      fuel: finalFuel as 'FLEX' | 'GASOLINA' | 'DIESEL' | 'ELETRICO' | 'HIBRIDO',
      transmission: finalTransmission as 'MANUAL' | 'AUTOMATIC',
      available: available !== false,
      featured: false,
    }

    console.log('🚗 [POST /api/cars] Dados processados:', carData)

    // Criar veículo diretamente (Prisma gerencia conexões automaticamente)
    // Similar a outras rotas que funcionam como /api/negociacao e /api/checkout
    const car = await prisma.car.create({
      data: carData,
    })

    console.log('✅ [POST /api/cars] Veículo criado com sucesso:', car.id)

    return NextResponse.json(car, { status: 201 })
  } catch (error: any) {
    console.error('❌ [POST /api/cars] Erro ao criar veículo:', error)
    console.error('Error code:', error.code)
    console.error('Error name:', error.name)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack?.substring(0, 1000))
    console.error('Error meta:', error.meta)

    // Erro específico de prepared statement duplicado
    if (isPreparedStatementError(error)) {
      console.error('❌ [POST /api/cars] Erro de prepared statement duplicado após todas as tentativas')
      await resetPrismaConnection()
      return NextResponse.json(
        {
          error: 'Erro temporário ao criar veículo. Por favor, tente novamente em alguns segundos.',
          code: 'PREPARED_STATEMENT_ERROR',
          hint: 'Este é um erro temporário comum em ambientes serverless. Tente novamente.',
        },
        { status: 503 }
      )
    }

    // Erros de conexão do Prisma
    if (isPrismaConnectionError(error)) {
      console.error('❌ [POST /api/cars] Erro de conexão com banco de dados')
      console.error('DATABASE_URL configurada:', !!process.env.DATABASE_URL)
      console.error('DATABASE_URL host:', process.env.DATABASE_URL?.match(/@([^:]+)/)?.[1] || 'não encontrado')
      
      // Tentar resetar conexão antes de retornar erro
      try {
        await resetPrismaConnection()
      } catch (resetError) {
        console.warn('⚠️ [POST /api/cars] Erro ao resetar conexão:', resetError)
      }

      return NextResponse.json(
        {
          error: 'Erro de conexão com o banco de dados. Tente novamente em alguns instantes.',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined,
          code: error.code || error.name,
        },
        { status: 503 }
      )
    }

    // Erros de validação do Prisma
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0] || 'campo'
      console.error('❌ [POST /api/cars] Dados duplicados:', field)
      return NextResponse.json(
        { error: `Veículo com ${field} duplicado` },
        { status: 409 }
      )
    }

    if (error.code === 'P2003') {
      console.error('❌ [POST /api/cars] Foreign key constraint failed')
      return NextResponse.json(
        { error: 'Erro de validação: referência inválida' },
        { status: 400 }
      )
    }

    // Erro genérico
    return NextResponse.json(
      { 
        error: 'Erro ao criar veículo',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        code: error.code || 'UNKNOWN_ERROR',
        hint: error.message?.includes('Invalid value') 
          ? 'Verifique se todos os campos estão no formato correto'
          : undefined
      },
      { status: 500 }
    )
  }
}

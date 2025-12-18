import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PaymentMethod, OrderStatus } from '@prisma/client'

// 🔴 OBRIGATÓRIO PARA PRISMA FUNCIONAR NA VERCEL
// Edge runtime NÃO suporta Prisma - FORÇAR Node.js
export const runtime = 'nodejs'

// Forçar renderização dinâmica
export const dynamic = 'force-dynamic'

// ================= Validações =================
function validateRg(rg: string): boolean {
  return /^\d{6}$/.test(rg.replace(/\D/g, ''))
}

function validatePhone(phone: string): boolean {
  return phone.replace(/\D/g, '').length >= 6
}

// ================= POST =================
export async function POST(request: Request) {
  try {
    const body = await request.json()

    const {
      carId,
      customerName,
      customerRg,
      customerPhone,
      paymentMethod,
      installments,
      totalPrice,
      selectedColor,
    } = body

    const errors: Record<string, string> = {}

    if (!carId) errors.carId = 'Veículo inválido'
    if (!customerName?.trim()) errors.name = 'Nome obrigatório'
    if (!validateRg(customerRg)) errors.rg = 'RG inválido'
    if (!validatePhone(customerPhone)) errors.phone = 'Telefone inválido'

    if (!Object.values(PaymentMethod).includes(paymentMethod)) {
      errors.payment = 'Forma de pagamento inválida'
    }

    let finalInstallments = 1
    if (paymentMethod === PaymentMethod.CARTAO_CREDITO) {
      const n = Number(installments)
      if (n < 1 || n > 12) {
        errors.installments = 'Parcelamento deve ser entre 1 e 12x'
      } else {
        finalInstallments = n
      }
    }

    // Validar totalPrice
    const price = Number(totalPrice)
    if (isNaN(price) || price <= 0) {
      errors.price = 'Preço total inválido'
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ error: 'Dados inválidos', errors }, { status: 400 })
    }

    // ===== Verifica carro =====
    const car = await prisma.car.findUnique({
      where: { id: carId }
    })

    if (!car) {
      return NextResponse.json({ error: 'Veículo não encontrado' }, { status: 404 })
    }

    // ===== Cria pedido =====
    const order = await prisma.order.create({
      data: {
        carId,
        customerName: customerName.trim(),
        customerRg: customerRg.replace(/\D/g, ''),
        customerPhone: customerPhone.replace(/\D/g, ''),
        paymentMethod,
        installments: finalInstallments,
        selectedColor: selectedColor || car.color || 'Preto',
        totalPrice: price, // Garantir que é número
        status: OrderStatus.PENDING,
      }
    })

    return NextResponse.json({
      success: true,
      orderId: order.id
    })
  } catch (err: any) {
    console.error('❌ Checkout error:', err)
    console.error('Error code:', err.code)
    console.error('Error name:', err.name)
    console.error('Error message:', err.message)
    console.error('Error stack:', err.stack?.substring(0, 500))

    // Erros de conexão do Prisma
    if (
      err.code === 'P1001' ||
      err.code === 'P1000' ||
      err.code === 'P1017' ||
      err.name === 'PrismaClientInitializationError' ||
      err.message?.includes('Can\'t reach database server') ||
      err.message?.includes('Environment variable not found')
    ) {
      return NextResponse.json(
        {
          error: 'Erro de conexão com o banco de dados',
          details: err.message,
          code: err.code || err.name,
        },
        { status: 500 }
      )
    }

    // Erros de validação do Prisma
    if (err.code === 'P2002') {
      return NextResponse.json(
        { error: 'Pedido com dados duplicados' },
        { status: 409 }
      )
    }

    // Erros de foreign key (carro não existe)
    if (err.code === 'P2003') {
      return NextResponse.json(
        { error: 'Veículo não encontrado ou inválido' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        error: 'Erro interno no checkout',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      },
      { status: 500 }
    )
  }
}

// ================= GET =================
export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      include: { car: true },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(orders)
  } catch (err: any) {
    console.error('❌ Erro ao buscar pedidos:', err)
    console.error('Error code:', err.code)
    console.error('Error message:', err.message)

    // Erros de conexão do Prisma - retornar array vazio
    if (
      err.code === 'P1001' ||
      err.code === 'P1000' ||
      err.code === 'P1017' ||
      err.name === 'PrismaClientInitializationError' ||
      err.message?.includes('Can\'t reach database server')
    ) {
      console.warn('⚠️ Banco indisponível. Retornando array vazio.')
      return NextResponse.json([])
    }

    return NextResponse.json(
      { error: 'Erro ao buscar pedidos' },
      { status: 500 }
    )
  }
}

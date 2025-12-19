import { NextResponse } from 'next/server'
import { PaymentMethod, OrderStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'

// 🔴 OBRIGATÓRIO PARA PRISMA FUNCIONAR NA VERCEL
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ===== VALIDADORES =====
function validateRg(rg: string) {
  return /^\d{6}$/.test(rg.replace(/\D/g, ''))
}

function validatePhone(phone: string) {
  return phone.replace(/\D/g, '').length >= 6
}

// ===== POST /api/checkout =====
export async function POST(req: Request) {
  try {
    const body = await req.json()

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

    // ===== VALIDAÇÕES =====
    if (!carId) {
      return NextResponse.json({ error: 'Carro não informado' }, { status: 400 })
    }

    if (!customerName?.trim()) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    }

    if (!validateRg(customerRg)) {
      return NextResponse.json({ error: 'RG inválido' }, { status: 400 })
    }

    if (!validatePhone(customerPhone)) {
      return NextResponse.json({ error: 'Telefone inválido' }, { status: 400 })
    }

    if (!Object.values(PaymentMethod).includes(paymentMethod)) {
      return NextResponse.json({ error: 'Forma de pagamento inválida' }, { status: 400 })
    }

    // ===== VERIFICAR CARRO =====
    const car = await prisma.car.findUnique({
      where: { id: carId },
    })

    if (!car) {
      return NextResponse.json({ error: 'Carro não encontrado' }, { status: 404 })
    }

    if (!car.available) {
      return NextResponse.json({ error: 'Carro indisponível' }, { status: 400 })
    }

    // ===== CRIAR PEDIDO =====
    const order = await prisma.order.create({
      data: {
        carId,
        customerName: customerName.trim(),
        customerRg: customerRg.replace(/\D/g, ''),
        customerPhone: customerPhone.replace(/\D/g, ''),
        paymentMethod,
        totalPrice: Number(totalPrice),
        installments:
          paymentMethod === PaymentMethod.CARTAO_CREDITO
            ? Number(installments) || 1
            : 1,
        selectedColor: selectedColor || null,
        status: OrderStatus.PENDING,
      },
    })

    return NextResponse.json({
      success: true,
      orderId: order.id,
    })
  } catch (error: any) {
    console.error('❌ Checkout error:', error)
    console.error('Error code:', error.code)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    
    // Retornar mensagem de erro mais específica
    const errorMessage = error.message || 'Erro interno no checkout'
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PaymentMethod, OrderStatus } from '@prisma/client'

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
        totalPrice,
        status: OrderStatus.PENDING,
      }
    })

    return NextResponse.json({
      success: true,
      orderId: order.id
    })
  } catch (err) {
    console.error('❌ Checkout error:', err)
    return NextResponse.json(
      { error: 'Erro interno no checkout' },
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
  } catch (err) {
    console.error(err)
    return NextResponse.json([], { status: 500 })
  }
}

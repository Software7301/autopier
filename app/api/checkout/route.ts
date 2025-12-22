import { NextResponse } from 'next/server'
import { PaymentMethod, OrderStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET - Informação sobre a rota
export async function GET(req: Request) {
  return NextResponse.json({
    message: 'Endpoint de checkout - criar pedido',
    method: 'POST',
    requiredFields: ['carId', 'customerName', 'customerRg', 'customerPhone', 'paymentMethod', 'totalPrice'],
    optionalFields: ['installments', 'selectedColor'],
    example: {
      carId: 'abc123',
      customerName: 'João Silva',
      customerRg: '123456',
      customerPhone: '11999999999',
      paymentMethod: 'PIX',
      totalPrice: 50000,
      selectedColor: 'Branco'
    }
  })
}

function validateRg(rg: string) {
  return /^\d{6}$/.test(rg.replace(/\D/g, ''))
}

function validatePhone(phone: string) {
  return phone.replace(/\D/g, '').length >= 6
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log('📦 [Checkout] Dados recebidos:', {
      carId: body.carId,
      customerName: body.customerName,
      hasRg: !!body.customerRg,
      hasPhone: !!body.customerPhone,
      paymentMethod: body.paymentMethod,
    })

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

    if (!carId) {
      console.error('❌ [Checkout] Carro não informado')
      return NextResponse.json({ error: 'Carro não informado' }, { status: 400 })
    }

    if (!customerName?.trim()) {
      console.error('❌ [Checkout] Nome não informado')
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    }

    if (!customerRg || !validateRg(customerRg)) {
      console.error('❌ [Checkout] RG inválido:', customerRg)
      return NextResponse.json({ error: 'RG inválido. O RG deve ter exatamente 6 dígitos.' }, { status: 400 })
    }

    if (!customerPhone || !validatePhone(customerPhone)) {
      console.error('❌ [Checkout] Telefone inválido:', customerPhone)
      return NextResponse.json({ error: 'Telefone inválido. Mínimo 6 dígitos.' }, { status: 400 })
    }

    if (!paymentMethod || !Object.values(PaymentMethod).includes(paymentMethod)) {
      console.error('❌ [Checkout] Forma de pagamento inválida:', paymentMethod)
      return NextResponse.json({ error: 'Forma de pagamento inválida' }, { status: 400 })
    }

    const car = await prisma.car.findUnique({
      where: { id: carId },
    })

    if (!car) {
      console.error('❌ [Checkout] Carro não encontrado:', carId)
      return NextResponse.json({ error: 'Carro não encontrado' }, { status: 404 })
    }

    if (!car.available) {
      console.error('❌ [Checkout] Carro indisponível:', carId)
      return NextResponse.json({ error: 'Carro indisponível' }, { status: 400 })
    }

    const normalizedRg = customerRg.replace(/\D/g, '')
    const normalizedPhone = customerPhone.replace(/\D/g, '')

    console.log('✅ [Checkout] Criando pedido...', {
      carId,
      customerName: customerName.trim(),
      rgLength: normalizedRg.length,
      phoneLength: normalizedPhone.length,
      paymentMethod,
      totalPrice: Number(totalPrice),
    })

    const order = await prisma.order.create({
      data: {
        carId,
        customerName: customerName.trim(),
        customerRg: normalizedRg,
        customerPhone: normalizedPhone,
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

    console.log('✅ [Checkout] Pedido criado com sucesso:', order.id)

    return NextResponse.json({
      success: true,
      orderId: order.id,
    })
  } catch (error: any) {
    console.error('❌ [Checkout] Erro:', error)
    console.error('Error code:', error.code)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    
    // Erros de conexão do Prisma
    if (
      error.code === 'P1001' ||
      error.code === 'P1000' ||
      error.code === 'P1017' ||
      error.code === 'P1002' ||
      error.code === 'P1003' ||
      error.name === 'PrismaClientInitializationError' ||
      error.message?.includes('Can\'t reach database server') ||
      error.message?.includes('Connection') ||
      error.message?.includes('SSL') ||
      error.message?.includes('timeout')
    ) {
      return NextResponse.json(
        { 
          error: 'Erro de conexão com o banco de dados. Tente novamente em alguns instantes.',
        },
        { status: 503 }
      )
    }

    // Erros de validação do Prisma
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Dados duplicados. Verifique os dados informados.' },
        { status: 409 }
      )
    }

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Recurso não encontrado' },
        { status: 404 }
      )
    }
    
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

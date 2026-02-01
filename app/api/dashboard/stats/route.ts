import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { OrderStatus, NegotiationStatus } from '@prisma/client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth()
    
    const startOfMonth = new Date(year, month, 1, 0, 0, 0, 0)
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    startOfWeek.setHours(0, 0, 0, 0)

    const [allOrders, ordersThisMonthQuery, negotiations] = await Promise.all([
      prisma.order.findMany({
        where: {
          status: OrderStatus.COMPLETED,
        },
      }),
      prisma.order.findMany({
        where: {
          createdAt: { gte: startOfMonth },
        },
      }),
      prisma.negotiation.findMany(),
    ])

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    
    const ordersThisMonth = allOrders.filter(
      o => {
        const updatedDate = new Date(o.updatedAt)
        return updatedDate >= monthStart && updatedDate <= monthEnd
      }
    )
    const ordersThisWeek = allOrders.filter(
      o => {
        const updatedDate = new Date(o.updatedAt)
        return updatedDate >= startOfWeek
      }
    )

    const pendingOrders = ordersThisMonthQuery.filter(
      o => o.status === OrderStatus.PENDING || o.status === OrderStatus.PROCESSING
    ).length
    const completedOrders = allOrders.length

    const vendasMes = ordersThisMonth.length
    const vendasSemana = ordersThisWeek.length
    const faturamentoMes = ordersThisMonth.reduce((sum, o) => sum + o.totalPrice, 0)
    const ticketMedio = vendasMes > 0 ? faturamentoMes / vendasMes : 0

    const salesByMonth = []
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)

      const monthOrders = allOrders.filter(o => {
        const date = new Date(o.updatedAt)
        return date >= monthStart && date <= monthEnd
      })

      salesByMonth.push({
        mes: monthNames[monthStart.getMonth()],
        vendas: monthOrders.length,
        valor: monthOrders.reduce((sum, o) => sum + o.totalPrice, 0),
      })
    }

    const statusCounts = {
      PENDING: ordersThisMonthQuery.filter(o => o.status === OrderStatus.PENDING).length,
      PROCESSING: ordersThisMonthQuery.filter(o => o.status === OrderStatus.PROCESSING).length,
      COMPLETED: allOrders.length,
      CANCELLED: ordersThisMonthQuery.filter(o => o.status === OrderStatus.CANCELLED).length,
    }

    const statusPedidos = [
      { name: 'Novos', value: statusCounts.PENDING, color: '#3b82f6' },
      { name: 'Em Processamento', value: statusCounts.PROCESSING, color: '#eab308' },
      { name: 'Finalizados', value: statusCounts.COMPLETED, color: '#22c55e' },
      { name: 'Cancelados', value: statusCounts.CANCELLED, color: '#ef4444' },
    ]

    let acumulado = 0
    const faturamentoAcumulado = salesByMonth.map(m => {
      acumulado += m.valor
      return { mes: m.mes, faturamento: acumulado }
    })

    const negociacoesAtivas = negotiations.filter(
      n => n.status !== NegotiationStatus.CLOSED && n.status !== NegotiationStatus.REJECTED
    ).length

    return NextResponse.json({
      stats: {
        vendasMes,
        vendasSemana,
        faturamentoMes,
        ticketMedio,
        pedidosPendentes: pendingOrders,
        pedidosConcluidos: completedOrders,
        negociacoesAtivas,
      },
      charts: {
        salesByMonth,
        statusPedidos,
        faturamentoAcumulado,
      },
    })
  } catch (error: any) {
    console.error('❌ Erro ao buscar stats:', error)
    console.error('Error code:', error.code)
    console.error('Error message:', error.message)

    if (
      error.code === 'P1001' ||
      error.code === 'P1000' ||
      error.code === 'P1017' ||
      error.name === 'PrismaClientInitializationError'
    ) {
      console.warn('⚠️ Banco indisponível. Retornando dados vazios.')
    }

    return NextResponse.json({
      stats: {
        vendasMes: 0,
        vendasSemana: 0,
        faturamentoMes: 0,
        ticketMedio: 0,
        pedidosPendentes: 0,
        pedidosConcluidos: 0,
        negociacoesAtivas: 0,
      },
      charts: {
        salesByMonth: [],
        statusPedidos: [],
        faturamentoAcumulado: [],
      },
    })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { OrderStatus, NegotiationStatus } from '@prisma/client'

// 🔴 OBRIGATÓRIO PARA PRISMA FUNCIONAR NA VERCEL
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Data atual considerando fuso horário de São Paulo (Brasil)
    const now = new Date(
      new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    )
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    startOfWeek.setHours(0, 0, 0, 0)

    // Buscar todos os pedidos e negociações
    const [orders, negotiations] = await Promise.all([
      prisma.order.findMany({
        where: {
          createdAt: { gte: startOfMonth },
        },
      }),
      prisma.negotiation.findMany(),
    ])

    // Filtrar pedidos do mês e da semana
    const ordersThisMonth = orders.filter(
      o => o.status === OrderStatus.COMPLETED
    )
    const ordersThisWeek = orders.filter(
      o => new Date(o.createdAt) >= startOfWeek && o.status === OrderStatus.COMPLETED
    )

    // Contar pedidos por status (apenas do mês atual)
    const pendingOrders = orders.filter(
      o => o.status === OrderStatus.PENDING || o.status === OrderStatus.PROCESSING
    ).length
    const completedOrders = orders.filter(
      o => o.status === OrderStatus.COMPLETED
    ).length

    // Calcular métricas
    const vendasMes = ordersThisMonth.length
    const vendasSemana = ordersThisWeek.length
    const faturamentoMes = ordersThisMonth.reduce((sum, o) => sum + o.totalPrice, 0)
    const ticketMedio = vendasMes > 0 ? faturamentoMes / vendasMes : 0

    // Dados para gráficos (últimos 6 meses)
    const salesByMonth = []
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
      
      const monthOrders = orders.filter(o => {
        const date = new Date(o.createdAt)
        return date >= monthStart && date <= monthEnd && o.status === OrderStatus.COMPLETED
      })

      salesByMonth.push({
        mes: monthNames[monthStart.getMonth()],
        vendas: monthOrders.length,
        valor: monthOrders.reduce((sum, o) => sum + o.totalPrice, 0),
      })
    }

    // Status dos pedidos (apenas do mês atual)
    const statusCounts = {
      PENDING: orders.filter(o => o.status === OrderStatus.PENDING).length,
      PROCESSING: orders.filter(o => o.status === OrderStatus.PROCESSING).length,
      COMPLETED: orders.filter(o => o.status === OrderStatus.COMPLETED).length,
      CANCELLED: orders.filter(o => o.status === OrderStatus.CANCELLED).length,
    }

    const statusPedidos = [
      { name: 'Novos', value: statusCounts.PENDING, color: '#3b82f6' },
      { name: 'Em Processamento', value: statusCounts.PROCESSING, color: '#eab308' },
      { name: 'Finalizados', value: statusCounts.COMPLETED, color: '#22c55e' },
      { name: 'Cancelados', value: statusCounts.CANCELLED, color: '#ef4444' },
    ]

    // Faturamento acumulado
    let acumulado = 0
    const faturamentoAcumulado = salesByMonth.map(m => {
      acumulado += m.valor
      return { mes: m.mes, faturamento: acumulado }
    })

    // Negociações ativas
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

    // Erros de conexão do Prisma
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

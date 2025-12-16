import { NextResponse } from 'next/server'
import { getOrders, getNegotiations } from '@/lib/storage'

export async function GET() {
  try {
    const orders = getOrders()
    const negotiations = getNegotiations()

    // Data atual considerando fuso horário de São Paulo (Brasil)
    // Isso garante que a virada de mês/semana siga o horário local da concessionária
    const now = new Date(
      new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    )
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    startOfWeek.setHours(0, 0, 0, 0)

    // Filtrar pedidos do mês e da semana
    const ordersThisMonth = orders.filter(o => 
      new Date(o.createdAt) >= startOfMonth && o.status === 'COMPLETED'
    )
    const ordersThisWeek = orders.filter(o => 
      new Date(o.createdAt) >= startOfWeek && o.status === 'COMPLETED'
    )

    // Contar pedidos por status (apenas do mês atual)
    const pendingOrders = orders.filter(o => 
      new Date(o.createdAt) >= startOfMonth && 
      (o.status === 'PENDING' || o.status === 'PROCESSING')
    ).length
    const completedOrders = orders.filter(o => 
      new Date(o.createdAt) >= startOfMonth && o.status === 'COMPLETED'
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
        return date >= monthStart && date <= monthEnd && o.status === 'COMPLETED'
      })

      salesByMonth.push({
        mes: monthNames[monthStart.getMonth()],
        vendas: monthOrders.length,
        valor: monthOrders.reduce((sum, o) => sum + o.totalPrice, 0),
      })
    }

    // Status dos pedidos (apenas do mês atual)
    const statusCounts = {
      PENDING: orders.filter(o => 
        new Date(o.createdAt) >= startOfMonth && o.status === 'PENDING'
      ).length,
      PROCESSING: orders.filter(o => 
        new Date(o.createdAt) >= startOfMonth && o.status === 'PROCESSING'
      ).length,
      COMPLETED: orders.filter(o => 
        new Date(o.createdAt) >= startOfMonth && o.status === 'COMPLETED'
      ).length,
      CANCELLED: orders.filter(o => 
        new Date(o.createdAt) >= startOfMonth && o.status === 'CANCELLED'
      ).length,
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

    return NextResponse.json({
      stats: {
        vendasMes,
        vendasSemana,
        faturamentoMes,
        ticketMedio,
        pedidosPendentes: pendingOrders,
        pedidosConcluidos: completedOrders,
        negociacoesAtivas: negotiations.filter(n => n.status !== 'COMPLETED').length,
      },
      charts: {
        salesByMonth,
        statusPedidos,
        faturamentoAcumulado,
      },
    })
  } catch (error) {
    console.error('Erro ao buscar stats:', error)
    
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

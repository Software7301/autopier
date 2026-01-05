'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Clock,
  Activity,
  ArrowRight,
  Car,
  Users,
  BarChart3,
  PieChart as PieChartIcon,
} from 'lucide-react'
import { motion } from 'framer-motion'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts'

interface Stats {
  vendasMes: number
  vendasSemana: number
  faturamentoMes: number
  ticketMedio: number
  pedidosPendentes: number
  pedidosConcluidos: number
}

interface ChartData {
  salesByMonth: Array<{ mes: string; vendas: number; valor: number }>
  statusPedidos: Array<{ name: string; value: number; color: string }>
  faturamentoAcumulado: Array<{ mes: string; faturamento: number }>
}

interface Order {
  id: string
  cliente: string
  veiculo: string
  valor: number
  status: string
  data: string
}

const statusLabels: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: 'Pendente', color: 'text-blue-400', bg: 'bg-blue-500/20' },
  PROCESSING: { label: 'Processando', color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  COMPLETED: { label: 'Finalizado', color: 'text-green-400', bg: 'bg-green-500/20' },
  CANCELLED: { label: 'Cancelado', color: 'text-red-400', bg: 'bg-red-500/20' },
}

function formatPrice(price: number): string {
  if (price >= 1000000) {
    return `R$ ${(price / 1000000).toFixed(1)}M`
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
  }).format(price)
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function SalesTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-surface-dark border border-primary/30 rounded-xl p-4 shadow-2xl backdrop-blur-sm">
        <p className="text-white font-semibold mb-3 text-base">{label}</p>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4">
            <span className="text-text-muted text-sm">Vendas:</span>
            <span className="text-primary font-bold text-lg">{data.vendas}</span>
          </div>
          {data.valor > 0 && (
            <div className="flex items-center justify-between gap-4 pt-2 border-t border-surface-border">
              <span className="text-text-muted text-sm">Valor Total:</span>
              <span className="text-accent font-semibold">{formatPrice(data.valor)}</span>
            </div>
          )}
        </div>
      </div>
    )
  }
  return null
}

function StatusTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    const data = payload[0]
    const color = data.payload?.color || data.color || '#3b82f6'
    return (
      <div className="bg-surface-dark border border-primary/30 rounded-xl p-4 shadow-2xl backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span className="text-white font-semibold text-base">{data.name}</span>
        </div>
        <p className="text-primary font-bold text-xl">{data.value} pedidos</p>
      </div>
    )
  }
  return null
}

function RevenueTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-surface-dark border border-accent/30 rounded-xl p-4 shadow-2xl backdrop-blur-sm">
        <p className="text-white font-semibold mb-3 text-base">{label}</p>
        <div className="flex items-center justify-between gap-4">
          <span className="text-text-muted text-sm">Faturamento:</span>
          <span className="text-accent font-bold text-lg">{formatPrice(data.faturamento)}</span>
        </div>
      </div>
    )
  }
  return null
}

function StatCard({
  title,
  value,
  icon: Icon,
  color = 'primary',
  delay = 0
}: {
  title: string
  value: string | number
  icon: React.ElementType
  color?: 'primary' | 'accent' | 'yellow' | 'purple'
  delay?: number
}) {
  const colors = {
    primary: 'bg-primary/20 text-primary',
    accent: 'bg-accent/20 text-accent',
    yellow: 'bg-yellow-500/20 text-yellow-400',
    purple: 'bg-purple-500/20 text-purple-400',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="card-static p-6 hover:border-primary/30 transition-all duration-300"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-text-muted text-sm">{title}</p>
          <p className="text-3xl font-display font-bold text-white">{value}</p>
        </div>
        <div className={`p-3 rounded-xl ${colors[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </motion.div>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    vendasMes: 0,
    vendasSemana: 0,
    faturamentoMes: 0,
    ticketMedio: 0,
    pedidosPendentes: 0,
    pedidosConcluidos: 0,
  })
  const [charts, setCharts] = useState<ChartData>({
    salesByMonth: [],
    statusPedidos: [],
    faturamentoAcumulado: [],
  })
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {

        const statsRes = await fetch('/api/dashboard/stats')
        const statsData = await statsRes.json()
        setStats(statsData.stats)
        setCharts(statsData.charts)

        const ordersRes = await fetch('/api/dashboard/orders')
        const ordersData = await ordersRes.json()
        const safeOrders = Array.isArray(ordersData) ? ordersData : []
        setRecentOrders(safeOrders.slice(0, 5))
      } catch (error) {
        console.error('Erro ao buscar dados:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-text-secondary">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  const hasData = stats.vendasMes > 0 || stats.pedidosPendentes > 0

  return (
    <div className="space-y-8">
      {}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">
            Dashboard
          </h1>
          <p className="text-text-secondary mt-1">
            Bem-vindo ao painel administrativo da AutoPier
          </p>
        </div>
        <div className="flex items-center gap-2 text-text-muted text-sm">
          <Clock className="w-4 h-4" />
          Última atualização: {new Date().toLocaleTimeString('pt-BR')}
        </div>
      </div>

      {}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Vendas no Mês"
          value={stats.vendasMes}
          icon={ShoppingCart}
          color="primary"
          delay={0}
        />
        <StatCard
          title="Faturamento Mensal"
          value={formatPrice(stats.faturamentoMes)}
          icon={DollarSign}
          color="accent"
          delay={0.1}
        />
        <StatCard
          title="Ticket Médio"
          value={formatPrice(stats.ticketMedio)}
          icon={Activity}
          color="yellow"
          delay={0.2}
        />
        <StatCard
          title="Pedidos Pendentes"
          value={stats.pedidosPendentes}
          icon={Clock}
          color="purple"
          delay={0.3}
        />
      </div>

      {!hasData && charts.salesByMonth.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-static p-12 text-center"
        >
          <BarChart3 className="w-16 h-16 text-text-muted mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            Nenhum dado disponível no momento
          </h3>
          <p className="text-text-secondary max-w-md mx-auto">
            Os dados do dashboard serão preenchidos automaticamente conforme os clientes finalizarem compras no site.
          </p>
        </motion.div>
      ) : (
        <>
          {}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="card-static p-6 shadow-lg hover:shadow-xl transition-shadow duration-300"
            >
              <h3 className="text-xl font-semibold text-white flex items-center gap-2 mb-6">
                <BarChart3 className="w-6 h-6 text-primary" />
                Vendas por Mês
              </h3>

              {charts.salesByMonth.length > 0 && charts.salesByMonth.some((m: any) => m.vendas > 0) ? (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart
                    data={charts.salesByMonth}
                    margin={{ top: 25, right: 20, left: 0, bottom: 10 }}
                    barCategoryGap="20%"
                  >
                    <defs>
                      <linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#60a5fa" stopOpacity={1}/>
                        <stop offset="50%" stopColor="#3b82f6" stopOpacity={1}/>
                        <stop offset="100%" stopColor="#2563eb" stopOpacity={0.8}/>
                      </linearGradient>
                      <filter id="glow">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" opacity={0.2} vertical={false} />
                    <XAxis
                      dataKey="mes"
                      stroke="#a3a3a3"
                      fontSize={12}
                      fontWeight={600}
                      tickLine={false}
                      axisLine={{ stroke: '#333', strokeWidth: 1 }}
                      tick={{ fill: '#e5e5e5' }}
                    />
                    <YAxis
                      stroke="#a3a3a3"
                      fontSize={12}
                      fontWeight={600}
                      tickLine={false}
                      axisLine={false}
                      domain={[0, 'auto']}
                      allowDecimals={false}
                      tick={{ fill: '#a3a3a3' }}
                      width={40}
                    />
                    <Tooltip
                      content={<SalesTooltip />}
                      cursor={{ fill: 'rgba(59, 130, 246, 0.08)' }}
                      animationDuration={150}
                      contentStyle={{
                        backgroundColor: '#1e1e1e',
                        border: '1px solid #333',
                        borderRadius: '12px',
                        padding: '12px',
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                      }}
                    />
                    <Bar
                      dataKey="vendas"
                      name="Vendas"
                      fill="url(#colorVendas)"
                      radius={[10, 10, 0, 0]}
                      animationDuration={1000}
                      animationEasing="ease-out"
                      stroke="#60a5fa"
                      strokeWidth={0}
                    >
                      {charts.salesByMonth.map((entry: any, index: number) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.vendas > 0 ? "url(#colorVendas)" : "#2a2a2a"}
                        />
                      ))}
                      <LabelList
                        dataKey="vendas"
                        position="top"
                        fill="#e5e5e5"
                        fontSize={12}
                        fontWeight={600}
                        formatter={(value: any) => (typeof value === 'number' && value > 0) ? value : ''}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center h-[320px] text-center px-4"
                >
                  <BarChart3 className="w-16 h-16 text-text-muted/50 mb-4" />
                  <p className="text-text-secondary text-lg font-medium mb-2">
                    Nenhuma venda registrada neste período
                  </p>
                  <p className="text-text-muted text-sm max-w-sm">
                    Os dados aparecerão automaticamente quando houver vendas finalizadas.
                  </p>
                </motion.div>
              )}
            </motion.div>

            {}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="card-static p-6 shadow-lg hover:shadow-xl transition-shadow duration-300"
            >
              <h3 className="text-xl font-semibold text-white flex items-center gap-2 mb-6">
                <PieChartIcon className="w-6 h-6 text-primary" />
                Status dos Pedidos
              </h3>

              {charts.statusPedidos.some(s => s.value > 0) ? (() => {
                const filteredData = charts.statusPedidos.filter(s => s.value > 0)
                const total = filteredData.reduce((sum, item) => sum + item.value, 0)

                return (
                  <ResponsiveContainer width="100%" height={320}>
                    <PieChart>
                      <defs>
                        {filteredData.map((entry, index) => (
                          <linearGradient key={`gradient-${index}`} id={`gradient-${index}`}>
                            <stop offset="0%" stopColor={entry.color} stopOpacity={1} />
                            <stop offset="100%" stopColor={entry.color} stopOpacity={0.7} />
                          </linearGradient>
                        ))}
                      </defs>
                      <Pie
                        data={filteredData}
                        cx="50%"
                        cy="50%"
                        innerRadius={75}
                        outerRadius={120}
                        paddingAngle={4}
                        dataKey="value"
                        animationDuration={800}
                        animationEasing="ease-out"
                      >
                        {filteredData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={`url(#gradient-${index})`}
                            stroke={entry.color}
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<StatusTooltip />} />
                      {}
                      <text
                        x="50%"
                        y="45%"
                        textAnchor="middle"
                        fill="#fff"
                        fontSize={28}
                        fontWeight="bold"
                        className="font-display"
                      >
                        {total}
                      </text>
                      <text
                        x="50%"
                        y="55%"
                        textAnchor="middle"
                        fill="#888"
                        fontSize={14}
                        fontWeight="500"
                      >
                        Pedidos
                      </text>
                      <Legend
                        verticalAlign="bottom"
                        height={60}
                        iconType="circle"
                        formatter={(value: string, entry: any) => (
                          <span style={{ color: entry.color, fontSize: '13px', fontWeight: 500 }}>
                            {value}
                          </span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )
              })() : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center h-[320px] text-center px-4"
                >
                  <PieChartIcon className="w-16 h-16 text-text-muted/50 mb-4" />
                  <p className="text-text-secondary text-lg font-medium mb-2">
                    Nenhum pedido registrado
                  </p>
                  <p className="text-text-muted text-sm max-w-sm">
                    Os pedidos aparecerão aqui quando os clientes finalizarem compras.
                  </p>
                </motion.div>
              )}
            </motion.div>
          </div>

          {}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="card-static p-6 shadow-lg hover:shadow-xl transition-shadow duration-300"
          >
            <h3 className="text-xl font-semibold text-white flex items-center gap-2 mb-6">
              <TrendingUp className="w-6 h-6 text-primary" />
              Faturamento Acumulado
            </h3>

            {charts.faturamentoAcumulado.length > 0 && charts.faturamentoAcumulado.some((f: any) => f.faturamento > 0) ? (
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart
                  data={charts.faturamentoAcumulado}
                  margin={{ top: 20, right: 20, left: 10, bottom: 10 }}
                >
                  <defs>
                    <linearGradient id="colorFaturamento" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4}/>
                      <stop offset="50%" stopColor="#22c55e" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" opacity={0.3} />
                  <XAxis
                    dataKey="mes"
                    stroke="#888"
                    fontSize={13}
                    fontWeight={500}
                    tickLine={false}
                    axisLine={{ stroke: '#333' }}
                  />
                  <YAxis
                    stroke="#888"
                    fontSize={13}
                    fontWeight={500}
                    tickLine={false}
                    axisLine={{ stroke: '#333' }}
                    tickFormatter={(v) => formatPrice(v)}
                    domain={[0, 'auto']}
                  />
                  <Tooltip
                    content={<RevenueTooltip />}
                    cursor={{ stroke: '#22c55e', strokeWidth: 2, strokeDasharray: '5 5' }}
                    animationDuration={200}
                  />
                  <Area
                    type="monotone"
                    dataKey="faturamento"
                    name="Faturamento"
                    stroke="#22c55e"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorFaturamento)"
                    animationDuration={1000}
                    animationEasing="ease-out"
                    filter="url(#glow)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-[350px] text-center px-4"
              >
                <TrendingUp className="w-16 h-16 text-text-muted/50 mb-4" />
                <p className="text-text-secondary text-lg font-medium mb-2">
                  Nenhum faturamento registrado
                </p>
                <p className="text-text-muted text-sm max-w-sm">
                  O faturamento acumulado será exibido aqui quando houver vendas finalizadas.
                </p>
              </motion.div>
            )}
          </motion.div>
        </>
      )}

      {}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="card-static p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-primary" />
            Pedidos Recentes
          </h3>
          <Link
            href="/dashboard/pedidos"
            className="text-primary hover:text-primary/80 text-sm font-medium flex items-center gap-1 transition-colors"
          >
            Ver todos
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="w-12 h-12 text-text-muted mx-auto mb-3" />
            <p className="text-text-secondary">Nenhum pedido encontrado</p>
            <p className="text-text-muted text-sm mt-1">
              Assim que um cliente finalizar uma compra, ela aparecerá aqui.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-border">
                  <th className="text-left text-text-muted text-sm font-medium py-3 px-4">Cliente</th>
                  <th className="text-left text-text-muted text-sm font-medium py-3 px-4">Veículo</th>
                  <th className="text-left text-text-muted text-sm font-medium py-3 px-4">Valor</th>
                  <th className="text-left text-text-muted text-sm font-medium py-3 px-4">Status</th>
                  <th className="text-left text-text-muted text-sm font-medium py-3 px-4">Data</th>
                  <th className="text-right text-text-muted text-sm font-medium py-3 px-4">Ação</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((pedido) => {
                  const status = statusLabels[pedido.status] || statusLabels.PENDING
                  return (
                    <tr key={pedido.id} className="border-b border-surface-border/50 hover:bg-surface/50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                            <Users className="w-5 h-5 text-primary" />
                          </div>
                          <span className="text-white font-medium">{pedido.cliente}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Car className="w-4 h-4 text-text-muted" />
                          <span className="text-text-secondary">{pedido.veiculo}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-accent font-semibold">{formatPrice(pedido.valor)}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-text-muted text-sm">{formatDate(pedido.data)}</span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <Link
                          href={`/dashboard/pedidos/${pedido.id}`}
                          className="text-primary hover:text-primary/80 text-sm font-medium transition-colors"
                        >
                          Ver detalhes
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  )
}

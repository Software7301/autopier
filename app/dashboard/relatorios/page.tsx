'use client'

import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, PieChart as PieChartIcon, Calendar } from 'lucide-react'
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
} from 'recharts'

interface ChartData {
  salesByMonth: Array<{ mes: string; vendas: number; valor: number }>
  statusPedidos: Array<{ name: string; value: number; color: string }>
  faturamentoAcumulado: Array<{ mes: string; faturamento: number }>
}

function formatPrice(price: number): string {
  if (price >= 1000000) {
    return `R$ ${(price / 1000000).toFixed(1)}M`
  }
  if (price >= 1000) {
    return `R$ ${(price / 1000).toFixed(0)}K`
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
  }).format(price)
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface-dark border border-surface-border rounded-lg p-3 shadow-xl">
        <p className="text-white font-medium mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {typeof entry.value === 'number' && entry.name.toLowerCase().includes('valor') 
              ? formatPrice(entry.value) 
              : entry.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function RelatoriosPage() {
  const [charts, setCharts] = useState<ChartData>({
    salesByMonth: [],
    statusPedidos: [],
    faturamentoAcumulado: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/dashboard/stats')
        const data = await response.json()
        setCharts(data.charts)
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
          <p className="text-text-secondary">Carregando relatórios...</p>
        </div>
      </div>
    )
  }

  const hasData = charts.salesByMonth.length > 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold text-white flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-primary" />
          Relatórios
        </h1>
        <p className="text-text-secondary mt-1">
          Análise de vendas e faturamento da AutoPier
        </p>
      </div>

      {!hasData ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-static p-12 text-center"
        >
          <BarChart3 className="w-16 h-16 text-text-muted mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            Nenhum dado disponível no momento
          </h3>
          <p className="text-text-secondary">
            Os relatórios serão gerados conforme as vendas forem realizadas.
          </p>
        </motion.div>
      ) : (
        <>
          {/* Gráfico de Vendas */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-static p-6"
          >
            <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-primary" />
              Vendas por Mês
            </h3>
            
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={charts.salesByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="mes" stroke="#888" fontSize={12} />
                <YAxis stroke="#888" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar 
                  dataKey="vendas" 
                  name="Vendas"
                  fill="#3b82f6"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Gráficos menores */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status dos Pedidos */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="card-static p-6"
            >
              <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-6">
                <PieChartIcon className="w-5 h-5 text-primary" />
                Status dos Pedidos
              </h3>
              
              {charts.statusPedidos.some(s => s.value > 0) ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={charts.statusPedidos.filter(s => s.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, percent }: { name: string; percent?: number }) => 
                        `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                      }
                      labelLine={false}
                    >
                      {charts.statusPedidos.filter(s => s.value > 0).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[280px] text-text-muted">
                  Nenhum pedido registrado
                </div>
              )}
            </motion.div>

            {/* Faturamento Acumulado */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="card-static p-6"
            >
              <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-6">
                <Calendar className="w-5 h-5 text-primary" />
                Faturamento Acumulado
              </h3>
              
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={charts.faturamentoAcumulado}>
                  <defs>
                    <linearGradient id="colorFat" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="mes" stroke="#888" fontSize={12} />
                  <YAxis stroke="#888" fontSize={12} tickFormatter={(v) => formatPrice(v)} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="faturamento" 
                    name="Faturamento"
                    stroke="#22c55e" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorFat)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>
          </div>
        </>
      )}
    </div>
  )
}


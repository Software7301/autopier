'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ShoppingCart,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  X,
  Car,
  Users,
  BarChart3
} from 'lucide-react'

const menuItems = [
  { href: '/dashboard', label: 'Visão Geral', icon: LayoutDashboard },
  { href: '/dashboard/veiculos', label: 'Veículos', icon: Car },
  { href: '/dashboard/pedidos', label: 'Pedidos', icon: ShoppingCart },
  { href: '/dashboard/negociacoes', label: 'Negociações', icon: MessageSquare },
  { href: '/dashboard/relatorios', label: 'Relatórios', icon: BarChart3 },
  { href: '/dashboard/configuracoes', label: 'Configurações', icon: Settings },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [employeeName, setEmployeeName] = useState('Funcionário')
  const [employeeRole, setEmployeeRole] = useState('')
  const [employeeAvatar, setEmployeeAvatar] = useState<string | null>(null)

  useEffect(() => {
    const loadEmployeeName = () => {
      const savedEmployee = localStorage.getItem('autopier_employee')
      if (savedEmployee) {
        try {
          const parsed = JSON.parse(savedEmployee)
          if (parsed.firstName && parsed.lastName) {
            setEmployeeName(`${parsed.firstName} ${parsed.lastName}`)
          }
          if (parsed.role) {
            setEmployeeRole(parsed.role)
          }
          if (parsed.avatarUrl) {
            setEmployeeAvatar(parsed.avatarUrl)
          }
        } catch (error) {
          console.error('Erro ao carregar nome do funcionário:', error)
        }
      }
    }

    loadEmployeeName()

    const handleEmployeeUpdate = (event: CustomEvent) => {
      const { firstName, lastName, role, avatarUrl } = event.detail
      if (firstName && lastName) {
        setEmployeeName(`${firstName} ${lastName}`)
      }
      if (role) {
        setEmployeeRole(role)
      }
      if (avatarUrl) {
        setEmployeeAvatar(avatarUrl)
      }
    }

    window.addEventListener('employeeUpdated', handleEmployeeUpdate as EventListener)
    return () => {
      window.removeEventListener('employeeUpdated', handleEmployeeUpdate as EventListener)
    }
  }, [])

  if (pathname === '/dashboard/login') {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-background flex">
      {}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-72 bg-background-secondary border-r border-surface-border
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {}
          <div className="p-6 border-b border-surface-border">
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-primary/30 shadow-md shadow-primary/20 group-hover:border-primary/50 transition-all duration-300 flex-shrink-0">
                <Image
                  src="/images.png"
                  alt="AutoPier"
                  width={40}
                  height={40}
                  className="object-cover w-full h-full"
                  priority
                />
              </div>
              <div>
                <h1 className="text-xl font-display font-bold text-white">
                  Auto<span className="text-primary">Pier</span>
                </h1>
                <p className="text-xs text-text-muted">Painel Administrativo</p>
              </div>
            </Link>
          </div>

          {}
          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                    ${isActive
                      ? 'bg-primary text-white shadow-lg shadow-primary/25'
                      : 'text-text-secondary hover:bg-surface hover:text-white'
                    }
                  `}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {}
          <div className="p-4 border-t border-surface-border">
            <div className="flex items-center gap-3 px-4 py-3">
              {employeeAvatar ? (
                <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-primary/30 flex-shrink-0">
                  <Image
                    src={employeeAvatar}
                    alt={employeeName}
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Car className="w-5 h-5 text-primary" />
                </div>
              )}
              <div className="flex-1">
                <p className="text-white text-sm font-medium">{employeeName}</p>
                {employeeRole && (
                  <p className="text-primary text-xs font-medium">{employeeRole}</p>
                )}
                <p className="text-text-muted text-xs">autopiernovacapitalrp@gmail.com</p>
              </div>
            </div>
            <Link
              href="/"
              className="flex items-center gap-3 px-4 py-3 mt-2 rounded-xl text-text-secondary hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Sair</span>
            </Link>
          </div>
        </div>
      </aside>

      {}
      <div className="flex-1 flex flex-col min-h-screen">
        {}
        <header className="lg:hidden sticky top-0 z-30 bg-background-secondary border-b border-surface-border px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 hover:bg-surface rounded-lg transition-colors"
            >
              <Menu className="w-6 h-6 text-white" />
            </button>
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="relative w-8 h-8 rounded-full overflow-hidden border border-primary/30 flex-shrink-0">
                <Image
                  src="/images.png"
                  alt="AutoPier"
                  width={32}
                  height={32}
                  className="object-cover w-full h-full"
                  priority
                />
              </div>
              <span className="text-lg font-display font-bold text-white">
                Auto<span className="text-primary">Pier</span>
              </span>
            </Link>
            <div className="w-10" />
          </div>
        </header>

        {}
        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}


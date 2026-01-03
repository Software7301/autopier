'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Car, Menu, X, MessageCircle, Home, LayoutDashboard, User } from 'lucide-react'
import { ActiveChatIndicator } from './ActiveChatBanner'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()

  const isDashboard = pathname?.startsWith('/dashboard')

  if (isDashboard) {
    return null
  }

  const navLinks = [
    { href: '/', label: 'Início', icon: Home },
    { href: '/cars', label: 'Veículos', icon: Car },
    { href: '/negociacao', label: 'Negociar', icon: MessageCircle },
  ]

  const adminLink = { href: '/dashboard/login', label: 'Área Admin', icon: LayoutDashboard }

  return (
    <header className="sticky top-0 z-50 glass">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-primary/30 shadow-lg shadow-primary/20 group-hover:scale-105 group-hover:border-primary/50 transition-all duration-300">
              <Image
                src="/images.png"
                alt="AutoPier Logo"
                fill
                className="object-cover"
                priority
              />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-white">
                Auto<span className="text-primary">Pier</span>
              </h1>
              <p className="text-xs text-text-muted -mt-1">Concessionária Premium</p>
            </div>
          </Link>

          {}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                prefetch={true}
                className="flex items-center gap-2 text-text-secondary hover:text-white transition-colors duration-300 font-medium"
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            ))}
            {}
            {!isDashboard && <ActiveChatIndicator />}
            <Link
              href="/cliente"
              prefetch={true}
              className="flex items-center gap-2 px-4 py-2 bg-accent/20 hover:bg-accent/30 text-accent hover:text-white rounded-lg transition-all duration-300 font-medium border border-accent/30 hover:border-accent"
            >
              <User className="w-4 h-4" />
              Área do Cliente
            </Link>
            <Link
              href={adminLink.href}
              prefetch={true}
              className="flex items-center gap-2 px-4 py-2 bg-surface hover:bg-primary text-text-secondary hover:text-white rounded-lg transition-all duration-300 font-medium border border-surface-border hover:border-primary"
            >
              <adminLink.icon className="w-4 h-4" />
              {adminLink.label}
            </Link>
          </nav>

          {}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-white hover:bg-surface-hover rounded-lg transition-colors"
            aria-label="Menu"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-surface-border animate-fade-in">
            <nav className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  prefetch={true}
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-text-secondary hover:text-white hover:bg-surface-hover rounded-xl transition-all duration-300"
                >
                  <link.icon className="w-5 h-5" />
                  {link.label}
                </Link>
              ))}
              <div className="border-t border-surface-border my-2" />
              <Link
                href="/cliente"
                prefetch={true}
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-accent hover:text-white hover:bg-accent/20 rounded-xl transition-all duration-300 font-medium"
              >
                <User className="w-5 h-5" />
                Área do Cliente
              </Link>
              <Link
                href={adminLink.href}
                prefetch={true}
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-primary hover:text-white hover:bg-primary/20 rounded-xl transition-all duration-300 font-medium"
              >
                <adminLink.icon className="w-5 h-5" />
                {adminLink.label}
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}

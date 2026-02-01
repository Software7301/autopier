import Link from 'next/link'
import Image from 'next/image'
import { Mail, Phone, MapPin, Instagram, Facebook, Linkedin } from 'lucide-react'
import { COMPANY_INFO } from '@/lib/company-info'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-background-secondary border-t border-surface-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-primary/30 shadow-lg shadow-primary/20 group-hover:border-primary/50 transition-all duration-300">
                <Image
                  src="/images.png"
                  alt="Takahashi Logo"
                  fill
                  className="object-cover"
                  sizes="40px"
                />
              </div>
              <div>
                <h2 className="text-xl font-display font-bold text-white">
                  Takahashi
                </h2>
              </div>
            </Link>
            <p className="text-text-secondary text-xs leading-relaxed">
              {COMPANY_INFO.description}
            </p>
            <div className="flex gap-3">
              <a
                href="#"
                className="w-10 h-10 bg-surface hover:bg-primary rounded-lg flex items-center justify-center transition-all duration-300"
              >
                <Instagram className="w-5 h-5 text-white" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-surface hover:bg-primary rounded-lg flex items-center justify-center transition-all duration-300"
              >
                <Facebook className="w-5 h-5 text-white" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-surface hover:bg-primary rounded-lg flex items-center justify-center transition-all duration-300"
              >
                <Linkedin className="w-5 h-5 text-white" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold text-sm mb-4">Links Rápidos</h3>
            <ul className="space-y-2">
              {[
                { href: '/', label: 'Início' },
                { href: '/cars', label: 'Veículos' },
                { href: '/negociacao', label: 'Negociar Veículo' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-text-secondary hover:text-primary transition-colors duration-300"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold text-sm mb-4">Contato</h3>
            <ul className="space-y-2">
              <li className="flex items-center gap-3 text-text-secondary">
                <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
                <span>{COMPANY_INFO.address}</span>
              </li>
              <li className="flex items-center gap-3 text-text-secondary">
                <Phone className="w-5 h-5 text-primary flex-shrink-0" />
                <a href={`tel:${COMPANY_INFO.phone.replace(/\D/g, '')}`} className="hover:text-primary transition-colors">
                  {COMPANY_INFO.phone}
                </a>
              </li>
              <li className="flex items-center gap-3 text-text-secondary">
                <Mail className="w-5 h-5 text-primary flex-shrink-0" />
                <a href={`mailto:${COMPANY_INFO.email}`} className="hover:text-primary transition-colors">
                  {COMPANY_INFO.email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-surface-border flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-text-muted text-xs">
            © {currentYear} {COMPANY_INFO.name}. Todos os direitos reservados.
          </p>
          <div className="flex gap-4 text-xs">
            <Link href="#" className="text-text-muted hover:text-primary transition-colors">
              Política de Privacidade
            </Link>
            <Link href="#" className="text-text-muted hover:text-primary transition-colors">
              Termos de Uso
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

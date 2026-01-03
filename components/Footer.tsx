import Link from 'next/link'
import Image from 'next/image'
import { Mail, Phone, MapPin, Instagram, Facebook, Linkedin } from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-background-secondary border-t border-surface-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {}
          <div className="space-y-6">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-primary/30 shadow-lg shadow-primary/20 group-hover:border-primary/50 transition-all duration-300">
                <Image
                  src="/images.png"
                  alt="AutoPier Logo"
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <h2 className="text-2xl font-display font-bold text-white">
                  Auto<span className="text-primary">Pier</span>
                </h2>
              </div>
            </Link>
            <p className="text-text-secondary text-sm leading-relaxed">
              Sua concessionária premium de veículos. Encontre o carro dos seus sonhos com as melhores condições do mercado.
            </p>
            <div className="flex gap-4">
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

          {}
          <div>
            <h3 className="text-white font-semibold text-lg mb-6">Links Rápidos</h3>
            <ul className="space-y-4">
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

          {}
          <div>
            <h3 className="text-white font-semibold text-lg mb-6">Contato</h3>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-text-secondary">
                <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
                <span>Av. Brasil, 1234 - São Paulo, SP</span>
              </li>
              <li className="flex items-center gap-3 text-text-secondary">
                <Phone className="w-5 h-5 text-primary flex-shrink-0" />
                <span>(69) 9 9371-6918</span>
              </li>
              <li className="flex items-center gap-3 text-text-secondary">
                <Mail className="w-5 h-5 text-primary flex-shrink-0" />
                <span>maxwanber@gmail.com</span>
              </li>
            </ul>
          </div>
        </div>

        {}
        <div className="mt-12 pt-8 border-t border-surface-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-text-muted text-sm">
            © {currentYear} AutoPier. Todos os direitos reservados.
          </p>
          <div className="flex gap-6 text-sm">
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

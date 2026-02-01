import type { Metadata } from 'next'
import { Outfit, Space_Grotesk } from 'next/font/google'
import './globals.css'
import Header from '@/components/Header'
import FooterWrapper from '@/components/FooterWrapper'
import ClientProviders from '@/components/ClientProviders'

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Takahashi | Concessionária Premium',
  description: 'Encontre o veículo dos seus sonhos. Carros premium, seminovos e usados com as melhores condições do mercado.',
  keywords: ['carros', 'veículos', 'concessionária', 'seminovos', 'usados', 'premium'],
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/apple-touch-icon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={`${outfit.variable} ${spaceGrotesk.variable}`}>
      <body className="font-sans antialiased min-h-screen flex flex-col">
        <ClientProviders>
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <FooterWrapper />
        </ClientProviders>
      </body>
    </html>
  )
}


'use client'

import { useRef } from 'react'
import Link from 'next/link'
import {
  Car,
  MessageCircle,
  Shield,
  Award,
  TrendingUp,
  ArrowRight,
  Users,
  Star,
  CheckCircle,
  Zap,
} from 'lucide-react'
import { motion, useInView } from 'framer-motion'

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" }
  }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: "easeOut" }
  }
}

function AnimatedSection({
  children,
  className = "",
  delay = 0
}: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={fadeInUp}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export default function HomeContent() {
  const benefitsRef = useRef(null)
  const benefitsInView = useInView(benefitsRef, { once: true, margin: "-100px" })

  const simulationsRef = useRef(null)
  const simulationsInView = useInView(simulationsRef, { once: true, margin: "-100px" })

  const conversationSimulations = [
    {
      id: 'sim-1',
      messages: [
        { sender: 'cliente', text: 'Esse Civic 2021 ainda está disponível?', time: '14:23' },
        { sender: 'consultor', text: 'Sim! Está revisado e com garantia. Posso te passar as condições?', time: '14:24' },
        { sender: 'cliente', text: 'Consegue melhorar o valor à vista?', time: '14:25' },
        { sender: 'consultor', text: 'Consigo sim, posso fazer R$ 92.900.', time: '14:26' },
      ],
    },
    {
      id: 'sim-2',
      messages: [
        { sender: 'cliente', text: 'Aceita meu Corolla como parte do pagamento?', time: '15:10' },
        { sender: 'consultor', text: 'Aceitamos sim, fazemos a avaliação na hora.', time: '15:11' },
        { sender: 'cliente', text: 'Ótimo, podemos negociar hoje?', time: '15:12' },
        { sender: 'consultor', text: 'Claro! Já vou separar o veículo.', time: '15:13' },
      ],
    },
    {
      id: 'sim-3',
      messages: [
        { sender: 'cliente', text: 'Qual o prazo de entrega?', time: '16:45' },
        { sender: 'consultor', text: 'Entrega imediata após fechamento.', time: '16:46' },
        { sender: 'cliente', text: 'Perfeito, vamos fechar.', time: '16:47' },
      ],
    },
    {
      id: 'sim-4',
      messages: [
        { sender: 'cliente', text: 'Esse HR-V tem garantia?', time: '10:30' },
        { sender: 'consultor', text: 'Sim, 6 meses de garantia total. Todos os documentos em dia.', time: '10:31' },
        { sender: 'cliente', text: 'Pode me enviar mais fotos?', time: '10:32' },
        { sender: 'consultor', text: 'Claro! Vou enviar agora mesmo pelo chat.', time: '10:33' },
      ],
    },
  ]

  const diferenciais = [
    {
      icon: Shield,
      title: 'Garantia Total',
      description: 'Todos os veículos com garantia de procedência e mecânica verificada.',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: Award,
      title: 'Qualidade Premium',
      description: 'Seleção criteriosa dos melhores veículos do mercado nacional.',
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: MessageCircle,
      title: 'Negociação Direta',
      description: 'Converse diretamente com nossos especialistas em tempo real.',
      color: 'from-green-500 to-green-600'
    },
    {
      icon: TrendingUp,
      title: 'Melhor Preço',
      description: 'Condições especiais, financiamento e facilidades de pagamento.',
      color: 'from-orange-500 to-orange-600'
    },
  ]

  const stats = [
    { value: '500+', label: 'Veículos Vendidos', icon: Car },
    { value: '98%', label: 'Clientes Satisfeitos', icon: Users },
    { value: '10+', label: 'Anos de Mercado', icon: Star },
  ]

  return (
    <div className="min-h-screen overflow-hidden">
      {}
      <section className="relative py-24 lg:py-36 overflow-hidden">
        {}
        <div className="absolute inset-0 hero-pattern" />

        {}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.15, 0.1]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-20 left-10 w-72 h-72 bg-primary rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
          className="absolute bottom-10 right-10 w-96 h-96 bg-accent rounded-full blur-3xl"
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-8">
            {}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 bg-surface/50 backdrop-blur-md border border-surface-border px-5 py-2.5 rounded-full shadow-lg"
            >
              <motion.span
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-2 h-2 bg-accent rounded-full"
              />
              <span className="text-text-secondary text-sm font-medium">Concessionária Premium</span>
            </motion.div>

            {}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-bold leading-tight">
                <span className="text-white">Seu próximo</span>
                <br />
                <motion.span
                  className="text-gradient inline-block"
                  animate={{
                    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
                  }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  style={{
                    backgroundSize: '200% 200%'
                  }}
                >
                  veículo está aqui
                </motion.span>
              </h1>
            </motion.div>

            {}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-xl md:text-2xl text-text-secondary max-w-3xl mx-auto leading-relaxed"
            >
              Encontre carros premium, seminovos e usados com as melhores condições.
              Negociação direta e transparente.
            </motion.p>

            {}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
            >
              <Link
                href="/cars"
                className="btn-primary group flex items-center gap-2 text-lg px-8 py-4 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
              >
                <Car className="w-5 h-5" />
                Ver Veículos
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/negociacao"
                className="btn-secondary flex items-center gap-2 text-lg px-8 py-4 hover:bg-surface-hover transition-all duration-300"
              >
                <MessageCircle className="w-5 h-5" />
                Negociar Veículo
              </Link>
            </motion.div>

            {}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="flex flex-wrap items-center justify-center gap-8 md:gap-16 pt-16"
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  variants={scaleIn}
                  whileHover={{ scale: 1.05 }}
                  className="text-center group cursor-default"
                >
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <stat.icon className="w-5 h-5 text-primary opacity-60 group-hover:opacity-100 transition-opacity" />
                    <p className="text-4xl md:text-5xl font-display font-bold text-gradient">{stat.value}</p>
                  </div>
                  <p className="text-text-muted text-sm">{stat.label}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>

        {}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background-secondary to-transparent" />
      </section>

      {}
      <section className="py-24 bg-background-secondary relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-16">
            <motion.span
              className="inline-block text-primary text-sm font-semibold tracking-wider uppercase mb-4"
            >
              Nossos Diferenciais
            </motion.span>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">
              Por que escolher a <span className="text-gradient">AutoPier</span>?
            </h2>
            <p className="text-text-secondary text-lg max-w-2xl mx-auto">
              Mais do que uma concessionária, somos parceiros na sua jornada automotiva.
            </p>
          </AnimatedSection>

          <motion.div
            ref={benefitsRef}
            initial="hidden"
            animate={benefitsInView ? "visible" : "hidden"}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {diferenciais.map((item, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ duration: 0.3 }}
                className="card-static p-8 text-center group hover:border-primary/50 cursor-default"
              >
                <motion.div
                  whileHover={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.5 }}
                  className={`w-16 h-16 bg-gradient-to-br ${item.color} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-xl transition-shadow`}
                >
                  <item.icon className="w-8 h-8 text-white" />
                </motion.div>
                <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
                <p className="text-text-secondary leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {}
      <section className="py-24 relative">
        {}
        <div className="absolute inset-0 bg-gradient-to-b from-background-secondary via-background to-background" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-12">
            <motion.span
              className="inline-block text-accent text-sm font-semibold tracking-wider uppercase mb-3"
            >
              💬 Simulações de Negociação
            </motion.span>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-3">
              Veja como funciona a <span className="text-gradient">Negociação</span>
            </h2>
            <p className="text-text-secondary text-lg max-w-2xl mx-auto">
              Veja exemplos reais de como clientes negociam veículos diretamente com nossa equipe.
            </p>
          </AnimatedSection>

          <motion.div
            ref={simulationsRef}
            initial="hidden"
            animate={simulationsInView ? "visible" : "hidden"}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12"
          >
            {conversationSimulations.map((conversation, index) => (
              <motion.div
                key={conversation.id}
                variants={fadeInUp}
                whileHover={{ y: -4, scale: 1.01 }}
                transition={{ duration: 0.3 }}
                className="card-static overflow-hidden hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10"
              >
                {}
                <div className="bg-surface-dark/80 p-4 border-b border-surface-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                      <MessageCircle className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-semibold text-sm">Consultor AutoPier</p>
                      <p className="text-text-muted text-xs">Simulação de conversa</p>
                    </div>
                    <div className="px-2 py-1 bg-primary/20 text-primary text-[10px] font-semibold rounded-full border border-primary/30">
                      EXEMPLO
                    </div>
                  </div>
                </div>

                {}
                <div className="p-4 space-y-3 bg-surface-dark/40 min-h-[280px]">
                  {conversation.messages.map((message, msgIndex) => {
                    const isCliente = message.sender === 'cliente'
                    return (
                      <motion.div
                        key={msgIndex}
                        initial={{ opacity: 0, x: isCliente ? -20 : 20, y: 10 }}
                        animate={{ opacity: 1, x: 0, y: 0 }}
                        transition={{
                          delay: index * 0.2 + msgIndex * 0.15,
                          duration: 0.4,
                          ease: "easeOut"
                        }}
                        className={`flex items-end gap-2 ${isCliente ? 'justify-start' : 'justify-end'}`}
                      >
                        {isCliente && (
                          <div className="w-8 h-8 rounded-full bg-accent/30 flex items-center justify-center text-accent text-xs font-bold flex-shrink-0">
                            C
                          </div>
                        )}
                        <div className={`max-w-[75%] ${isCliente ? '' : 'flex flex-col items-end'}`}>
                          <div
                            className={`rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                              isCliente
                                ? 'rounded-bl-sm bg-surface text-white'
                                : 'rounded-br-sm bg-primary text-white'
                            }`}
                          >
                            <p className="leading-relaxed whitespace-pre-wrap break-words">
                              {message.text}
                            </p>
                          </div>
                          <p className={`text-[10px] mt-1 ${isCliente ? 'text-text-muted' : 'text-white/70'}`}>
                            {message.time}
                          </p>
                        </div>
                        {!isCliente && (
                          <div className="w-8 h-8 rounded-full bg-primary/30 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
                            A
                          </div>
                        )}
                      </motion.div>
                    )
                  })}
                </div>
              </motion.div>
            ))}
          </motion.div>

          {}
          <AnimatedSection className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={simulationsInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.6 }}
            >
              <Link
                href="/negociacao"
                className="btn-primary inline-flex items-center gap-2 text-lg px-8 py-4 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 group"
              >
                <MessageCircle className="w-5 h-5" />
                Iniciar minha negociação
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </AnimatedSection>
        </div>
      </section>

      {}
      <section className="py-24 bg-background-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-16">
            <motion.span
              className="inline-block text-primary text-sm font-semibold tracking-wider uppercase mb-4"
            >
              Processo Simples
            </motion.span>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">
              Como <span className="text-gradient">Funciona</span>
            </h2>
            <p className="text-text-secondary text-lg max-w-2xl mx-auto">
              Comprar seu veículo nunca foi tão fácil. Siga os passos abaixo.
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Escolha seu Veículo',
                description: 'Navegue pelo nosso catálogo e encontre o carro perfeito para você.',
                icon: Car
              },
              {
                step: '02',
                title: 'Entre em Contato',
                description: 'Inicie uma negociação e converse diretamente com nossa equipe.',
                icon: MessageCircle
              },
              {
                step: '03',
                title: 'Feche o Negócio',
                description: 'Finalize a compra com condições especiais e retire seu veículo.',
                icon: CheckCircle
              },
            ].map((item, index) => (
              <AnimatedSection key={index} delay={index * 0.1}>
                <motion.div
                  whileHover={{ y: -5 }}
                  className="relative p-8 rounded-2xl bg-surface/50 backdrop-blur-sm border border-surface-border hover:border-primary/30 transition-all duration-300 group"
                >
                  <div className="absolute -top-4 left-8 bg-primary text-white text-sm font-bold px-4 py-1 rounded-full">
                    {item.step}
                  </div>
                  <div className="mt-4">
                    <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                      <item.icon className="w-7 h-7 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-3">{item.title}</h3>
                    <p className="text-text-secondary leading-relaxed">{item.description}</p>
                  </div>
                </motion.div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {}
      <section className="py-24 relative overflow-hidden">
        {}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-background to-accent/20" />
        <motion.div
          animate={{
            x: ['-100%', '100%'],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
        />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimatedSection>
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-surface/80 backdrop-blur-lg border border-surface-border rounded-3xl p-12 shadow-2xl"
            >
              <Zap className="w-12 h-12 text-accent mx-auto mb-6" />
              <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">
                Quer vender seu veículo?
              </h2>
              <p className="text-xl text-text-secondary mb-8 max-w-2xl mx-auto">
                Inicie uma negociação e converse diretamente com nossos especialistas.
                Avaliação justa e pagamento rápido.
              </p>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href="/negociacao"
                  className="btn-accent inline-flex items-center gap-2 text-lg px-10 py-5 shadow-lg shadow-accent/25 hover:shadow-xl hover:shadow-accent/30 transition-all duration-300 group"
                >
                  <MessageCircle className="w-5 h-5" />
                  Iniciar Negociação
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>
            </motion.div>
          </AnimatedSection>
        </div>
      </section>
    </div>
  )
}


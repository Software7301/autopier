'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowRight,
  Car,
  ShoppingBag,
  MessageCircle,
  DollarSign,
  Calendar,
  Gauge,
  FileText,
  Upload,
  Image as ImageIcon,
  X
} from 'lucide-react'
import Image from 'next/image'
import { uploadImageToSupabase } from '@/lib/upload'

type NegotiationType = 'BUY' | 'SELL'

export default function NegociacaoPage() {
  const router = useRouter()
  const [negotiationType, setNegotiationType] = useState<NegotiationType | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

  const [sellForm, setSellForm] = useState({
    vehicleName: '',
    vehicleBrand: '',
    vehicleYear: '',
    vehicleMileage: '',
    vehicleDescription: '',
    proposedPrice: '',
    customerName: '',
    customerPhone: '',
    vehicleImageUrl: '',
  })

  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)

  const [buyForm, setBuyForm] = useState({
    vehicleInterest: '',
    customerName: '',
    customerPhone: '',
    message: '',
  })

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {

      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione apenas arquivos de imagem')
        return
      }

      if (file.size > 5 * 1024 * 1024) {
        alert('A imagem deve ter no máximo 5MB')
        return
      }

      setImageFile(file)

      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  function handleRemoveImage() {
    setImageFile(null)
    setImagePreview(null)
    setSellForm({ ...sellForm, vehicleImageUrl: '' })
  }

  function handlePriceChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value

    const numbersOnly = value.replace(/\D/g, '')

    if (!numbersOnly) {
      setSellForm({ ...sellForm, proposedPrice: '' })
      return
    }

    const numericValue = parseInt(numbersOnly, 10)

    const formatted = new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numericValue / 100)

    setSellForm({ ...sellForm, proposedPrice: formatted })
  }

  async function handleStartNegotiation(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      let imageUrl = sellForm.vehicleImageUrl

      if (imageFile) {
        setUploadingImage(true)
        try {
          imageUrl = await uploadImageToSupabase(imageFile, 'cars')
          setSellForm({ ...sellForm, vehicleImageUrl: imageUrl })
        } catch (error: any) {
          console.error('Erro ao fazer upload da imagem:', error)
          alert(`Erro ao fazer upload da imagem: ${error.message}`)
          setLoading(false)
          setUploadingImage(false)
          return
        } finally {
          setUploadingImage(false)
        }
      }

      const payload = negotiationType === 'SELL'
        ? {
            type: 'SELL',
            vehicleName: sellForm.vehicleName,
            vehicleBrand: sellForm.vehicleBrand,
            vehicleYear: parseInt(sellForm.vehicleYear),
            vehicleMileage: parseInt(sellForm.vehicleMileage),
            vehicleDescription: sellForm.vehicleDescription,
            proposedPrice: parseFloat(sellForm.proposedPrice.replace(/\./g, '').replace(',', '.')) || 0,
            customerName: sellForm.customerName,
            customerPhone: sellForm.customerPhone,
            vehicleImageUrl: imageUrl || null,
          }
        : {
            type: 'BUY',
            vehicleInterest: buyForm.vehicleInterest,
            customerName: buyForm.customerName,
            customerPhone: buyForm.customerPhone,
            message: buyForm.message,
          };

      const response = await fetch('/api/negociacao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (response.ok && data.id) {

        const phone = negotiationType === 'SELL' ? sellForm.customerPhone : buyForm.customerPhone
        localStorage.setItem('autopier_user_phone', phone.replace(/\D/g, ''))
        localStorage.setItem('autopier_user_name', negotiationType === 'SELL' ? sellForm.customerName : buyForm.customerName)

        router.push(`/negociacao/${data.id}`)
      } else {
        alert('Erro ao iniciar negociação. Tente novamente.')
      }
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao iniciar negociação. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
            <span className="text-gradient">Negociação</span> de Veículos
          </h1>
          <p className="text-text-secondary text-lg max-w-2xl mx-auto">
            Quer vender seu carro ou está interessado em um veículo?
            Inicie uma negociação e converse diretamente com nossa equipe.
          </p>
        </div>

        {}
        {!negotiationType && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {}
            <button
              onClick={() => setNegotiationType('SELL')}
              className="card p-8 text-left group"
            >
              <div className="w-16 h-16 bg-accent/20 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-accent/30 transition-colors">
                <DollarSign className="w-8 h-8 text-accent" />
              </div>
              <h2 className="text-2xl font-semibold text-white mb-3">
                Vender Veículo
              </h2>
              <p className="text-text-secondary mb-6">
                Venda seu carro para nossa concessionária. Avaliação justa e pagamento rápido.
              </p>
              <span className="inline-flex items-center gap-2 text-accent font-medium">
                Iniciar Venda
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>

            {}
            <Link
              href="/cars"
              className="card p-8 text-left group"
            >
              <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary/30 transition-colors">
                <ShoppingBag className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold text-white mb-3">
                Comprar Veículo
              </h2>
              <p className="text-text-secondary mb-6">
                Interessado em algum veículo? Negocie diretamente conosco.
              </p>
              <span className="inline-flex items-center gap-2 text-primary font-medium">
                Ver Catálogo
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
          </div>
        )}

        {}
        {negotiationType === 'SELL' && (
          <div className="card-static p-8 animate-fade-in">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Vender Veículo</h2>
                  <p className="text-text-muted text-sm">Preencha os dados do seu veículo</p>
                </div>
              </div>
              <button
                onClick={() => setNegotiationType(null)}
                className="text-text-muted hover:text-white transition-colors"
              >
                Voltar
              </button>
            </div>

            <form onSubmit={handleStartNegotiation} className="space-y-6">
              {}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    <Car className="w-4 h-4 inline mr-2" />
                    Marca *
                  </label>
                  <input
                    type="text"
                    value={sellForm.vehicleBrand}
                    onChange={(e) => setSellForm({ ...sellForm, vehicleBrand: e.target.value })}
                    required
                    placeholder="Ex: Toyota, Honda, BMW..."
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    <Car className="w-4 h-4 inline mr-2" />
                    Modelo *
                  </label>
                  <input
                    type="text"
                    value={sellForm.vehicleName}
                    onChange={(e) => setSellForm({ ...sellForm, vehicleName: e.target.value })}
                    required
                    placeholder="Ex: Corolla, Civic, X5..."
                    className="input-field"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Ano *
                  </label>
                  <input
                    type="number"
                    value={sellForm.vehicleYear}
                    onChange={(e) => setSellForm({ ...sellForm, vehicleYear: e.target.value })}
                    required
                    placeholder="Ex: 2020"
                    min="1990"
                    max={new Date().getFullYear() + 1}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    <Gauge className="w-4 h-4 inline mr-2" />
                    Quilometragem *
                  </label>
                  <input
                    type="number"
                    value={sellForm.vehicleMileage}
                    onChange={(e) => setSellForm({ ...sellForm, vehicleMileage: e.target.value })}
                    required
                    placeholder="Ex: 50000"
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  <DollarSign className="w-4 h-4 inline mr-2" />
                  Valor Pretendido *
                </label>
                <input
                  type="text"
                  value={sellForm.proposedPrice}
                  onChange={handlePriceChange}
                  required
                  placeholder="R$ 50.000,00"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  <FileText className="w-4 h-4 inline mr-2" />
                  Descrição do Veículo
                </label>
                <textarea
                  value={sellForm.vehicleDescription}
                  onChange={(e) => setSellForm({ ...sellForm, vehicleDescription: e.target.value })}
                  placeholder="Descreva o estado do veículo, acessórios, revisões..."
                  rows={4}
                  className="input-field resize-none"
                />
              </div>

              {}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  <ImageIcon className="w-4 h-4 inline mr-2" />
                  Foto do Veículo
                </label>
                {!imagePreview ? (
                  <div className="relative">
                    <input
                      type="file"
                      accept="image}
              <div className="border-t border-surface-border pt-6">
                <h3 className="text-lg font-medium text-white mb-4">Seus Dados</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      value={sellForm.customerName}
                      onChange={(e) => setSellForm({ ...sellForm, customerName: e.target.value })}
                      required
                      placeholder="Seu nome"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Telefone *
                    </label>
                    <input
                      type="tel"
                      value={sellForm.customerPhone}
                      onChange={(e) => setSellForm({ ...sellForm, customerPhone: e.target.value })}
                      required
                      placeholder="(00) 00000-0000"
                      className="input-field"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || uploadingImage}
                className="btn-accent w-full flex items-center justify-center gap-2 text-lg py-4"
              >
                {uploadingImage ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Enviando imagem...
                  </>
                ) : loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Iniciando...
                  </>
                ) : (
                  <>
                    <MessageCircle className="w-5 h-5" />
                    Iniciar Negociação
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {}
        {negotiationType === 'BUY' && (
          <div className="card-static p-8 animate-fade-in">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Comprar Veículo</h2>
                  <p className="text-text-muted text-sm">Conte-nos qual veículo você procura</p>
                </div>
              </div>
              <button
                onClick={() => setNegotiationType(null)}
                className="text-text-muted hover:text-white transition-colors"
              >
                Voltar
              </button>
            </div>

            <form onSubmit={handleStartNegotiation} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  <Car className="w-4 h-4 inline mr-2" />
                  Veículo de Interesse *
                </label>
                <input
                  type="text"
                  value={buyForm.vehicleInterest}
                  onChange={(e) => setBuyForm({ ...buyForm, vehicleInterest: e.target.value })}
                  required
                  placeholder="Ex: Toyota Corolla 2023, SUV até R$ 150.000..."
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  <MessageCircle className="w-4 h-4 inline mr-2" />
                  Mensagem
                </label>
                <textarea
                  value={buyForm.message}
                  onChange={(e) => setBuyForm({ ...buyForm, message: e.target.value })}
                  placeholder="Descreva suas preferências, dúvidas ou condições desejadas..."
                  rows={4}
                  className="input-field resize-none"
                />
              </div>

              {}
              <div className="border-t border-surface-border pt-6">
                <h3 className="text-lg font-medium text-white mb-4">Seus Dados</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      value={buyForm.customerName}
                      onChange={(e) => setBuyForm({ ...buyForm, customerName: e.target.value })}
                      required
                      placeholder="Seu nome"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Telefone *
                    </label>
                    <input
                      type="tel"
                      value={buyForm.customerPhone}
                      onChange={(e) => setBuyForm({ ...buyForm, customerPhone: e.target.value })}
                      required
                      placeholder="(00) 00000-0000"
                      className="input-field"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 text-lg py-4"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Iniciando...
                  </>
                ) : (
                  <>
                    <MessageCircle className="w-5 h-5" />
                    Iniciar Negociação
                  </>
                )}
              </button>
            </form>

            {}
            <div className="mt-6 text-center">
              <p className="text-text-muted text-sm">
                Já sabe qual veículo quer?{' '}
                <Link href="/cars" className="text-primary hover:underline">
                  Veja nosso catálogo
                </Link>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


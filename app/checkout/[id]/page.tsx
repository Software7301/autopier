'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowLeft,
  CreditCard,
  Wallet,
  Banknote,
  CheckCircle,
  Car,
  AlertCircle,
  Paintbrush
} from 'lucide-react'
import { setUserName } from '@/lib/userName'

interface CarData {
  id: string
  name: string
  price: number
  imageUrl: string
}

const colorOptions = [
  { name: 'Preto', hex: '#1a1a1a', border: '#333' },
  { name: 'Branco', hex: '#f5f5f5', border: '#ccc' },
  { name: 'Prata', hex: '#c0c0c0', border: '#999' },
  { name: 'Cinza', hex: '#6b7280', border: '#4b5563' },
  { name: 'Azul', hex: '#2563eb', border: '#1d4ed8' },
  { name: 'Vermelho', hex: '#dc2626', border: '#b91c1c' },
]

const paymentMethods = [
  { value: 'PIX', label: 'Pix', icon: Wallet, description: 'Pagamento instantâneo' },
  { value: 'DINHEIRO', label: 'Dinheiro', icon: Banknote, description: 'Pagamento em espécie' },
  { value: 'CARTAO_CREDITO', label: 'Cartão de Crédito', icon: CreditCard, description: 'Em até 12x' },
]

const installmentOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

function formatPrice(price: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price)
}

export default function CheckoutPage() {
  const params = useParams()
  const router = useRouter()
  const carId = params.id as string
  const [car, setCar] = useState<CarData | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [orderId, setOrderId] = useState<string | null>(null)

  const [selectedColor, setSelectedColor] = useState<string>('Preto')

  const [formData, setFormData] = useState({
    customerName: '',
    customerRg: '',
    customerPhone: '',
    paymentMethod: 'PIX',
    installments: 1,
  })

  const [errors, setErrors] = useState({
    customerName: '',
    customerRg: '',
    customerPhone: '',
  })

  useEffect(() => {
    async function fetchCar() {
      try {
        const response = await fetch(`/api/cars/${carId}`)
        const data = await response.json()
        setCar({
          id: data.id,
          name: data.name,
          price: data.price,
          imageUrl: data.imageUrl,
        })
      } catch (error) {
        console.error('Erro ao buscar carro:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchCar()
  }, [carId])

  function validateRg(rg: string): boolean {
    const rgNumbers = rg.replace(/\D/g, '')
    return /^\d{6}$/.test(rgNumbers)
  }

  function validatePhone(phone: string): boolean {
    const phoneNumbers = phone.replace(/\D/g, '')
    return phoneNumbers.length >= 6
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target

    if (name === 'customerRg') {
      const numbersOnly = value.replace(/\D/g, '').slice(0, 6)
      setFormData((prev) => ({ ...prev, [name]: numbersOnly }))

      if (errors.customerRg) {
        setErrors((prev) => ({ ...prev, customerRg: '' }))
      }
      return
    }

    if (name === 'customerPhone') {
      const numbersOnly = value.replace(/\D/g, '')
      setFormData((prev) => ({ ...prev, [name]: numbersOnly }))

      if (errors.customerPhone) {
        setErrors((prev) => ({ ...prev, customerPhone: '' }))
      }
      return
    }

    if (name === 'installments') {
      setFormData((prev) => ({ ...prev, [name]: parseInt(value) }))
      return
    }

    setFormData((prev) => ({ ...prev, [name]: value }))

    if (name === 'customerName' && errors.customerName) {
      setErrors((prev) => ({ ...prev, customerName: '' }))
    }
  }

  function handleColorSelect(colorName: string) {
    setSelectedColor(colorName)
  }

  function getInstallmentValue(): number {
    if (!car) return 0
    return car.price / formData.installments
  }

  function getSelectedColorData() {
    return colorOptions.find(c => c.name === selectedColor) || colorOptions[0]
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!car) return

    let hasError = false
    const newErrors = { customerName: '', customerRg: '', customerPhone: '' }

    if (!formData.customerName.trim()) {
      newErrors.customerName = 'Nome completo é obrigatório'
      hasError = true
    }

    if (!validateRg(formData.customerRg)) {
      newErrors.customerRg = 'RG inválido. O RG deve ter exatamente 6 dígitos.'
      hasError = true
    }

    if (!validatePhone(formData.customerPhone)) {
      newErrors.customerPhone = 'Número de telefone inválido. Mínimo 6 dígitos.'
      hasError = true
    }

    if (hasError) {
      setErrors(newErrors)
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          carId: car.id,
          customerName: formData.customerName.trim(),
          customerRg: formData.customerRg,
          customerPhone: formData.customerPhone,
          paymentMethod: formData.paymentMethod,
          installments: formData.paymentMethod === 'CARTAO_CREDITO' ? formData.installments : 1,
          totalPrice: car.price,
          selectedColor: selectedColor,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        const customerName = formData.customerName.trim()

        setUserName(customerName)

        setOrderId(result.orderId)
        setSuccess(true)
      } else {

        if (result.errors) {
          const backendErrors = { customerName: '', customerRg: '', customerPhone: '' }
          if (result.errors.rg) backendErrors.customerRg = result.errors.rg
          if (result.errors.phone) backendErrors.customerPhone = result.errors.phone
          setErrors(backendErrors)
        } else {
          alert(result.error || 'Erro ao processar pedido. Tente novamente.')
        }
      }
    } catch (error) {
      console.error('Erro no checkout:', error)
      alert('Erro ao processar pedido. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="spinner mx-auto" />
          <p className="text-text-secondary">Carregando...</p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12">
        <div className="max-w-md mx-auto px-4 text-center">
          <div className="card-static p-8 space-y-6">
            <div className="w-20 h-20 bg-accent/20 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-accent" />
            </div>
            <h1 className="text-3xl font-display font-bold text-white">
              Pedido Realizado!
            </h1>
            <p className="text-text-secondary">
              Seu pedido foi enviado com sucesso. Em breve nossa equipe entrará em contato para finalizar a compra.
            </p>
            <div className="pt-4 space-y-3">
              <Link href="/cliente/pedidos" className="btn-secondary w-full block text-center">
                Meus Pedidos
              </Link>
              <Link href="/" className="btn-secondary w-full block text-center">
                Voltar ao Início
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!car) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Car className="w-16 h-16 text-text-muted mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Veículo não encontrado</h1>
          <Link href="/cars" className="btn-primary mt-4 inline-block">
            Ver Catálogo
          </Link>
        </div>
      </div>
    )
  }

  const selectedColorData = getSelectedColorData()

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {}
        <div className="mb-8">
          <Link
            href="/cars"
            className="inline-flex items-center gap-2 text-text-secondary hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao catálogo
          </Link>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-white">
            Finalizar <span className="text-gradient">Compra</span>
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {}
          <div className="lg:col-span-7 space-y-6">
            <form onSubmit={handleSubmit} className="card-static p-6 space-y-6">
              <h2 className="text-xl font-semibold text-white">Dados do Comprador</h2>

              {}
              <div>
                <label htmlFor="customerName" className="block text-sm font-medium text-text-secondary mb-2">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  id="customerName"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleInputChange}
                  placeholder="Digite seu nome completo conforme RG"
                  className={`input-field ${errors.customerName ? 'border-red-500' : ''}`}
                />
                {errors.customerName && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.customerName}
                  </p>
                )}
              </div>

              {}
              <div>
                <label htmlFor="customerRg" className="block text-sm font-medium text-text-secondary mb-2">
                  RG (apenas números) *
                </label>
                <input
                  type="text"
                  id="customerRg"
                  name="customerRg"
                  value={formData.customerRg}
                  onChange={handleInputChange}
                  placeholder="Digite 6 dígitos"
                  maxLength={6}
                  className={`input-field ${errors.customerRg ? 'border-red-500' : ''}`}
                />
                {errors.customerRg && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.customerRg}
                  </p>
                )}
                <p className="text-text-muted text-xs mt-1">
                  Exemplo: 123456
                </p>
              </div>

              {}
              <div>
                <label htmlFor="customerPhone" className="block text-sm font-medium text-text-secondary mb-2">
                  Telefone (apenas números) *
                </label>
                <input
                  type="tel"
                  id="customerPhone"
                  name="customerPhone"
                  value={formData.customerPhone}
                  onChange={handleInputChange}
                  placeholder="Ex: 000-000"
                  className={`input-field ${errors.customerPhone ? 'border-red-500' : ''}`}
                />
                {errors.customerPhone && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.customerPhone}
                  </p>
                )}
                <p className="text-text-muted text-xs mt-1">
                  Mínimo 6 dígitos
                </p>
              </div>

              {}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-4">
                  Forma de Pagamento *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {paymentMethods.map((method) => (
                    <button
                      key={method.value}
                      type="button"
                      onClick={() => setFormData((prev) => ({
                        ...prev,
                        paymentMethod: method.value,
                        installments: method.value === 'CARTAO_CREDITO' ? prev.installments : 1
                      }))}
                      className={`p-4 rounded-xl border-2 transition-all duration-300 text-left ${
                        formData.paymentMethod === method.value
                          ? 'border-primary bg-primary/10'
                          : 'border-surface-border hover:border-primary/50 bg-surface'
                      }`}
                    >
                      <method.icon className={`w-6 h-6 mb-2 ${
                        formData.paymentMethod === method.value ? 'text-primary' : 'text-text-muted'
                      }`} />
                      <p className="font-medium text-white">{method.label}</p>
                      <p className="text-xs text-text-muted">{method.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {}
              {formData.paymentMethod === 'CARTAO_CREDITO' && (
                <div>
                  <label htmlFor="installments" className="block text-sm font-medium text-text-secondary mb-2">
                    Parcelamento *
                  </label>
                  <select
                    id="installments"
                    name="installments"
                    value={formData.installments}
                    onChange={handleInputChange}
                    className="input-field"
                  >
                    {installmentOptions.map((num) => (
                      <option key={num} value={num}>
                        {num}x de {formatPrice(car.price / num)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {}
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full flex items-center justify-center gap-2 text-lg py-4"
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Confirmar Pedido
                  </>
                )}
              </button>
            </form>
          </div>

          {}
          <div className="lg:col-span-5 space-y-6">
            {}
            <div className="card-static overflow-hidden">
              <div className="relative h-64">
                <Image
                  src={car.imageUrl}
                  alt={car.name}
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            {}
            <div className="card-static p-5">
              {}
              <div className="flex items-center gap-2 mb-5">
                <Paintbrush className="w-5 h-5 text-primary" />
                <span className="text-base font-medium text-white">Escolha a cor do veículo</span>
              </div>

              {}
              <div className="grid grid-cols-3 gap-4">
                {colorOptions.map((color) => (
                  <button
                    key={color.name}
                    type="button"
                    onClick={() => handleColorSelect(color.name)}
                    className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 ${
                      selectedColor === color.name
                        ? 'border-primary bg-primary/10'
                        : 'border-surface-border hover:border-primary/50 bg-surface'
                    }`}
                  >
                    <div
                      className={`w-14 h-14 rounded-full border-2 shadow-md transition-all duration-200 ${
                        selectedColor === color.name ? 'scale-110 ring-2 ring-primary ring-offset-2 ring-offset-surface-dark' : ''
                      }`}
                      style={{
                        backgroundColor: color.hex,
                        borderColor: color.border
                      }}
                    />
                    <span className={`text-sm font-medium ${
                      selectedColor === color.name ? 'text-primary' : 'text-text-secondary'
                    }`}>
                      {color.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {}
            <div className="card-static p-6 space-y-5">
              <h3 className="text-xl font-semibold text-white">Resumo do Pedido</h3>

              <div className="space-y-4 pb-5 border-b border-surface-border">
                <div className="flex justify-between text-text-secondary text-base">
                  <span>Veículo</span>
                  <span className="text-white font-medium">{car.name}</span>
                </div>
                <div className="flex justify-between text-text-secondary text-base">
                  <span>Cor</span>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-5 h-5 rounded-full border-2"
                      style={{
                        backgroundColor: selectedColorData.hex,
                        borderColor: selectedColorData.border
                      }}
                    />
                    <span className="text-white">{selectedColor}</span>
                  </div>
                </div>
                <div className="flex justify-between text-text-secondary text-base">
                  <span>Pagamento</span>
                  <span className="text-white">
                    {paymentMethods.find((m) => m.value === formData.paymentMethod)?.label}
                  </span>
                </div>
                {formData.paymentMethod === 'CARTAO_CREDITO' && (
                  <div className="flex justify-between text-text-secondary text-base">
                    <span>Parcelas</span>
                    <span className="text-white">{formData.installments}x</span>
                  </div>
                )}
              </div>

              {}
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-medium text-white">Total</span>
                  <span className="text-3xl font-display font-bold text-gradient">
                    {formatPrice(car.price)}
                  </span>
                </div>
                {formData.paymentMethod === 'CARTAO_CREDITO' && formData.installments > 1 && (
                  <div className="text-right text-text-secondary text-base">
                    {formData.installments}x de {formatPrice(getInstallmentValue())}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

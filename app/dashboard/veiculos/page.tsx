'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, Edit, Trash2, X, Car, CheckCircle2, AlertCircle, Upload, Image as ImageIcon } from 'lucide-react'

interface Car {
  id: string
  name: string
  brand: string
  model: string
  year: number
  price: number
  category: string
  imageUrl: string
  mileage: number | null
  description: string | null
  color: string | null
  fuel: string
  transmission: string
  available: boolean
  featured: boolean
  createdAt: string
}

export default function VeiculosPage() {
  const [cars, setCars] = useState<Car[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCar, setEditingCar] = useState<Car | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    price: '',
    category: 'SUV',
    imageUrl: '',
    mileage: '',
    description: '',
    color: '',
    fuel: 'FLEX',
    transmission: 'AUTOMATIC',
    available: true,
  })
  const [submitting, setSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imagePreview, setImagePreview] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Formatar valor para exibição (com pontos e vírgula)
  function formatCurrency(value: string | number): string {
    if (!value && value !== 0) return ''
    
    // Remove tudo que não é número
    const numbers = value.toString().replace(/\D/g, '')
    
    if (!numbers) return ''
    
    // Converte para número (centavos) e formata
    const num = parseFloat(numbers) / 100
    
    // Formata com pontos para milhares e vírgula para decimais
    return num.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  // Converter valor formatado para número (para enviar ao backend)
  function parseCurrency(value: string): number {
    if (!value) return 0
    // Remove pontos e substitui vírgula por ponto
    const cleaned = value.replace(/\./g, '').replace(',', '.')
    const parsed = parseFloat(cleaned)
    return isNaN(parsed) ? 0 : parsed
  }

  // Buscar veículos
  useEffect(() => {
    fetchCars()
  }, [])

  async function fetchCars() {
    try {
      const response = await fetch('/api/cars?available=false') // Buscar todos, incluindo vendidos
      
      if (!response.ok) {
        throw new Error('Erro ao buscar veículos')
      }
      
      const data = await response.json()
      
      // Garantir que sempre seja um array
      if (Array.isArray(data)) {
        setCars(data)
      } else {
        console.error('Resposta da API não é um array:', data)
        setCars([])
        setErrorMessage('Erro ao carregar veículos. Verifique a configuração do banco de dados.')
      }
    } catch (error) {
      console.error('Erro ao buscar veículos:', error)
      setCars([]) // Garantir que seja um array vazio em caso de erro
      setErrorMessage('Erro ao carregar veículos. Verifique se o banco de dados está configurado.')
    } finally {
      setLoading(false)
    }
  }

  // Upload de imagem
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo
    if (!file.type.match(/^image\/(png|jpeg|jpg)$/)) {
      setErrorMessage('Formato não suportado. Use PNG ou JPG.')
      return
    }

    // Validar tamanho (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Arquivo muito grande. Tamanho máximo: 5MB')
      return
    }

    setUploadingImage(true)
    setErrorMessage('')

    try {
      // Criar FormData
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)

      // Fazer upload
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao fazer upload')
      }

      const data = await response.json()
      
      // Atualizar URL da imagem e preview
      setFormData((prev) => ({ ...prev, imageUrl: data.url }))
      setImagePreview(data.url)
      setSuccessMessage('Imagem enviada com sucesso!')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error: any) {
      setErrorMessage(error.message || 'Erro ao fazer upload da imagem')
    } finally {
      setUploadingImage(false)
    }
  }

  // Abrir modal para adicionar
  function handleAdd() {
    setEditingCar(null)
    setFormData({
      name: '',
      brand: '',
      model: '',
      year: new Date().getFullYear(),
      price: '',
      category: 'SUV',
      imageUrl: '',
      mileage: '',
      description: '',
      color: '',
      fuel: 'FLEX',
      transmission: 'AUTOMATIC',
      available: true,
    })
    setImagePreview('')
    setShowModal(true)
    setSuccessMessage('')
    setErrorMessage('')
  }

  // Abrir modal para editar
  function handleEdit(car: Car) {
    setEditingCar(car)
    setFormData({
      name: car.name,
      brand: car.brand,
      model: car.model,
      year: car.year,
      price: formatCurrency(car.price), // Formatar para exibição
      category: car.category,
      imageUrl: car.imageUrl,
      mileage: car.mileage?.toString() || '',
      description: car.description || '',
      color: car.color || '',
      fuel: car.fuel,
      transmission: car.transmission,
      available: car.available,
    })
    setImagePreview(car.imageUrl)
    setShowModal(true)
    setSuccessMessage('')
    setErrorMessage('')
  }

  // Salvar veículo
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    e.stopPropagation()

    setSubmitting(true)
    setSuccessMessage('')
    setErrorMessage('')

    // Validar imagem (única validação obrigatória aqui;
    // os demais campos já têm "required" no HTML e o backend
    // também valida)
    if (!formData.imageUrl || !formData.imageUrl.trim()) {
      setErrorMessage('Por favor, selecione ou informe uma imagem para o veículo.')
      setSubmitting(false)
      return
    }

    try {
      const url = editingCar ? `/api/cars/${editingCar.id}` : '/api/cars'
      const method = editingCar ? 'PUT' : 'POST'

      // Garantir que todos os valores estão corretos
      const payload = {
        name: String(formData.name || ''),
        brand: String(formData.brand || ''),
        model: String(formData.model || ''),
        year: formData.year ? Number(formData.year) : new Date().getFullYear(),
        price: parseCurrency(formData.price || '0'), // Converter valor formatado para número
        category: String(formData.category || 'SUV'),
        imageUrl: String(formData.imageUrl || ''),
        mileage: formData.mileage ? Number(formData.mileage) : null,
        description: formData.description ? String(formData.description) : null,
        color: formData.color ? String(formData.color) : null,
        fuel: String(formData.fuel || 'FLEX'),
        transmission: String(formData.transmission || 'AUTOMATIC'),
        available: formData.available !== false, // Garantir que seja boolean
      }

      console.log('Enviando dados do veículo:', payload)
      console.log('URL:', url, 'Method:', method)

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      console.log('Response status:', response.status, response.statusText)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao salvar veículo')
      }

      const savedCar = await response.json()
      console.log('Veículo salvo:', savedCar)

      setSuccessMessage(editingCar ? 'Veículo atualizado com sucesso!' : 'Veículo adicionado com sucesso!')
      setShowModal(false)
      
      // Recarregar lista de veículos
      await fetchCars()
      
      // Se não estiver editando, limpar formulário
      if (!editingCar) {
        setFormData({
          name: '',
          brand: '',
          model: '',
          year: new Date().getFullYear(),
          price: '',
          category: 'SUV',
          imageUrl: '',
          mileage: '',
          description: '',
          color: '',
          fuel: 'FLEX',
          transmission: 'AUTOMATIC',
          available: true,
        })
        setImagePreview('')
      }

      // Limpar mensagem após 3 segundos
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error: any) {
      console.error('Erro ao salvar veículo:', error)
      const errorMessage = error.message || 'Erro ao salvar veículo'
      
      // Mensagem mais específica para erro de banco de dados
      if (errorMessage.includes('DATABASE_URL') || errorMessage.includes('Banco de dados não configurado')) {
        setErrorMessage('⚠️ Banco de dados não configurado. Configure a variável DATABASE_URL no arquivo .env para salvar veículos.')
      } else {
        setErrorMessage(errorMessage)
      }
    } finally {
      setSubmitting(false)
    }
  }

  // Deletar veículo
  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir este veículo?')) return

    try {
      const response = await fetch(`/api/cars/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Erro ao excluir veículo')
      }

      setSuccessMessage('Veículo excluído com sucesso!')
      fetchCars()
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error) {
      setErrorMessage('Erro ao excluir veículo')
    }
  }

  // Formatar preço
  function formatPrice(price: number) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price)
  }

  // Formatar data
  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-text-secondary">Carregando veículos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Gerenciar Veículos</h1>
          <p className="text-text-secondary">Cadastre e gerencie o catálogo de veículos</p>
        </div>
        <button onClick={handleAdd} className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Adicionar Veículo
        </button>
      </div>

      {/* Mensagens */}
      {successMessage && (
        <div className="card-static p-4 bg-green-500/10 border-green-500/30 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-400" />
          <p className="text-green-400">{successMessage}</p>
        </div>
      )}

      {errorMessage && (
        <div className="card-static p-4 bg-red-500/10 border-red-500/30 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <p className="text-red-400">{errorMessage}</p>
        </div>
      )}

      {/* Lista de Veículos */}
      {cars.length === 0 ? (
        <div className="card-static text-center py-16">
          <Car className="w-16 h-16 text-text-muted mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            Nenhum veículo cadastrado
          </h3>
          <p className="text-text-secondary mb-6">
            Comece adicionando o primeiro veículo ao catálogo.
          </p>
          <button onClick={handleAdd} className="btn-primary">
            Adicionar Primeiro Veículo
          </button>
        </div>
      ) : (
        <div className="card-static overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-border">
                  <th className="text-left text-text-muted text-sm font-medium py-3 px-4">Veículo</th>
                  <th className="text-left text-text-muted text-sm font-medium py-3 px-4">Categoria</th>
                  <th className="text-left text-text-muted text-sm font-medium py-3 px-4">Quilometragem</th>
                  <th className="text-left text-text-muted text-sm font-medium py-3 px-4">Valor</th>
                  <th className="text-left text-text-muted text-sm font-medium py-3 px-4">Status</th>
                  <th className="text-left text-text-muted text-sm font-medium py-3 px-4">Data</th>
                  <th className="text-right text-text-muted text-sm font-medium py-3 px-4">Ações</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(cars) && cars.map((car) => (
                  <tr key={car.id} className="border-b border-surface-border hover:bg-surface/50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-surface">
                          <img
                            src={car.imageUrl}
                            alt={car.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="text-white font-medium">{car.name}</p>
                          <p className="text-text-muted text-sm">{car.brand} {car.model} • {car.year}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-2 py-1 bg-primary/20 text-primary rounded-md text-sm">
                        {car.category}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-text-secondary">
                      {car.mileage ? `${car.mileage.toLocaleString('pt-BR')} km` : '0 km'}
                    </td>
                    <td className="py-4 px-4 text-white font-semibold">
                      {formatPrice(car.price)}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 rounded-md text-sm ${
                        car.available
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {car.available ? 'Disponível' : 'Vendido'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-text-secondary text-sm">
                      {formatDate(car.createdAt)}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(car)}
                          className="p-2 hover:bg-surface rounded-lg transition-colors text-text-secondary hover:text-white"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(car.id)}
                          className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-text-secondary hover:text-red-400"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Adicionar/Editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background-secondary rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-background-secondary border-b border-surface-border p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">
                {editingCar ? 'Editar Veículo' : 'Adicionar Veículo'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-surface rounded-lg transition-colors text-text-secondary hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6" noValidate>
              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Nome do Veículo <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value || '' })}
                  placeholder="Ex: BMW X5 M Sport"
                  className="input-field w-full"
                />
              </div>

              {/* Marca e Modelo */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Marca <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.brand || ''}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value || '' })}
                    placeholder="Ex: BMW"
                    className="input-field w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Modelo <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.model || ''}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value || '' })}
                    placeholder="Ex: X5"
                    className="input-field w-full"
                  />
                </div>
              </div>

              {/* Ano, Categoria e Valor */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Ano <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1900"
                    max={new Date().getFullYear() + 1}
                    value={formData.year || ''}
                    onChange={(e) => {
                      const value = e.target.value ? parseInt(e.target.value) : new Date().getFullYear()
                      setFormData({ ...formData, year: isNaN(value) ? new Date().getFullYear() : value })
                    }}
                    className="input-field w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Categoria <span className="text-red-400">*</span>
                  </label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="input-field w-full"
                  >
                    <option value="SUV">SUV</option>
                    <option value="SEDAN">Sedan</option>
                    <option value="COMPACTO">Compacto</option>
                    <option value="ESPORTIVO">Esportivo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Valor (R$) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.price || ''}
                    onChange={(e) => {
                      // Permite apenas números e formata automaticamente
                      const formatted = formatCurrency(e.target.value)
                      setFormData({ ...formData, price: formatted || '' })
                    }}
                    onBlur={(e) => {
                      // Garante formatação completa ao sair do campo
                      if (e.target.value) {
                        const formatted = formatCurrency(e.target.value)
                        setFormData({ ...formData, price: formatted || '' })
                      }
                    }}
                    placeholder="0,00"
                    className="input-field w-full"
                  />
                </div>
              </div>

              {/* Quilometragem e URL da Imagem */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Quilometragem (km)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.mileage || ''}
                    onChange={(e) => setFormData({ ...formData, mileage: e.target.value || '' })}
                    placeholder="0"
                    className="input-field w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Status
                  </label>
                  <select
                    value={formData.available ? 'true' : 'false'}
                    onChange={(e) => setFormData({ ...formData, available: e.target.value === 'true' })}
                    className="input-field w-full"
                  >
                    <option value="true">Disponível</option>
                    <option value="false">Vendido</option>
                  </select>
                </div>
              </div>

              {/* Upload de Imagem */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Imagem do Veículo <span className="text-red-400">*</span>
                </label>
                
                {/* Preview da imagem */}
                {(imagePreview || formData.imageUrl) && (
                  <div className="mb-4">
                    <img
                      src={imagePreview || formData.imageUrl}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg border border-surface-border"
                      onError={() => {
                        setImagePreview('')
                        setFormData({ ...formData, imageUrl: '' })
                      }}
                    />
                  </div>
                )}

                {/* Input de arquivo */}
                <div className="relative">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                    tabIndex={-1}
                    aria-hidden="true"
                  />
                  <label
                    htmlFor="image-upload"
                    className={`
                      flex items-center justify-center gap-2
                      w-full p-4 rounded-lg border-2 border-dashed
                      cursor-pointer transition-all duration-200
                      ${uploadingImage
                        ? 'border-primary/50 bg-primary/10 cursor-wait'
                        : 'border-surface-border hover:border-primary/50 hover:bg-surface/50'
                      }
                    `}
                  >
                    {uploadingImage ? (
                      <>
                        <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                        <span className="text-text-secondary">Enviando imagem...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 text-text-muted" />
                        <span className="text-text-secondary">
                          {imagePreview || formData.imageUrl
                            ? 'Trocar imagem'
                            : 'Selecionar imagem (PNG ou JPG)'
                          }
                        </span>
                      </>
                    )}
                  </label>
                </div>

                {/* URL alternativa (opcional) */}
                <div className="mt-3">
                  <details className="text-sm">
                    <summary className="text-text-muted cursor-pointer hover:text-white transition-colors">
                      Ou cole uma URL da imagem
                    </summary>
                    <input
                      type="url"
                      value={formData.imageUrl || ''}
                      onChange={(e) => {
                        setFormData({ ...formData, imageUrl: e.target.value || '' })
                        setImagePreview(e.target.value || '')
                      }}
                      placeholder="https://exemplo.com/imagem.jpg"
                      className="input-field w-full mt-2"
                    />
                  </details>
                </div>
              </div>

              {/* Combustível e Transmissão */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Combustível
                  </label>
                  <select
                    value={formData.fuel}
                    onChange={(e) => setFormData({ ...formData, fuel: e.target.value })}
                    className="input-field w-full"
                  >
                    <option value="FLEX">Flex</option>
                    <option value="GASOLINA">Gasolina</option>
                    <option value="DIESEL">Diesel</option>
                    <option value="ELETRICO">Elétrico</option>
                    <option value="HIBRIDO">Híbrido</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Transmissão
                  </label>
                  <select
                    value={formData.transmission}
                    onChange={(e) => setFormData({ ...formData, transmission: e.target.value })}
                    className="input-field w-full"
                  >
                    <option value="AUTOMATIC">Automática</option>
                    <option value="MANUAL">Manual</option>
                  </select>
                </div>
              </div>

              {/* Descrição e Cor */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Cor
                  </label>
                  <input
                    type="text"
                    value={formData.color || ''}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value || '' })}
                    placeholder="Ex: Branco"
                    className="input-field w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Descrição
                  </label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value || '' })}
                    placeholder="Descrição do veículo..."
                    rows={3}
                    className="input-field w-full resize-none"
                  />
                </div>
              </div>

              {/* Botões */}
              <div className="flex items-center justify-end gap-4 pt-4 border-t border-surface-border">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary"
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Salvando...' : editingCar ? 'Atualizar' : 'Adicionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}


'use client'

import { useState, useEffect } from 'react'
import { Search, SlidersHorizontal, Car, RefreshCw } from 'lucide-react'
import CarCard from '@/components/CarCard'
import FilterPills from '@/components/FilterPills'
import { CarCardSkeleton } from '@/components/Loading'

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
  fuel: string
  transmission: string
  featured: boolean
  available?: boolean
}

const categoryFilters = [
  { value: 'TODOS', label: 'Todos' },
  { value: 'SUV', label: 'SUV' },
  { value: 'SEDAN', label: 'Sedan' },
  { value: 'COMPACTO', label: 'Compacto' },
  { value: 'ESPORTIVO', label: 'Esportivo' },
]

export default function CarsPage() {
  const [cars, setCars] = useState<Car[]>([])
  const [filteredCars, setFilteredCars] = useState<Car[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('TODOS')
  const [searchTerm, setSearchTerm] = useState('')

  async function fetchCars() {
    try {
      setLoading(true)
      // Buscar apenas veículos disponíveis (não desativados)
      const response = await fetch('/api/cars', { cache: 'no-store' })
      const data = await response.json()
      
      console.log('Carros carregados com status:', data.map((car: any) => ({
        id: car.id,
        name: car.name,
        available: car.available
      })))

      const safeData = Array.isArray(data) ? data : []

      console.log('Carros carregados:', safeData.length, safeData)
      setCars(safeData)
      setFilteredCars(safeData)
    } catch (error) {
      console.error('Erro ao buscar carros:', error)
      setCars([])
      setFilteredCars([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCars()
  }, [])

  useEffect(() => {
    const safeCars = Array.isArray(cars) ? cars : []
    let result = safeCars

    if (selectedCategory !== 'TODOS') {
      result = result.filter((car) => car.category === selectedCategory)
    }

    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      result = result.filter(
        (car) =>
          car.name.toLowerCase().includes(search) ||
          car.brand.toLowerCase().includes(search) ||
          car.model.toLowerCase().includes(search)
      )
    }

    setFilteredCars(result)
  }, [cars, selectedCategory, searchTerm])

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
            Catálogo de <span className="text-gradient">Veículos</span>
          </h1>
          <p className="text-text-secondary text-lg max-w-2xl mx-auto">
            Explore nossa seleção premium de veículos e encontre o carro ideal para você.
          </p>
        </div>

        {}
        <div className="card-static p-6 mb-8 space-y-6">
          {}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
            <input
              type="text"
              placeholder="Buscar por marca, modelo ou nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-12"
            />
          </div>

          {}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-2 text-text-secondary">
              <SlidersHorizontal className="w-5 h-5" />
              <span className="font-medium">Categorias:</span>
            </div>
            <FilterPills
              options={categoryFilters}
              selected={selectedCategory}
              onChange={setSelectedCategory}
            />
          </div>
        </div>

        {}
        <div className="flex items-center justify-between mb-6">
          <p className="text-text-secondary">
            <span className="text-white font-semibold">{filteredCars.length}</span> veículo(s) encontrado(s)
          </p>
          <button
            onClick={fetchCars}
            disabled={loading}
            className="btn-secondary flex items-center gap-2"
            title="Atualizar catálogo"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>

        {}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <CarCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredCars.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCars.map((car, index) => (
              <div
                key={car.id}
                className="animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CarCard car={car} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 card-static">
            <Car className="w-16 h-16 text-text-muted mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              Nenhum veículo disponível nesta categoria.
            </h3>
            <p className="text-text-secondary mb-6">
              {selectedCategory === 'TODOS'
                ? 'O catálogo está vazio. Veículos serão adicionados em breve.'
                : `Não há veículos na categoria ${categoryFilters.find(c => c.value === selectedCategory)?.label || selectedCategory}.`
              }
            </p>
            {selectedCategory !== 'TODOS' && (
              <button
                onClick={() => {
                  setSelectedCategory('TODOS')
                  setSearchTerm('')
                }}
                className="btn-secondary"
              >
                Ver Todas as Categorias
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}


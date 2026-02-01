

export type UserRole = 'CUSTOMER' | 'DEALER' | 'ADMIN'

export type CarCategory =
  | 'SUV'
  | 'ESPORTIVO'
  | 'SEDAN'
  | 'COMPACTO'

export type FuelType =
  | 'FLEX'
  | 'GASOLINA'
  | 'DIESEL'
  | 'ELETRICO'
  | 'HIBRIDO'

export type TransmissionType = 'MANUAL' | 'AUTOMATIC'

export type PaymentMethod =
  | 'PIX'
  | 'DINHEIRO'
  | 'CARTAO_CREDITO'
  | 'CARTAO_DEBITO'
  | 'FINANCIAMENTO'
  | 'OUTROS'

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'CANCELLED'

export type NegotiationType = 'BUY' | 'SELL'

export type NegotiationStatus =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'CLOSED'

export interface User {
  id: string
  name: string
  email: string
  phone?: string | null
  role: UserRole
  createdAt: string
  updatedAt: string
}

export interface Car {
  id: string
  name: string
  brand: string
  model: string
  year: number
  price: number
  category: CarCategory
  description?: string | null
  imageUrl: string
  mileage?: number | null
  color?: string | null
  fuel: FuelType
  transmission: TransmissionType
  featured: boolean
  available: boolean
  createdAt: string
  updatedAt: string
}

export interface Order {
  id: string
  userId: string
  carId: string
  customerName: string
  customerRg: string
  customerPhone: string
  paymentMethod: PaymentMethod
  totalPrice: number
  status: OrderStatus
  createdAt: string
  updatedAt: string
  user?: User
  car?: Car
}

export interface Negotiation {
  id: string
  type: NegotiationType
  carId?: string | null
  buyerId: string
  sellerId: string
  status: NegotiationStatus
  vehicleName?: string | null
  vehicleBrand?: string | null
  vehicleYear?: number | null
  vehicleMileage?: number | null
  vehicleDescription?: string | null
  proposedPrice?: number | null
  createdAt: string
  updatedAt: string
  buyer?: User
  seller?: User
  car?: Car
  messages?: Message[]
}

export interface Message {
  id: string
  content: string
  negotiationId: string
  senderId: string
  createdAt: string
  sender?: User
}

export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface CheckoutFormData {
  customerName: string
  customerRg: string
  customerPhone: string
  paymentMethod: PaymentMethod
}

export interface NegotiationSellFormData {
  vehicleName: string
  vehicleBrand: string
  vehicleYear: string
  vehicleMileage: string
  vehicleDescription: string
  proposedPrice: string
  customerName: string
  customerPhone: string
}

export interface NegotiationBuyFormData {
  vehicleInterest: string
  customerName: string
  customerPhone: string
  message: string
}

export interface FilterOption {
  value: string
  label: string
}

export interface CarFilters {
  category?: CarCategory | 'TODOS'
  search?: string
  minPrice?: number
  maxPrice?: number
  minYear?: number
  maxYear?: number
  fuel?: FuelType
  transmission?: TransmissionType
}


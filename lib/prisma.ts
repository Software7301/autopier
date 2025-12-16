// Configuração do Prisma Client
// Singleton para evitar múltiplas instâncias em desenvolvimento
// Usa APENAS variáveis de ambiente - NUNCA URLs hardcoded

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Validar que DATABASE_URL está configurada
if (!process.env.DATABASE_URL && process.env.NODE_ENV === 'production') {
  console.warn('⚠️ DATABASE_URL não configurada. Configure na Vercel (Settings > Environment Variables)')
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma


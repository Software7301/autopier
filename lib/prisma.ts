// Configuração do Prisma Client
// Singleton para evitar múltiplas instâncias em desenvolvimento

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Verificar se DATABASE_URL está configurada
const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl && process.env.NODE_ENV === 'production') {
  console.warn('⚠️ DATABASE_URL não configurada. Configure a variável de ambiente na Vercel.')
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma


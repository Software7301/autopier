// Configuração do Prisma Client
// Singleton para evitar múltiplas instâncias em desenvolvimento

import { PrismaClient } from '@prisma/client'
import { config } from './config'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Usar configuração hardcoded ou variável de ambiente como fallback
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = config.database.url
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma


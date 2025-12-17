// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Verificar se DATABASE_URL está disponível
const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('❌ DATABASE_URL não encontrada em process.env')
  console.error('Variáveis de ambiente disponíveis:', Object.keys(process.env).filter(k => k.includes('DATABASE')))
}

// Configuração do Prisma Client otimizada para Vercel
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  })

// Em produção na Vercel, não usar global para evitar problemas de inicialização
// Em desenvolvimento, usar global para hot reload
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

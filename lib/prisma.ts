// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client'

// Singleton pattern otimizado para Vercel serverless
// Em serverless, cada função pode ter seu próprio contexto,
// mas dentro da mesma execução, reutilizamos a mesma instância
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Criar instância única do Prisma Client
// O Prisma lê DATABASE_URL automaticamente do schema.prisma
// Não precisamos passar explicitamente via datasources
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

// Em desenvolvimento, usar global para hot reload
// Em produção (Vercel), o global também funciona dentro da mesma execução serverless
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

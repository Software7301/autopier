// lib/prisma.ts
import { PrismaClient } from '@prisma/client'

// Singleton pattern para Vercel serverless
// O globalThis persiste dentro da mesma execução serverless
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Converte DATABASE_URL para usar Supabase Connection Pooler (PgBouncer)
 * OBRIGATÓRIO para ambiente serverless como Vercel
 * 
 * Formato esperado: postgresql://user:pass@db.xxx.supabase.co:5432/postgres
 * Formato pooler: postgresql://user:pass@db.xxx.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require
 */
function convertToPoolerUrl(url: string | undefined): string | undefined {
  if (!url) return url

  // Se já está usando pooler, garantir que tem os parâmetros necessários
  if (url.includes('.pooler.supabase.com') || url.includes(':6543')) {
    let poolerUrl = url
    const hasParams = poolerUrl.includes('?')
    const separator = hasParams ? '&' : '?'
    
    // Adicionar parâmetros obrigatórios se não existirem
    if (!poolerUrl.includes('pgbouncer=true')) {
      poolerUrl = `${poolerUrl}${separator}pgbouncer=true`
    }
    if (!poolerUrl.includes('sslmode=')) {
      poolerUrl = `${poolerUrl}&sslmode=require`
    }
    // Adicionar connection_limit=1 para serverless (recomendado pelo Supabase)
    if (!poolerUrl.includes('connection_limit=')) {
      poolerUrl = `${poolerUrl}&connection_limit=1`
    }
    return poolerUrl
  }

  // Se é conexão direta do Supabase, converter para pooler
  if (url.includes('supabase.co') && url.includes(':5432')) {
    // Substituir host: db.xxx.supabase.co -> db.xxx.pooler.supabase.com
    const hostMatch = url.match(/@([^:]+):5432/)
    if (hostMatch) {
      const originalHost = hostMatch[1]
      const poolerHost = originalHost.replace('.supabase.co', '.pooler.supabase.com')
      
      // Substituir porta 5432 por 6543
      let poolerUrl = url.replace(originalHost, poolerHost).replace(':5432', ':6543')
      
      // Adicionar parâmetros obrigatórios
      const separator = poolerUrl.includes('?') ? '&' : '?'
      poolerUrl = `${poolerUrl}${separator}pgbouncer=true&sslmode=require&connection_limit=1`
      
      console.log('✅ [Prisma] Convertido para Supabase Connection Pooler')
      return poolerUrl
    }
  }

  // Se não é Supabase ou já tem sslmode, apenas garantir sslmode
  if (!url.includes('sslmode=')) {
    const separator = url.includes('?') ? '&' : '?'
    return `${url}${separator}sslmode=require`
  }

  return url
}

// Preparar DATABASE_URL para usar pooler ANTES de criar o Prisma Client
const originalDatabaseUrl = process.env.DATABASE_URL
if (originalDatabaseUrl) {
  const poolerUrl = convertToPoolerUrl(originalDatabaseUrl)
  if (poolerUrl && poolerUrl !== originalDatabaseUrl) {
    process.env.DATABASE_URL = poolerUrl
    const urlForLog = poolerUrl.replace(/:[^:@]+@/, ':****@')
    console.log('✅ [Prisma] DATABASE_URL configurada para pooler:', urlForLog.substring(0, 120))
  }
} else {
  console.error('❌ [Prisma] DATABASE_URL não está configurada!')
}

// Prisma Client configurado para serverless
// O pooler gerencia conexões automaticamente, não precisamos de hacks
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

// Cache global para evitar múltiplas instâncias
// Em ambiente serverless (Vercel), o globalThis persiste dentro da mesma execução
if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma
}

// NOTA: Não usar $disconnect() manual em serverless
// O pooler gerencia conexões automaticamente e desconectar manualmente pode causar
// problemas em requisições subsequentes na mesma execução serverless

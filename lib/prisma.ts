
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function convertToPoolerUrl(url: string | undefined): string | undefined {
  if (!url) return url

  if (url.includes('.pooler.supabase.com') || url.includes(':6543')) {
    let poolerUrl = url
    const hasParams = poolerUrl.includes('?')
    const separator = hasParams ? '&' : '?'

    if (!poolerUrl.includes('pgbouncer=true')) {
      poolerUrl = `${poolerUrl}${separator}pgbouncer=true`
    }
    if (!poolerUrl.includes('sslmode=')) {
      poolerUrl = `${poolerUrl}&sslmode=require`
    }

    if (!poolerUrl.includes('connection_limit=')) {
      poolerUrl = `${poolerUrl}&connection_limit=10`
    }
    return poolerUrl
  }

  if (url.includes('supabase.co') && url.includes(':5432')) {

    const hostMatch = url.match(/@([^:]+):5432/)
    if (hostMatch) {
      const originalHost = hostMatch[1]
      const poolerHost = originalHost.replace('.supabase.co', '.pooler.supabase.com')

      let poolerUrl = url.replace(originalHost, poolerHost).replace(':5432', ':6543')

      const separator = poolerUrl.includes('?') ? '&' : '?'
      poolerUrl = `${poolerUrl}${separator}pgbouncer=true&sslmode=require&connection_limit=10`

      console.log('✅ [Prisma] Convertido para Supabase Connection Pooler')
      return poolerUrl
    }
  }

  if (!url.includes('sslmode=')) {
    const separator = url.includes('?') ? '&' : '?'
    return `${url}${separator}sslmode=require`
  }

  return url
}

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

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma
}


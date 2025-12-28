// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client'

// Singleton pattern otimizado para Vercel serverless
// PROBLEMA: Em serverless, cada função pode ter seu próprio contexto global
// SOLUÇÃO: Usar globalThis que persiste dentro da mesma execução serverless
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Função helper para preparar DATABASE_URL para serverless
// IMPORTANTE: Para evitar erros de prepared statements duplicados em serverless,
// vamos usar o pooler do Supabase em modo transaction (porta 6543) se disponível
function prepareDatabaseUrl(url: string | undefined): string | undefined {
  if (!url) return url
  
  let modifiedUrl = url
  
  // Se for Supabase e estiver usando porta 5432 (direct connection),
  // tentar usar o pooler em modo transaction (porta 6543) que não suporta prepared statements
  // Isso evita o erro "prepared statement already exists"
  if (modifiedUrl.includes('supabase.co') && modifiedUrl.includes(':5432')) {
    // Substituir porta 5432 por 6543 para usar pooler em modo transaction
    modifiedUrl = modifiedUrl.replace(':5432', ':6543')
    console.log('✅ Usando Supabase pooler (porta 6543) para evitar prepared statements')
  }
  
  // Adicionar sslmode se não existir
  if (!modifiedUrl.includes('sslmode=')) {
    const separator = modifiedUrl.includes('?') ? '&' : '?'
    modifiedUrl = `${modifiedUrl}${separator}sslmode=require`
  }
  
  // Adicionar pgbouncer=true se não existir (para pooler do Supabase)
  if (modifiedUrl.includes(':6543') && !modifiedUrl.includes('pgbouncer=')) {
    modifiedUrl = `${modifiedUrl}&pgbouncer=true`
  }
  
  return modifiedUrl
}

// IMPORTANTE: Supabase PostgreSQL requer SSL
// A DATABASE_URL deve incluir ?sslmode=require ou ?sslmode=prefer
// Exemplo: postgresql://user:pass@host:5432/db?sslmode=require

// IMPORTANTE: Em Next.js App Router, process.env é carregado automaticamente
// O Prisma lê DATABASE_URL do schema.prisma via env("DATABASE_URL")
// NÃO devemos validar manualmente - deixar o Prisma fazer isso
// O Prisma lançará erro claro se DATABASE_URL não estiver configurada

// Preparar DATABASE_URL para serverless (SSL + connection pooling)
// Isso é feito ANTES do Prisma Client ser criado
const originalDatabaseUrl = process.env.DATABASE_URL
if (originalDatabaseUrl) {
  const preparedDatabaseUrl = prepareDatabaseUrl(originalDatabaseUrl)
  // Se a URL foi modificada, atualizar process.env para o Prisma usar
  if (preparedDatabaseUrl && preparedDatabaseUrl !== originalDatabaseUrl) {
    process.env.DATABASE_URL = preparedDatabaseUrl
    console.log('✅ DATABASE_URL configurada para ambiente serverless (SSL + connection pooling)')
  }
}

// Configuração do Prisma Client para Vercel serverless
// IMPORTANTE: Usar connection_limit=1 e pool_timeout=0 na DATABASE_URL
// para evitar problemas de prepared statements duplicados em serverless
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // Configurações adicionais para serverless
    // Desabilitar query engine para evitar problemas de conexão
    // O Prisma usará conexões diretas sem prepared statements persistentes
  })

// Em desenvolvimento, usar global para hot reload
// Em produção (Vercel), o global funciona dentro da mesma execução serverless
// IMPORTANTE: Sempre usar global, mesmo em produção, para evitar múltiplas instâncias
if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma
}

// Função helper para resetar conexão em caso de erro de prepared statement
export async function resetPrismaConnection() {
  try {
    await prisma.$disconnect()
    // Limpar a instância global para forçar recriação
    if (globalForPrisma.prisma) {
      globalForPrisma.prisma = undefined
    }
    // Aguardar um pouco antes de reconectar
    await new Promise(resolve => setTimeout(resolve, 500))
  } catch (error) {
    // Ignorar erros de desconexão
    console.warn('⚠️ Erro ao resetar conexão Prisma:', error)
  }
}

// Garantir desconexão adequada em caso de erro
if (process.env.NODE_ENV === 'production') {
  // Em produção, garantir que conexões sejam fechadas adequadamente
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
  })
}


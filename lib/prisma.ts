// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client'

// Singleton pattern otimizado para Vercel serverless
// PROBLEMA: Em serverless, cada função pode ter seu próprio contexto global
// SOLUÇÃO: Usar globalThis que persiste dentro da mesma execução serverless
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Função helper para preparar DATABASE_URL para serverless
// IMPORTANTE: Por padrão, usar conexão direta (porta 5432) que é mais confiável
// O pooler (porta 6543) pode ser usado se explicitamente configurado via USE_POOLER=true
function prepareDatabaseUrl(url: string | undefined): string | undefined {
  if (!url) return url
  
  let modifiedUrl = url
  
  // Só usar pooler se explicitamente solicitado via variável de ambiente
  const usePooler = process.env.USE_POOLER === 'true'
  
  // Se for Supabase e estiver usando porta 5432 (direct connection),
  // e USE_POOLER=true, tentar usar o pooler em modo transaction (porta 6543)
  if (usePooler && modifiedUrl.includes('supabase.co') && modifiedUrl.includes(':5432')) {
    // Substituir porta 5432 por 6543 para usar pooler em modo transaction
    modifiedUrl = modifiedUrl.replace(':5432', ':6543')
    console.log('✅ Usando Supabase pooler (porta 6543) - configurado via USE_POOLER=true')
    
    // Adicionar pgbouncer=true se não existir (para pooler do Supabase)
    if (!modifiedUrl.includes('pgbouncer=')) {
      const separator = modifiedUrl.includes('?') ? '&' : '?'
      modifiedUrl = `${modifiedUrl}${separator}pgbouncer=true`
    }
  } else if (modifiedUrl.includes('supabase.co')) {
    console.log('✅ Usando conexão direta do Supabase (porta 5432)')
  }
  
  // Adicionar sslmode se não existir (obrigatório para Supabase)
  if (!modifiedUrl.includes('sslmode=')) {
    const separator = modifiedUrl.includes('?') ? '&' : '?'
    modifiedUrl = `${modifiedUrl}${separator}sslmode=require`
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
    // Log parcial da URL (ocultar senha por segurança)
    const urlForLog = preparedDatabaseUrl.replace(/:[^:@]+@/, ':****@')
    console.log('✅ DATABASE_URL configurada:', urlForLog.substring(0, 100) + '...')
  } else if (preparedDatabaseUrl) {
    // Log parcial mesmo se não foi modificada (para debug)
    const urlForLog = preparedDatabaseUrl.replace(/:[^:@]+@/, ':****@')
    console.log('✅ DATABASE_URL já está configurada:', urlForLog.substring(0, 100) + '...')
  }
} else {
  console.error('❌ DATABASE_URL não está configurada!')
}

// Configuração do Prisma Client para Vercel serverless
// IMPORTANTE: Para Supabase, usar conexão direta (porta 5432) é mais confiável
// O pooler (porta 6543) pode causar problemas de conexão em alguns casos
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
    // O Prisma gerencia conexões automaticamente
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


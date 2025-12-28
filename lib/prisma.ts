// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client'

// Singleton pattern otimizado para Vercel serverless
// PROBLEMA: Em serverless, cada função pode ter seu próprio contexto global
// SOLUÇÃO: Usar globalThis que persiste dentro da mesma execução serverless
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Função helper para garantir que DATABASE_URL tenha SSL para Supabase
function ensureSslMode(url: string | undefined): string | undefined {
  if (!url) return url
  
  // Se já tem sslmode, retornar como está
  if (url.includes('sslmode=')) {
    return url
  }
  
  // Se não tem sslmode, adicionar ?sslmode=require ou &sslmode=require
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}sslmode=require`
}

// IMPORTANTE: Supabase PostgreSQL requer SSL
// A DATABASE_URL deve incluir ?sslmode=require ou ?sslmode=prefer
// Exemplo: postgresql://user:pass@host:5432/db?sslmode=require

// IMPORTANTE: Em Next.js App Router, process.env é carregado automaticamente
// O Prisma lê DATABASE_URL do schema.prisma via env("DATABASE_URL")
// NÃO devemos validar manualmente - deixar o Prisma fazer isso
// O Prisma lançará erro claro se DATABASE_URL não estiver configurada

// Garantir SSL para Supabase (se DATABASE_URL existir)
// Isso é feito ANTES do Prisma Client ser criado
const originalDatabaseUrl = process.env.DATABASE_URL
if (originalDatabaseUrl) {
  const databaseUrlWithSsl = ensureSslMode(originalDatabaseUrl)
  // Se a URL não tinha sslmode, atualizar process.env para o Prisma usar
  if (databaseUrlWithSsl && databaseUrlWithSsl !== originalDatabaseUrl) {
    process.env.DATABASE_URL = databaseUrlWithSsl
    console.log('✅ SSL mode adicionado automaticamente à DATABASE_URL')
  }
}

// Configuração do Prisma Client para Vercel serverless
// O Prisma lê DATABASE_URL automaticamente do schema.prisma
// Se DATABASE_URL não existir, o Prisma lançará erro na primeira query
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
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


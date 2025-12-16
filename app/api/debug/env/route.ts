import { NextResponse } from 'next/server'

// Rota de debug para verificar variáveis de ambiente
// ATENÇÃO: Remova esta rota em produção por segurança
export const dynamic = 'force-dynamic'

export async function GET() {
  // Verificar se está em desenvolvimento
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Esta rota só está disponível em desenvolvimento' },
      { status: 403 }
    )
  }

  const envVars = {
    // Variáveis do Supabase
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL 
      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 30)}...` 
      : '❌ NÃO CONFIGURADO',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY 
      ? `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20)}...` 
      : '❌ NÃO CONFIGURADO',
    
    // Variável do banco de dados
    DATABASE_URL: process.env.DATABASE_URL 
      ? `${process.env.DATABASE_URL.substring(0, 30)}...` 
      : '❌ NÃO CONFIGURADO',
    
    // Outras variáveis
    STORAGE_MODE: process.env.STORAGE_MODE || 'LOCAL',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    NODE_ENV: process.env.NODE_ENV || 'development',
  }

  // Verificar se as variáveis estão configuradas
  const checks = {
    supabaseUrlConfigured: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKeyConfigured: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    databaseUrlConfigured: !!process.env.DATABASE_URL,
    allSupabaseConfigured: !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  }

  return NextResponse.json({
    message: 'Variáveis de ambiente (valores parcialmente ocultos por segurança)',
    environment: envVars,
    checks,
    instructions: {
      supabase: checks.allSupabaseConfigured 
        ? '✅ Supabase Storage configurado corretamente'
        : '⚠️ Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY',
      database: checks.databaseUrlConfigured
        ? '✅ Banco de dados configurado'
        : '⚠️ Configure DATABASE_URL',
    }
  })
}


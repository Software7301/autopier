// Configurações do AutoPier
// Todas as configurações vêm de variáveis de ambiente
// NUNCA usar URLs hardcoded aqui

export const config = {
  // Supabase Storage - APENAS variáveis de ambiente
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  },

  // Banco de Dados - APENAS variáveis de ambiente
  database: {
    url: process.env.DATABASE_URL || '',
  },

  // Aplicação - APENAS variáveis de ambiente
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://autopier.vercel.app',
  },
}

// Validar que as variáveis obrigatórias estão configuradas
if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') {
  if (!config.supabase.url || !config.supabase.anonKey) {
    console.warn('⚠️ NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY devem estar configuradas na Vercel')
  }
  if (!config.database.url) {
    console.warn('⚠️ DATABASE_URL deve estar configurada na Vercel')
  }
}


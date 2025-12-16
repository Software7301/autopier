// Configurações do AutoPier
// Todas as configurações estão hardcoded aqui para não depender de .env

export const config = {
  // Supabase Storage
  supabase: {
    url: 'https://autopiadora.supabase.co',
    anonKey: 'sb_publishable_3vE8LPpnJfz-IwP5D9QtUQ__FlA1tNE',
  },

  // Banco de Dados
  database: {
    url: 'postgresql://postgres:Maxnevida101029@db.autopiadora.supabase.co:5432/postgres',
  },

  // Aplicação
  app: {
    url: 'https://autopier.vercel.app',
  },
}

// Configurar variáveis de ambiente para o Prisma (apenas se não estiverem definidas)
if (typeof process !== 'undefined' && process.env) {
  const env = process.env
  const dbUrl = config.database.url
  const supabaseUrl = config.supabase.url
  const appUrl = config.app.url
  
  if (!env.DATABASE_URL) {
    env.DATABASE_URL = dbUrl
  }
  if (!env.NEXT_PUBLIC_SUPABASE_URL) {
    env.NEXT_PUBLIC_SUPABASE_URL = supabaseUrl
  }
  if (!env.NEXT_PUBLIC_APP_URL) {
    env.NEXT_PUBLIC_APP_URL = appUrl
  }
}


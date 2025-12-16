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

// Configurar variáveis de ambiente para o Prisma
// Usar função para evitar problemas com minificador
(function setEnvVars() {
  if (typeof process !== 'undefined' && process.env) {
    const env = process.env
    if (!env.DATABASE_URL) {
      env.DATABASE_URL = config.database.url
    }
    if (!env.NEXT_PUBLIC_SUPABASE_URL) {
      env.NEXT_PUBLIC_SUPABASE_URL = config.supabase.url
    }
    if (!env.NEXT_PUBLIC_APP_URL) {
      env.NEXT_PUBLIC_APP_URL = config.app.url
    }
  }
})()


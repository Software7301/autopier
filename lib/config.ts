

export const config = {

  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  },

  database: {
    url: process.env.DATABASE_URL || '',
  },

  app: {
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://takahashi.com',
  },
}

if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') {
  if (!config.supabase.url || !config.supabase.anonKey) {
    console.warn('⚠️ NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY devem estar configuradas na Vercel')
  }
  if (!config.database.url) {
    console.warn('⚠️ DATABASE_URL deve estar configurada na Vercel')
  }
}


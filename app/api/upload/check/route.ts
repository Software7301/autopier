import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'
import { config } from '@/lib/config'

// Rota para verificar configuração do Supabase Storage
export const dynamic = 'force-dynamic'

export async function GET() {
  // Usar configuração hardcoded ou variável de ambiente como fallback
  const supabaseUrl = config.supabase.url || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = config.supabase.anonKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const supabase = getSupabaseClient()

  const checks = {
    supabaseUrlConfigured: !!supabaseUrl,
    supabaseKeyConfigured: !!supabaseKey,
    supabaseClientCreated: !!supabase,
    bucketExists: false,
    bucketError: null as string | null,
  }

  // Tentar verificar se o bucket existe
  if (supabase) {
    try {
      const { data: buckets, error } = await supabase.storage.listBuckets()
      
      if (error) {
        checks.bucketError = error.message
      } else {
        const carsBucket = buckets?.find(b => b.name === 'cars')
        checks.bucketExists = !!carsBucket
      }
    } catch (error: any) {
      checks.bucketError = error.message || 'Erro ao verificar bucket'
    }
  }

  const status = checks.supabaseUrlConfigured && checks.supabaseKeyConfigured && checks.bucketExists
    ? 'ready'
    : checks.supabaseUrlConfigured && checks.supabaseKeyConfigured
    ? 'bucket_missing'
    : 'not_configured'

  return NextResponse.json({
    status,
    checks,
    instructions: {
      not_configured: {
        title: '⚠️ Variáveis não configuradas',
        steps: [
          '1. Acesse o painel da Vercel: https://vercel.com',
          '2. Vá em Settings > Environment Variables',
          '3. Adicione NEXT_PUBLIC_SUPABASE_URL',
          '4. Adicione NEXT_PUBLIC_SUPABASE_ANON_KEY',
          '5. Faça um novo deploy',
        ],
      },
      bucket_missing: {
        title: '⚠️ Bucket "cars" não encontrado',
        steps: [
          '1. Acesse o Supabase Dashboard',
          '2. Vá em Storage',
          '3. Clique em "Create a new bucket"',
          '4. Nome: "cars"',
          '5. Marque como "Public bucket"',
          '6. Clique em "Create bucket"',
        ],
      },
      ready: {
        title: '✅ Configuração completa',
        message: 'O Supabase Storage está configurado e pronto para uso.',
      },
    },
  })
}


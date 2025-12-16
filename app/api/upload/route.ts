import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Forçar renderização dinâmica
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo enviado' },
        { status: 400 }
      )
    }

    // Validar tipo de arquivo
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de arquivo não permitido. Use PNG, JPG ou WEBP.' },
        { status: 400 }
      )
    }

    // Validar tamanho (máximo 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. Tamanho máximo: 5MB' },
        { status: 400 }
      )
    }

    // Converter arquivo para buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Gerar nome único para o arquivo
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 15)
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const extension = originalName.split('.').pop() || 'jpg'
    const fileName = `${timestamp}_${randomStr}.${extension}`

    // Obter credenciais do Supabase APENAS de variáveis de ambiente
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // Verificar se as credenciais estão configuradas
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Supabase não configurado:', {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey,
      })
      return NextResponse.json(
        { 
          error: 'Supabase Storage não está configurado. Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY na Vercel.',
          code: 'STORAGE_NOT_CONFIGURED'
        },
        { status: 503 }
      )
    }

    // Validar que a URL termina com .supabase.com
    if (!supabaseUrl.endsWith('.supabase.com') && !supabaseUrl.includes('.supabase.com/')) {
      console.error('❌ URL do Supabase inválida:', supabaseUrl)
      return NextResponse.json(
        { 
          error: `URL do Supabase inválida. Deve terminar com .supabase.com`,
          code: 'INVALID_SUPABASE_URL'
        },
        { status: 500 }
      )
    }

    // Criar cliente Supabase
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Verificar se o bucket existe antes de fazer upload
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets()
    
    if (bucketError) {
      console.error('❌ Erro ao listar buckets:', bucketError)
      return NextResponse.json(
        { 
          error: `Erro ao acessar Supabase Storage: ${bucketError.message}`,
          code: 'BUCKET_ACCESS_ERROR',
          details: bucketError
        },
        { status: 500 }
      )
    }

    const carsBucket = buckets?.find(b => b.name === 'cars')
    
    if (!carsBucket) {
      console.error('❌ Bucket "cars" não encontrado')
      return NextResponse.json(
        { 
          error: 'Bucket "cars" não encontrado no Supabase Storage. Crie o bucket no dashboard do Supabase.',
          code: 'BUCKET_NOT_FOUND',
          instructions: [
            '1. Acesse o Supabase Dashboard',
            '2. Vá em Storage',
            '3. Clique em "Create a new bucket"',
            '4. Nome: "cars"',
            '5. Marque como "Public bucket"',
            '6. Clique em "Create bucket"'
          ]
        },
        { status: 404 }
      )
    }

    // Fazer upload para Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('cars')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
        cacheControl: '3600',
      })

    if (uploadError) {
      console.error('❌ Erro no upload:', uploadError)
      
      // Tratar erros específicos
      if (uploadError.message?.includes('duplicate') || uploadError.message?.includes('already exists')) {
        // Se o arquivo já existe, tentar com nome diferente
        const retryFileName = `${timestamp}_${randomStr}_${Date.now()}.${extension}`
        const { data: retryData, error: retryError } = await supabase.storage
          .from('cars')
          .upload(retryFileName, buffer, {
            contentType: file.type,
            upsert: false,
            cacheControl: '3600',
          })

        if (retryError) {
          return NextResponse.json(
            { 
              error: `Erro ao fazer upload: ${retryError.message}`,
              code: 'UPLOAD_ERROR',
              details: retryError
            },
            { status: 500 }
          )
        }

        const { data: urlData } = supabase.storage
          .from('cars')
          .getPublicUrl(retryFileName)

        return NextResponse.json({ 
          url: urlData.publicUrl,
          fileName: retryFileName
        })
      }

      return NextResponse.json(
        { 
          error: `Erro ao fazer upload: ${uploadError.message}`,
          code: 'UPLOAD_ERROR',
          details: uploadError
        },
        { status: 500 }
      )
    }

    // Obter URL pública da imagem
    const { data: urlData } = supabase.storage
      .from('cars')
      .getPublicUrl(fileName)

    console.log('✅ Upload realizado com sucesso:', {
      fileName,
      url: urlData.publicUrl,
      size: file.size,
      type: file.type,
    })

    return NextResponse.json({ 
      url: urlData.publicUrl,
      fileName
    })

  } catch (error: any) {
    console.error('❌ Erro inesperado no upload:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Erro inesperado ao fazer upload da imagem',
        code: 'UNEXPECTED_ERROR'
      },
      { status: 500 }
    )
  }
}


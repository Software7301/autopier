import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'

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
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de arquivo não permitido. Use PNG ou JPG.' },
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
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const fileName = `${timestamp}_${originalName}`

    // Tentar usar Supabase Storage (produção)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    // Log para debug (sempre, mas com valores parcialmente ocultos em produção)
    console.log('🔍 Debug Upload:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseKey: !!supabaseKey,
      supabaseUrlPreview: supabaseUrl 
        ? `${supabaseUrl.substring(0, 30)}...` 
        : '❌ NÃO CONFIGURADO',
      supabaseKeyPreview: supabaseKey 
        ? `${supabaseKey.substring(0, 20)}...` 
        : '❌ NÃO CONFIGURADO',
      nodeEnv: process.env.NODE_ENV,
    })

    const supabase = getSupabaseClient()

    if (supabase) {
      try {
        // Upload para Supabase Storage
        const { data, error } = await supabase.storage
          .from('cars')
          .upload(fileName, buffer, {
            contentType: file.type,
            upsert: false,
          })

        if (error) {
          console.error('Erro no Supabase Storage:', error)
          throw error
        }

        // Obter URL pública
        const { data: urlData } = supabase.storage
          .from('cars')
          .getPublicUrl(fileName)

        return NextResponse.json({ url: urlData.publicUrl })
      } catch (supabaseError) {
        console.error('Erro ao fazer upload no Supabase:', supabaseError)
        // Fallback para armazenamento local em desenvolvimento
      }
    }

    // Fallback: Salvar localmente (apenas em desenvolvimento)
    if (process.env.NODE_ENV === 'development') {
      const uploadsDir = join(process.cwd(), 'public', 'uploads', 'cars')
      if (!existsSync(uploadsDir)) {
        mkdirSync(uploadsDir, { recursive: true })
      }

      const filePath = join(uploadsDir, fileName)
      await writeFile(filePath, buffer)

      const imageUrl = `/uploads/cars/${fileName}`
      return NextResponse.json({ url: imageUrl })
    }

    // Se chegou aqui, não há configuração e não está em desenvolvimento
    const errorDetails = {
      message: 'Upload de imagens não configurado.',
      reason: !supabaseUrl && !supabaseKey 
        ? 'Variáveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY não configuradas'
        : !supabaseUrl 
        ? 'Variável NEXT_PUBLIC_SUPABASE_URL não configurada'
        : 'Variável NEXT_PUBLIC_SUPABASE_ANON_KEY não configurada',
      solution: 'Configure as variáveis de ambiente na Vercel (Settings > Environment Variables) ou use URLs de imagens diretamente no formulário.',
      code: 'STORAGE_NOT_CONFIGURED'
    }

    console.error('❌ Upload falhou:', errorDetails)

    return NextResponse.json(
      { 
        error: `${errorDetails.message} ${errorDetails.reason}. ${errorDetails.solution}`,
        code: errorDetails.code
      },
      { status: 503 } // 503 Service Unavailable é mais apropriado
    )
  } catch (error: any) {
    console.error('Erro ao fazer upload:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao fazer upload da imagem' },
      { status: 500 }
    )
  }
}


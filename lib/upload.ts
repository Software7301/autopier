// Função para upload de imagens diretamente para Supabase Storage
// Upload é feito do frontend, sem passar pelo backend
// Este arquivo deve ser usado apenas em componentes client-side

import { createClient } from '@supabase/supabase-js'

// Criar cliente Supabase para uso no frontend
// Usa APENAS variáveis de ambiente - NUNCA URLs hardcoded
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Supabase não está configurado. Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY nas variáveis de ambiente da Vercel.'
    )
  }

  // Validar que a URL termina com .supabase.com
  if (!supabaseUrl.endsWith('.supabase.com') && !supabaseUrl.includes('.supabase.com/')) {
    throw new Error(
      `URL do Supabase inválida: ${supabaseUrl}. Deve terminar com .supabase.com`
    )
  }

  return createClient(supabaseUrl, supabaseAnonKey)
}

/**
 * Faz upload de uma imagem para o Supabase Storage
 * @param file - Arquivo de imagem (File object)
 * @param bucket - Nome do bucket (padrão: 'cars')
 * @returns URL pública da imagem
 */
export async function uploadImageToSupabase(
  file: File,
  bucket: string = 'cars'
): Promise<string> {
  // Validar tipo de arquivo
  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Tipo de arquivo não permitido. Use PNG, JPG ou WEBP.')
  }

  // Validar tamanho (máximo 5MB)
  const maxSize = 5 * 1024 * 1024 // 5MB
  if (file.size > maxSize) {
    throw new Error('Arquivo muito grande. Tamanho máximo: 5MB')
  }

  // Gerar nome único para o arquivo
  const timestamp = Date.now()
  const randomStr = Math.random().toString(36).substring(2, 15)
  const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const extension = originalName.split('.').pop() || 'jpg'
  const fileName = `${timestamp}_${randomStr}.${extension}`

  // Criar cliente Supabase
  const supabase = getSupabaseClient()

  // Converter arquivo para ArrayBuffer
  const arrayBuffer = await file.arrayBuffer()

  // Fazer upload para Supabase Storage
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, arrayBuffer, {
      contentType: file.type,
      upsert: false,
      cacheControl: '3600',
    })

  if (error) {
    // Se o arquivo já existe, tentar com nome diferente
    if (error.message?.includes('duplicate') || error.message?.includes('already exists')) {
      const retryFileName = `${timestamp}_${randomStr}_${Date.now()}.${extension}`
      const { data: retryData, error: retryError } = await supabase.storage
        .from(bucket)
        .upload(retryFileName, arrayBuffer, {
          contentType: file.type,
          upsert: false,
          cacheControl: '3600',
        })

      if (retryError) {
        throw new Error(`Erro ao fazer upload: ${retryError.message}`)
      }

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(retryFileName)

      return urlData.publicUrl
    }

    throw new Error(`Erro ao fazer upload: ${error.message}`)
  }

  // Obter URL pública da imagem
  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(fileName)

  return urlData.publicUrl
}


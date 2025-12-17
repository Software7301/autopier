// Função para upload de imagens diretamente para Supabase Storage
// Upload é feito do frontend, sem passar pelo backend
// Este arquivo deve ser usado apenas em componentes client-side

import { createClient } from '@supabase/supabase-js'

// MIME types permitidos para imagens
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
]

// Extensões permitidas (normalizadas para lowercase)
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif']

// Função para validar extensão de arquivo
function isValidExtension(filename: string): boolean {
  const extension = filename.split('.').pop()?.toLowerCase()
  return extension ? ALLOWED_EXTENSIONS.includes(extension) : false
}

// Função para normalizar extensão (jpg -> jpeg para consistência)
function normalizeExtension(filename: string): string {
  const extension = filename.split('.').pop()?.toLowerCase() || 'jpg'
  // Normalizar jpg para jpeg
  return extension === 'jpg' ? 'jpeg' : extension
}

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

  // Validar que a URL termina com .supabase.com ou .supabase.co
  const isValidUrl = supabaseUrl.endsWith('.supabase.com') || 
                     supabaseUrl.endsWith('.supabase.co') ||
                     supabaseUrl.includes('.supabase.com/') ||
                     supabaseUrl.includes('.supabase.co/')
  
  if (!isValidUrl) {
    throw new Error(
      `URL do Supabase inválida: ${supabaseUrl}. Deve terminar com .supabase.com ou .supabase.co`
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
  // Validar e normalizar MIME type
  let mimeType = file.type.toLowerCase()
  // Normalizar image/jpg para image/jpeg (padrão)
  if (mimeType === 'image/jpg') {
    mimeType = 'image/jpeg'
  }
  
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    throw new Error(
      'Tipo de arquivo não permitido. Use JPG, JPEG, PNG, WEBP, GIF ou AVIF.'
    )
  }

  // Validar extensão do arquivo (segurança adicional)
  if (!isValidExtension(file.name)) {
    throw new Error(
      'Extensão de arquivo não permitida. Use .jpg, .jpeg, .png, .webp, .gif ou .avif'
    )
  }

  // Validar tamanho (máximo 5MB)
  const maxSize = 5 * 1024 * 1024 // 5MB
  if (file.size > maxSize) {
    throw new Error('Arquivo muito grande. Tamanho máximo: 5MB')
  }

  // Gerar nome único para o arquivo (normalizado)
  const timestamp = Date.now()
  const randomStr = Math.random().toString(36).substring(2, 15)
  const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const extension = normalizeExtension(originalName)
  const fileName = `${timestamp}_${randomStr}.${extension}`

  // Criar cliente Supabase
  const supabase = getSupabaseClient()

  // Converter arquivo para ArrayBuffer
  const arrayBuffer = await file.arrayBuffer()

  // Fazer upload para Supabase Storage (usar MIME type normalizado)
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, arrayBuffer, {
      contentType: mimeType,
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
          contentType: mimeType,
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


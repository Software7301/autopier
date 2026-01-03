

import { createClient } from '@supabase/supabase-js'

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
]

const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif']

function isValidExtension(filename: string): boolean {
  const extension = filename.split('.').pop()?.toLowerCase()
  return extension ? ALLOWED_EXTENSIONS.includes(extension) : false
}

function normalizeExtension(filename: string): string {
  const extension = filename.split('.').pop()?.toLowerCase() || 'jpg'

  return extension === 'jpg' ? 'jpeg' : extension
}

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Supabase não está configurado. Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY nas variáveis de ambiente da Vercel.'
    )
  }

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

export async function uploadImageToSupabase(
  file: File,
  bucket: string = 'cars'
): Promise<string> {

  let mimeType = file.type.toLowerCase()

  if (mimeType === 'image/jpg') {
    mimeType = 'image/jpeg'
  }

  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    throw new Error(
      'Tipo de arquivo não permitido. Use JPG, JPEG, PNG, WEBP, GIF ou AVIF.'
    )
  }

  if (!isValidExtension(file.name)) {
    throw new Error(
      'Extensão de arquivo não permitida. Use .jpg, .jpeg, .png, .webp, .gif ou .avif'
    )
  }

  const maxSize = 5 * 1024 * 1024
  if (file.size > maxSize) {
    throw new Error('Arquivo muito grande. Tamanho máximo: 5MB')
  }

  const timestamp = Date.now()
  const randomStr = Math.random().toString(36).substring(2, 15)
  const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const extension = normalizeExtension(originalName)
  const fileName = `${timestamp}_${randomStr}.${extension}`

  const supabase = getSupabaseClient()

  const arrayBuffer = await file.arrayBuffer()

  let targetBucket = bucket
  let { data, error } = await supabase.storage
    .from(targetBucket)
    .upload(fileName, arrayBuffer, {
      contentType: mimeType,
      upsert: false,
      cacheControl: '3600',
    })

  if (error) {
    if (error.message?.includes('Bucket not found') || error.message?.includes('not found')) {
      if (bucket === 'avatars') {
        console.warn(`⚠️ Bucket "avatars" não encontrado. Tentando usar bucket "cars" como fallback.`)
        targetBucket = 'cars'
        const { data: retryData, error: retryError } = await supabase.storage
          .from(targetBucket)
          .upload(fileName, arrayBuffer, {
            contentType: mimeType,
            upsert: false,
            cacheControl: '3600',
          })

        if (retryError) {
          throw new Error(`Bucket "avatars" não encontrado e falha ao usar "cars": ${retryError.message}. Crie o bucket "avatars" no Supabase Storage.`)
        }

        const { data: urlData } = supabase.storage
          .from(targetBucket)
          .getPublicUrl(fileName)

        return urlData.publicUrl
      } else {
        throw new Error(`Bucket "${bucket}" não encontrado. Crie o bucket no Supabase Storage.`)
      }
    }

    if (error.message?.includes('duplicate') || error.message?.includes('already exists')) {
      const retryFileName = `${timestamp}_${randomStr}_${Date.now()}.${extension}`
      const { data: retryData, error: retryError } = await supabase.storage
        .from(targetBucket)
        .upload(retryFileName, arrayBuffer, {
          contentType: mimeType,
          upsert: false,
          cacheControl: '3600',
        })

      if (retryError) {
        throw new Error(`Erro ao fazer upload: ${retryError.message}`)
      }

      const { data: urlData } = supabase.storage
        .from(targetBucket)
        .getPublicUrl(retryFileName)

      return urlData.publicUrl
    }

    throw new Error(`Erro ao fazer upload: ${error.message}`)
  }

  const { data: urlData } = supabase.storage
    .from(targetBucket)
    .getPublicUrl(fileName)

  return urlData.publicUrl
}


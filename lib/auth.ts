import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { prisma } from './prisma'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function getServerSession() {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null
  }

  const cookieStore = await cookies()
  const accessToken = cookieStore.get('sb-access-token')?.value

  if (!accessToken) {
    return null
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  })

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(accessToken)

  if (error || !user) {
    return null
  }

  return { user, accessToken }
}

export async function getUser() {
  const session = await getServerSession()
  
  if (!session?.user) {
    return null
  }

  // Buscar por email já que não temos mais supabaseId
  const user = await prisma.user.findUnique({
    where: { email: session.user.email || '' },
  })

  return user
}

export async function getOrCreateUser(supabaseUser: any) {
  if (!supabaseUser?.id || !supabaseUser?.email) {
    return null
  }

  // Extrair nome do usuário (suporta Google)
  const metadata = supabaseUser.user_metadata || {}
  const userName = 
    metadata.full_name || 
    metadata.name || 
    metadata.global_name || 
    metadata.preferred_username ||
    supabaseUser.email.split('@')[0]

  // Extrair avatar (suporta Google)
  const avatarUrl = 
    metadata.avatar_url || 
    metadata.picture || 
    null

  // Buscar por email já que não temos mais supabaseId
  let user = await prisma.user.findUnique({
    where: { email: supabaseUser.email },
  })

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: supabaseUser.email,
        name: userName,
        avatarUrl: avatarUrl,
        role: 'CUSTOMER',
      },
    })
  } else {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: userName || user.name,
        avatarUrl: avatarUrl || user.avatarUrl,
      },
    })
  }

  return user
}


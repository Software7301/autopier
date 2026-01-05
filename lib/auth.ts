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

  const user = await prisma.user.findUnique({
    where: { supabaseId: session.user.id },
  })

  return user
}

export async function getOrCreateUser(supabaseUser: any) {
  if (!supabaseUser?.id || !supabaseUser?.email) {
    return null
  }

  let user = await prisma.user.findUnique({
    where: { supabaseId: supabaseUser.id },
  })

  if (!user) {
    user = await prisma.user.upsert({
      where: { email: supabaseUser.email },
      update: {
        supabaseId: supabaseUser.id,
        name: supabaseUser.user_metadata?.full_name || supabaseUser.email.split('@')[0],
        avatarUrl: supabaseUser.user_metadata?.avatar_url || null,
      },
      create: {
        supabaseId: supabaseUser.id,
        email: supabaseUser.email,
        name: supabaseUser.user_metadata?.full_name || supabaseUser.email.split('@')[0],
        avatarUrl: supabaseUser.user_metadata?.avatar_url || null,
        role: 'CUSTOMER',
      },
    })
  } else {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: supabaseUser.user_metadata?.full_name || user.name,
        avatarUrl: supabaseUser.user_metadata?.avatar_url || user.avatarUrl,
      },
    })
  }

  return user
}


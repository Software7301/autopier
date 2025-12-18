// Helper functions para gerenciar usuários (buyer/seller) no Prisma
// Necessário porque Negotiation e Message requerem buyerId e sellerId

import { prisma } from './prisma'
import { UserRole } from '@prisma/client'

// ID do vendedor padrão (AutoPier)
const DEFAULT_SELLER_ID = 'seller-autopier'

/**
 * Busca ou cria o usuário vendedor padrão (AutoPier)
 */
export async function getOrCreateSeller(): Promise<string> {
  try {
    let seller = await prisma.user.findUnique({
      where: { id: DEFAULT_SELLER_ID },
    })

    if (!seller) {
      seller = await prisma.user.create({
        data: {
          id: DEFAULT_SELLER_ID,
          name: 'AutoPier',
          email: 'vendas@autopier.com',
          phone: null,
          role: UserRole.DEALER,
        },
      })
    }

    return seller.id
  } catch (error: any) {
    // Se já existe, buscar novamente
    if (error.code === 'P2002') {
      const seller = await prisma.user.findUnique({
        where: { id: DEFAULT_SELLER_ID },
      })
      return seller?.id || DEFAULT_SELLER_ID
    }
    throw error
  }
}

/**
 * Busca ou cria um usuário comprador baseado no telefone
 */
export async function getOrCreateBuyer(
  phone: string,
  name: string,
  email?: string
): Promise<string> {
  try {
    // Normalizar telefone (remover caracteres não numéricos)
    const normalizedPhone = phone.replace(/\D/g, '')
    
    // Buscar por telefone ou email
    let buyer = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: normalizedPhone },
          ...(email ? [{ email }] : []),
        ],
      },
    })

    if (!buyer) {
      // Criar novo usuário comprador
      buyer = await prisma.user.create({
        data: {
          name,
          email: email || `cliente-${normalizedPhone}@autopier.com`,
          phone: normalizedPhone,
          role: UserRole.CUSTOMER,
        },
      })
    } else {
      // Atualizar nome se necessário
      if (buyer.name !== name) {
        buyer = await prisma.user.update({
          where: { id: buyer.id },
          data: { name },
        })
      }
    }

    return buyer.id
  } catch (error: any) {
    // Se erro de duplicata, buscar novamente
    if (error.code === 'P2002') {
      const normalizedPhone = phone.replace(/\D/g, '')
      const buyer = await prisma.user.findFirst({
        where: {
          OR: [
            { phone: normalizedPhone },
            ...(email ? [{ email }] : []),
          ],
        },
      })
      return buyer?.id || ''
    }
    throw error
  }
}




import { prisma } from './prisma'
import { UserRole } from '@prisma/client'

const DEFAULT_SELLER_ID = 'seller-takahashi'

export async function getOrCreateSeller(): Promise<string> {
  try {
    let seller = await prisma.user.findUnique({
      where: { id: DEFAULT_SELLER_ID },
    })

    if (!seller) {
      seller = await prisma.user.create({
        data: {
          id: DEFAULT_SELLER_ID,
          name: 'Takahashi',
          email: 'vendas@takahashi.com',
          phone: null,
          role: UserRole.DEALER,
        },
      })
    }
    
    return seller.id
  } catch (error: any) {

    if (error.code === 'P2002') {
      const seller = await prisma.user.findUnique({
        where: { id: DEFAULT_SELLER_ID },
      })
      return seller?.id || DEFAULT_SELLER_ID
    }
    throw error
  }
}

export async function getOrCreateBuyer(
  phone: string,
  name: string,
  email?: string
): Promise<string> {
  try {
    const normalizedPhone = phone.replace(/\D/g, '')

    if (!normalizedPhone || normalizedPhone.length < 10) {
      throw new Error('Telefone inválido. Deve conter pelo menos 10 dígitos.')
    }

    if (!name || !name.trim()) {
      throw new Error('Nome é obrigatório.')
    }

    let buyer = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: normalizedPhone },
          ...(email ? [{ email: email.trim() }] : []),
        ],
      },
    })

    if (!buyer) {
      buyer = await prisma.user.create({
        data: {
          name: name.trim(),
          email: email?.trim() || `cliente-${normalizedPhone}@takahashi.com`,
          phone: normalizedPhone,
          role: UserRole.CUSTOMER,
        },
      })
    } else {
      if (buyer.name !== name.trim()) {
        buyer = await prisma.user.update({
          where: { id: buyer.id },
          data: { name: name.trim() },
        })
      }
    }

    if (!buyer || !buyer.id) {
      throw new Error('Erro ao criar ou buscar comprador')
    }

    return buyer.id
  } catch (error: any) {
    if (error.code === 'P2002') {
      // Erro de duplicata - tentar buscar novamente
      const normalizedPhone = phone.replace(/\D/g, '')
      const buyer = await prisma.user.findFirst({
        where: {
          OR: [
            { phone: normalizedPhone },
            ...(email ? [{ email: email.trim() }] : []),
          ],
        },
      })
      
      if (!buyer || !buyer.id) {
        throw new Error('Erro ao buscar comprador após duplicata')
      }
      
      return buyer.id
    }
    throw error
  }
}


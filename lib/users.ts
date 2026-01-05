

import { prisma } from './prisma'
import { UserRole } from '@prisma/client'

const DEFAULT_SELLER_ID = 'seller-autopier'

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

    let buyer = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: normalizedPhone },
          ...(email ? [{ email }] : []),
        ],
      },
    })

    if (!buyer) {

      buyer = await prisma.user.create({
        data: {
          name,
          email: email || `cliente-${normalizedPhone}@autopier.com`,
          phone: normalizedPhone,
          role: UserRole.CUSTOMER,
        },
      })
    } else {

      if (buyer.name !== name) {
        buyer = await prisma.user.update({
          where: { id: buyer.id },
          data: { name },
        })
      }
    }

    return buyer.id
  } catch (error: any) {

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


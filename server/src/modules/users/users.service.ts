import { prisma } from '../../db/prisma'
import { AppError } from '../../utils/errors'

const MAX_ADDRESSES = 10

export async function listAddresses(userId: string) {
  return prisma.address.findMany({
    where: { userId },
    orderBy: [{ predeterminada: 'desc' }, { createdAt: 'desc' }],
  })
}

async function getOwnAddressOrThrow(userId: string, addressId: string) {
  const address = await prisma.address.findUnique({ where: { id: addressId } })
  if (!address || address.userId !== userId) {
    throw new AppError('Dirección no encontrada.', 404)
  }
  return address
}

export async function createAddress(userId: string, data: {
  etiqueta: string
  calle: string
  numero: string
  colonia: string
  cp: string
  ciudad: string
  estado: string
  referencias?: string
  lat?: number
  lng?: number
  predeterminada?: boolean
}) {
  const count = await prisma.address.count({ where: { userId } })
  if (count >= MAX_ADDRESSES) {
    throw new AppError(`Puedes guardar máximo ${MAX_ADDRESSES} direcciones.`, 409)
  }

  // La primera dirección siempre queda como predeterminada.
  const makeDefault = data.predeterminada === true || count === 0

  return prisma.$transaction(async tx => {
    if (makeDefault) {
      await tx.address.updateMany({
        where: { userId, predeterminada: true },
        data: { predeterminada: false },
      })
    }
    return tx.address.create({
      data: { ...data, userId, predeterminada: makeDefault },
    })
  })
}

export async function updateAddress(userId: string, addressId: string, data: Partial<{
  etiqueta: string
  calle: string
  numero: string
  colonia: string
  cp: string
  ciudad: string
  estado: string
  referencias: string
  lat: number
  lng: number
}>) {
  await getOwnAddressOrThrow(userId, addressId)
  return prisma.address.update({ where: { id: addressId }, data })
}

export async function setDefaultAddress(userId: string, addressId: string) {
  await getOwnAddressOrThrow(userId, addressId)

  return prisma.$transaction(async tx => {
    await tx.address.updateMany({
      where: { userId, predeterminada: true },
      data: { predeterminada: false },
    })
    return tx.address.update({
      where: { id: addressId },
      data: { predeterminada: true },
    })
  })
}

export async function deleteAddress(userId: string, addressId: string) {
  const address = await getOwnAddressOrThrow(userId, addressId)

  await prisma.$transaction(async tx => {
    await tx.address.delete({ where: { id: addressId } })

    // Si borró la predeterminada, la más reciente que quede toma su lugar.
    // Los pedidos anteriores no se afectan: guardan su propia copia de la
    // dirección (direccionCalle, direccionColonia, etc.).
    if (address.predeterminada) {
      const next = await tx.address.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      })
      if (next) {
        await tx.address.update({ where: { id: next.id }, data: { predeterminada: true } })
      }
    }
  })
}

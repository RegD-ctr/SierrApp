import { prisma } from '../../db/prisma'
import { AppError } from '../../utils/errors'
import { emitToUser, emitToAdmins, createNotification, notifyAdmins } from '../../realtime/socket'

export async function sendMessage(userId: string, mensaje: string, orderId?: string) {
  const message = await prisma.supportMessage.create({
    data: { userId, mensaje, orderId, autor: 'USUARIO' },
  })

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { nombre: true } })

  // Dos avisos con propósito distinto: uno para que el chat de un admin
  // que ya tenga esta conversación abierta se actualice al instante...
  emitToAdmins('support:message', message)
  // ...y otro para que le suene la campanita aunque no la tenga abierta.
  await notifyAdmins('soporte', 'Nuevo mensaje de soporte', `${user?.nombre ?? 'Un usuario'} envió un mensaje.`)

  return message
}

export async function listMyMessages(userId: string) {
  return prisma.supportMessage.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
  })
}

// ------------------------------------------------------------
// LADO ADMIN
// ------------------------------------------------------------

export async function listConversations() {
  const grouped = await prisma.supportMessage.groupBy({
    by: ['userId'],
    _max: { createdAt: true },
  })

  grouped.sort((a, b) => (b._max.createdAt?.getTime() ?? 0) - (a._max.createdAt?.getTime() ?? 0))

  return Promise.all(
    grouped.map(async g => {
      const user = await prisma.user.findUnique({
        where: { id: g.userId },
        select: { id: true, nombre: true, email: true, rol: true },
      })
      const lastMessage = await prisma.supportMessage.findFirst({
        where: { userId: g.userId },
        orderBy: { createdAt: 'desc' },
      })
      return { user, lastMessage }
    })
  )
}

export async function getConversation(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, nombre: true, email: true } })
  if (!user) {
    throw new AppError('Usuario no encontrado.', 404)
  }
  const messages = await prisma.supportMessage.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
  })
  return { user, messages }
}

export async function replyToUser(userId: string, mensaje: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) {
    throw new AppError('Usuario no encontrado.', 404)
  }

  const message = await prisma.supportMessage.create({
    data: { userId, mensaje, autor: 'SOPORTE' },
  })

  emitToUser(userId, 'support:message', message)
  await createNotification(userId, 'soporte', 'Respuesta de soporte', 'Soporte respondió tu mensaje.')

  return message
}

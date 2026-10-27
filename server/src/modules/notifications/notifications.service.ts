import { prisma } from '../../db/prisma'
import { AppError } from '../../utils/errors'

export async function listMyNotifications(userId: string) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
}

export async function getUnreadCount(userId: string) {
  return prisma.notification.count({ where: { userId, leido: false } })
}

export async function markAsRead(userId: string, id: string) {
  const notification = await prisma.notification.findUnique({ where: { id } })
  if (!notification || notification.userId !== userId) {
    throw new AppError('Notificación no encontrada.', 404)
  }
  return prisma.notification.update({ where: { id }, data: { leido: true } })
}

export async function markAllAsRead(userId: string) {
  await prisma.notification.updateMany({
    where: { userId, leido: false },
    data: { leido: true },
  })
}

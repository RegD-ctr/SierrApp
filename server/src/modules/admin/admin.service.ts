import { prisma } from '../../db/prisma'
import { AppError } from '../../utils/errors'
import { emitToUser, broadcastToDrivers, createNotification, disconnectUser } from '../../realtime/socket'
import { revokeAllSessions } from '../auth/auth.service'

const SAFE_USER_SELECT = {
  id: true,
  nombre: true,
  email: true,
  telefono: true,
  rol: true,
  status: true,
  createdAt: true,
} as const

// ------------------------------------------------------------
// REPARTIDORES
// ------------------------------------------------------------

export async function listPendingRepartidores() {
  return prisma.user.findMany({
    where: { rol: 'REPARTIDOR', status: 'PENDIENTE' },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true, nombre: true, email: true, telefono: true, status: true, createdAt: true,
      driverProfile: { select: { matricula: true, tieneVehiculo: true, vehiculo: true, fotoUrl: true, licenciaUrl: true } },
    },
  })
}

export async function listAllRepartidores() {
  return prisma.user.findMany({
    where: { rol: 'REPARTIDOR' },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, nombre: true, email: true, telefono: true, status: true, createdAt: true,
      driverProfile: { select: { matricula: true, tieneVehiculo: true, vehiculo: true, fotoUrl: true, licenciaUrl: true, ratingPromedio: true } },
    },
  })
}

async function getRepartidorOrThrow(id: string) {
  const user = await prisma.user.findUnique({ where: { id } })
  if (!user || user.rol !== 'REPARTIDOR') {
    throw new AppError('Repartidor no encontrado.', 404)
  }
  return user
}

export async function approveRepartidor(id: string) {
  const user = await getRepartidorOrThrow(id)
  if (user.status !== 'PENDIENTE') {
    throw new AppError('Esta solicitud ya fue procesada.', 409)
  }
  const updated = await prisma.user.update({ where: { id }, data: { status: 'ACTIVO' }, select: SAFE_USER_SELECT })
  emitToUser(id, 'account:updated', { status: 'ACTIVO' })
  await createNotification(id, 'cuenta', '¡Cuenta aprobada!', 'Tu cuenta de repartidor fue aprobada. Ya puedes iniciar sesión y empezar a recibir pedidos.')
  return updated
}

export async function rejectRepartidor(id: string) {
  const user = await getRepartidorOrThrow(id)
  if (user.status !== 'PENDIENTE') {
    throw new AppError('Esta solicitud ya fue procesada.', 409)
  }
  const updated = await prisma.user.update({ where: { id }, data: { status: 'RECHAZADO' }, select: SAFE_USER_SELECT })
  await revokeAllSessions(id)
  emitToUser(id, 'account:updated', { status: 'RECHAZADO' })
  await createNotification(id, 'cuenta', 'Solicitud rechazada', 'Tu solicitud para ser repartidor fue rechazada. Contacta a soporte para más información.')
  disconnectUser(id)
  return updated
}

export async function suspendRepartidor(id: string) {
  await getRepartidorOrThrow(id)
  const updated = await prisma.user.update({ where: { id }, data: { status: 'SUSPENDIDO' }, select: SAFE_USER_SELECT })
  // Liberar pedidos asignados que aún no han sido recogidos para que otro repartidor pueda tomarlos
  const assignedOrders = await prisma.order.findMany({
    where: { repartidorId: id, estado: 'REPARTIDOR_ASIGNADO' },
    include: { restaurant: { select: { nombre: true, direccion: true } } },
  })
  for (const ord of assignedOrders) {
    await prisma.order.update({
      where: { id: ord.id },
      data: { repartidorId: null, estado: 'LISTO' },
    })
    broadcastToDrivers('order:available', {
      orderId: ord.id,
      numeroPedido: ord.id.slice(0, 8).toUpperCase(),
      restaurantNombre: ord.restaurant.nombre,
      restaurantDireccion: ord.restaurant.direccion,
      total: ord.total,
    })
  }
  await revokeAllSessions(id)
  emitToUser(id, 'account:updated', { status: 'SUSPENDIDO' })
  await createNotification(id, 'cuenta', 'Cuenta suspendida', 'Tu cuenta de repartidor fue suspendida. Contacta a soporte para más información.')
  disconnectUser(id)
  return updated
}

export async function reactivateRepartidor(id: string) {
  await getRepartidorOrThrow(id)
  const updated = await prisma.user.update({ where: { id }, data: { status: 'ACTIVO' }, select: SAFE_USER_SELECT })
  emitToUser(id, 'account:updated', { status: 'ACTIVO' })
  await createNotification(id, 'cuenta', 'Cuenta reactivada', 'Tu cuenta de repartidor fue reactivada. Ya puedes volver a recibir pedidos.')
  return updated
}

// ------------------------------------------------------------
// USUARIOS (clientes)
// ------------------------------------------------------------

export async function listAllUsuarios() {
  return prisma.user.findMany({
    where: { rol: 'USUARIO' },
    orderBy: { createdAt: 'desc' },
    select: { id: true, nombre: true, email: true, telefono: true, status: true, createdAt: true },
  })
}

async function getUsuarioOrThrow(id: string) {
  const user = await prisma.user.findUnique({ where: { id } })
  if (!user || user.rol !== 'USUARIO') {
    throw new AppError('Usuario no encontrado.', 404)
  }
  return user
}

export async function suspendUsuario(id: string) {
  await getUsuarioOrThrow(id)
  const updated = await prisma.user.update({ where: { id }, data: { status: 'SUSPENDIDO' }, select: SAFE_USER_SELECT })
  await revokeAllSessions(id)
  emitToUser(id, 'account:updated', { status: 'SUSPENDIDO' })
  await createNotification(id, 'cuenta', 'Cuenta suspendida', 'Tu cuenta fue suspendida. Contacta a soporte para más información.')
  disconnectUser(id)
  return updated
}

export async function reactivateUsuario(id: string) {
  await getUsuarioOrThrow(id)
  const updated = await prisma.user.update({ where: { id }, data: { status: 'ACTIVO' }, select: SAFE_USER_SELECT })
  emitToUser(id, 'account:updated', { status: 'ACTIVO' })
  await createNotification(id, 'cuenta', 'Cuenta reactivada', 'Tu cuenta fue reactivada.')
  return updated
}

// ------------------------------------------------------------
// COMISIONES DE LA PLATAFORMA
// ------------------------------------------------------------

export async function getConfig() {
  const config = await prisma.platformConfig.findUnique({ where: { id: 'singleton' } })
  if (!config) {
    throw new AppError('La configuración de la plataforma no está inicializada — corre el seed.', 500)
  }
  return config
}

export async function updateConfig(data: Partial<{
  comisionLocalPorcentaje: number
  comisionRepartidorFija: number
  comisionUsuarioFija: number
}>) {
  // Confirma que exista antes de actualizar — mensaje más claro que el
  // error crudo de Prisma si el singleton no se sembró todavía.
  await getConfig()
  return prisma.platformConfig.update({ where: { id: 'singleton' }, data })
}

// ------------------------------------------------------------
// ZONAS DE COBERTURA
// ------------------------------------------------------------

export async function listZones() {
  return prisma.deliveryZone.findMany({ orderBy: { createdAt: 'asc' } })
}

export async function createZone(nombre: string) {
  return prisma.deliveryZone.create({ data: { nombre } })
}

export async function updateZone(id: string, data: Partial<{ nombre: string; activa: boolean }>) {
  const zone = await prisma.deliveryZone.findUnique({ where: { id } })
  if (!zone) {
    throw new AppError('Zona no encontrada.', 404)
  }
  return prisma.deliveryZone.update({ where: { id }, data })
}

export async function deleteZone(id: string) {
  const zone = await prisma.deliveryZone.findUnique({ where: { id } })
  if (!zone) {
    throw new AppError('Zona no encontrada.', 404)
  }
  await prisma.deliveryZone.delete({ where: { id } })
}

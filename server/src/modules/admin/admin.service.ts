import { prisma } from '../../db/prisma'
import { AppError } from '../../utils/errors'

// ------------------------------------------------------------
// REPARTIDORES
// ------------------------------------------------------------

export async function listPendingRepartidores() {
  return prisma.user.findMany({
    where: { rol: 'REPARTIDOR', status: 'PENDIENTE' },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true, nombre: true, email: true, telefono: true, status: true, createdAt: true,
      driverProfile: { select: { matricula: true, tieneVehiculo: true, vehiculo: true, fotoUrl: true } },
    },
  })
}

export async function listAllRepartidores() {
  return prisma.user.findMany({
    where: { rol: 'REPARTIDOR' },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, nombre: true, email: true, telefono: true, status: true, createdAt: true,
      driverProfile: { select: { matricula: true, tieneVehiculo: true, vehiculo: true, fotoUrl: true, ratingPromedio: true } },
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
  return prisma.user.update({ where: { id }, data: { status: 'ACTIVO' } })
}

export async function rejectRepartidor(id: string) {
  const user = await getRepartidorOrThrow(id)
  if (user.status !== 'PENDIENTE') {
    throw new AppError('Esta solicitud ya fue procesada.', 409)
  }
  return prisma.user.update({ where: { id }, data: { status: 'RECHAZADO' } })
}

export async function suspendRepartidor(id: string) {
  await getRepartidorOrThrow(id)
  return prisma.user.update({ where: { id }, data: { status: 'SUSPENDIDO' } })
}

export async function reactivateRepartidor(id: string) {
  await getRepartidorOrThrow(id)
  return prisma.user.update({ where: { id }, data: { status: 'ACTIVO' } })
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
  return prisma.user.update({ where: { id }, data: { status: 'SUSPENDIDO' } })
}

export async function reactivateUsuario(id: string) {
  await getUsuarioOrThrow(id)
  return prisma.user.update({ where: { id }, data: { status: 'ACTIVO' } })
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

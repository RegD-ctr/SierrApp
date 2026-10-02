// Destino: server/src/modules/restaurants/restaurants.service.ts

import { prisma } from '../../db/prisma'
import { AppError } from '../../utils/errors'
import { emitToUser, createNotification } from '../../realtime/socket'

// ------------------------------------------------------------
// LECTURA PÚBLICA (Explorar.tsx, App.tsx home, RestaurantPage.tsx)
// ------------------------------------------------------------

export async function listActiveRestaurants(params: {
  categoria?: string
  search?: string
  take: number
  skip: number
}) {
  return prisma.restaurant.findMany({
    where: {
      status: 'ACTIVO',
      ...(params.categoria ? { categoria: params.categoria } : {}),
      ...(params.search
        ? { nombre: { contains: params.search, mode: 'insensitive' as const } }
        : {}),
    },
    orderBy: { rating: 'desc' },
    take: params.take,
    skip: params.skip,
  })
}

export async function getRestaurantDetail(id: string) {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id },
    include: {
      dishes: {
        where: { disponible: true },
        include: { optionGroups: { include: { opciones: true } } },
        orderBy: { categoria: 'asc' },
      },
    },
  })

  if (!restaurant || restaurant.status !== 'ACTIVO') {
    throw new AppError('Restaurante no encontrado.', 404)
  }

  return restaurant
}

// ------------------------------------------------------------
// GESTIÓN DEL PROPIO RESTAURANTE (rol LOCAL — LocalPanel.tsx)
// ------------------------------------------------------------

async function getOwnRestaurantOrThrow(userId: string) {
  const restaurant = await prisma.restaurant.findUnique({ where: { ownerId: userId } })
  if (!restaurant) {
    throw new AppError('No tienes un restaurante asociado a tu cuenta.', 404)
  }
  return restaurant
}

export async function getMyRestaurant(userId: string) {
  const restaurant = await getOwnRestaurantOrThrow(userId)
  return prisma.restaurant.findUnique({
    where: { id: restaurant.id },
    include: {
      dishes: { include: { optionGroups: { include: { opciones: true } } }, orderBy: { createdAt: 'desc' } },
    },
  })
}

export async function updateMyRestaurant(userId: string, data: Partial<{
  nombre: string; categoria: string; tiempoEntrega: string; deliveryFee: number
  deliveryFeeTexto: string; direccion: string; coverImg: string; badge: string
}>) {
  const restaurant = await getOwnRestaurantOrThrow(userId)
  return prisma.restaurant.update({ where: { id: restaurant.id }, data })
}

// "Abrir/Cerrar local" — botón de acciones rápidas en LocalPanel
export async function toggleMyRestaurantOpen(userId: string, isOpen: boolean) {
  const restaurant = await getOwnRestaurantOrThrow(userId)
  return prisma.restaurant.update({ where: { id: restaurant.id }, data: { isOpen } })
}

// ------------------------------------------------------------
// PLATILLOS (rol LOCAL)
// ------------------------------------------------------------

export async function createDish(userId: string, data: {
  nombre: string; descripcion: string; categoria: string; precio: number; imagen?: string
}) {
  const restaurant = await getOwnRestaurantOrThrow(userId)
  return prisma.dish.create({
    data: { ...data, restaurantId: restaurant.id },
  })
}

async function getOwnDishOrThrow(userId: string, dishId: string) {
  const restaurant = await getOwnRestaurantOrThrow(userId)
  const dish = await prisma.dish.findUnique({ where: { id: dishId } })

  if (!dish || dish.restaurantId !== restaurant.id) {
    // Mismo mensaje si no existe o si es de OTRO restaurante — no le
    // confirmamos a un local que un platillo ajeno existe (evita fuga
    // de información entre negocios).
    throw new AppError('Platillo no encontrado.', 404)
  }
  return dish
}

export async function updateDish(userId: string, dishId: string, data: Partial<{
  nombre: string; descripcion: string; categoria: string; precio: number
  imagen: string; disponible: boolean
}>) {
  await getOwnDishOrThrow(userId, dishId)
  return prisma.dish.update({ where: { id: dishId }, data })
}

export async function deleteDish(userId: string, dishId: string) {
  await getOwnDishOrThrow(userId, dishId)
  await prisma.dish.delete({ where: { id: dishId } })
}

// ------------------------------------------------------------
// ADMINISTRACIÓN (rol ADMIN — AdminPanel.tsx, tab Locales)
// ------------------------------------------------------------

export async function listPendingRestaurants() {
  return prisma.restaurant.findMany({
    where: { status: 'PENDIENTE' },
    orderBy: { createdAt: 'asc' },
    include: { owner: { select: { nombre: true, email: true, telefono: true } } },
  })
}

export async function listAllRestaurantsForAdmin() {
  return prisma.restaurant.findMany({
    orderBy: { createdAt: 'desc' },
    include: { owner: { select: { nombre: true, email: true, telefono: true } } },
  })
}

async function setRestaurantStatus(id: string, status: 'ACTIVO' | 'SUSPENDIDO') {
  const restaurant = await prisma.restaurant.findUnique({ where: { id } })
  if (!restaurant) {
    throw new AppError('Restaurante no encontrado.', 404)
  }

  if (status === 'ACTIVO') {
    await prisma.user.update({ where: { id: restaurant.ownerId }, data: { status: 'ACTIVO' } })
  }
  if (status === 'SUSPENDIDO') {
    await prisma.user.update({ where: { id: restaurant.ownerId }, data: { status: 'SUSPENDIDO' } })
  }

  const updated = await prisma.restaurant.update({ where: { id }, data: { status } })

  emitToUser(restaurant.ownerId, 'account:updated', { status })
  await createNotification(
    restaurant.ownerId,
    'cuenta',
    status === 'ACTIVO' ? '¡Tu restaurante fue aprobado!' : 'Tu restaurante fue suspendido',
    status === 'ACTIVO'
      ? 'Tu restaurante ya está activo y visible para los clientes.'
      : 'Tu restaurante fue suspendido y ya no aparece para los clientes. Contacta a soporte para más información.'
  )

  return updated
}

export async function approveRestaurant(id: string) {
  return setRestaurantStatus(id, 'ACTIVO')
}

export async function suspendRestaurant(id: string) {
  return setRestaurantStatus(id, 'SUSPENDIDO')
}

export async function reactivateRestaurant(id: string) {
  return setRestaurantStatus(id, 'ACTIVO')
}

// ------------------------------------------------------------
// PROMOCIONES (rol LOCAL)
// ------------------------------------------------------------

export async function createPromotion(userId: string, data: {
  titulo: string
  descripcion?: string
  descuentoPorcentaje?: number
  codigo?: string
  vigenciaInicio?: Date
  vigenciaFin?: Date
}) {
  const restaurant = await getOwnRestaurantOrThrow(userId)
  return prisma.promotion.create({ data: { ...data, restaurantId: restaurant.id } })
}

export async function listMyPromotions(userId: string) {
  const restaurant = await getOwnRestaurantOrThrow(userId)
  return prisma.promotion.findMany({
    where: { restaurantId: restaurant.id },
    orderBy: { createdAt: 'desc' },
  })
}

async function getOwnPromotionOrThrow(userId: string, promotionId: string) {
  const restaurant = await getOwnRestaurantOrThrow(userId)
  const promo = await prisma.promotion.findUnique({ where: { id: promotionId } })
  if (!promo || promo.restaurantId !== restaurant.id) {
    throw new AppError('Promoción no encontrada.', 404)
  }
  return promo
}

export async function updatePromotion(userId: string, promotionId: string, data: Partial<{
  titulo: string
  descripcion: string
  descuentoPorcentaje: number
  codigo: string
  vigenciaInicio: Date
  vigenciaFin: Date
  activo: boolean
}>) {
  await getOwnPromotionOrThrow(userId, promotionId)
  return prisma.promotion.update({ where: { id: promotionId }, data })
}

export async function deletePromotion(userId: string, promotionId: string) {
  await getOwnPromotionOrThrow(userId, promotionId)
  await prisma.promotion.delete({ where: { id: promotionId } })
}

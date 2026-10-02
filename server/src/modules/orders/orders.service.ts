import { prisma } from '../../db/prisma'
import { AppError } from '../../utils/errors'
import type { OrderStatus } from '@prisma/client'
import { emitToUser, broadcastToDrivers, createNotification } from '../../realtime/socket'

type CreateOrderItemInput = {
  dishId: string
  cantidad: number
  notas?: string
  selectedOptionItemIds: string[]
}

export async function createOrder(userId: string, input: {
  restaurantId: string
  addressId: string
  metodoPago: 'TARJETA' | 'EFECTIVO' | 'VENTANILLA'
  instrucciones?: string
  items: CreateOrderItemInput[]
}) {
  const restaurant = await prisma.restaurant.findUnique({ where: { id: input.restaurantId } })
  if (!restaurant || restaurant.status !== 'ACTIVO') {
    throw new AppError('El restaurante no está disponible.', 404)
  }
  if (!restaurant.isOpen) {
    throw new AppError('El restaurante está cerrado en este momento.', 409)
  }

  const address = await prisma.address.findUnique({ where: { id: input.addressId } })
  if (!address || address.userId !== userId) {
    throw new AppError('Dirección no encontrada.', 404)
  }

  const config = await prisma.platformConfig.findUnique({ where: { id: 'singleton' } })
  if (!config) {
    throw new AppError('La configuración de la plataforma no está inicializada.', 500)
  }

  const itemsData = []
  let subtotal = 0

  for (const itemInput of input.items) {
    const dish = await prisma.dish.findUnique({
      where: { id: itemInput.dishId },
      include: { optionGroups: { include: { opciones: true } } },
    })

    if (!dish || dish.restaurantId !== restaurant.id) {
      throw new AppError('Uno de los platillos no pertenece a este restaurante.', 400)
    }
    if (!dish.disponible) {
      throw new AppError(`"${dish.nombre}" ya no está disponible.`, 409)
    }

    const allOptionsById = new Map(
      dish.optionGroups.flatMap(g => g.opciones.map(o => [o.id, { ...o, groupId: g.id }] as const))
    )

    const selectedByGroup = new Map<string, string[]>()
    for (const optionId of itemInput.selectedOptionItemIds) {
      const option = allOptionsById.get(optionId)
      if (!option) {
        throw new AppError(`Una opción seleccionada no es válida para "${dish.nombre}".`, 400)
      }
      const list = selectedByGroup.get(option.groupId) ?? []
      list.push(optionId)
      selectedByGroup.set(option.groupId, list)
    }

    for (const group of dish.optionGroups) {
      const selected = selectedByGroup.get(group.id) ?? []
      if (group.obligatoria && selected.length === 0) {
        throw new AppError(`Falta elegir una opción en "${group.titulo}" para "${dish.nombre}".`, 400)
      }
      if (group.tipo === 'RADIO' && selected.length > 1) {
        throw new AppError(`Solo puedes elegir una opción en "${group.titulo}" para "${dish.nombre}".`, 400)
      }
    }

    const selectedOptions = itemInput.selectedOptionItemIds.map(id => allOptionsById.get(id)!)
    const extrasTotal = selectedOptions.reduce((sum, o) => sum + o.extraPrecio, 0)
    const precioUnitarioSnapshot = dish.precio
    const lineTotal = (precioUnitarioSnapshot + extrasTotal) * itemInput.cantidad
    subtotal += lineTotal

    itemsData.push({
      dishId: dish.id,
      nombreSnapshot: dish.nombre,
      precioUnitarioSnapshot,
      cantidad: itemInput.cantidad,
      notas: itemInput.notas,
      extrasTotal,
      opciones: {
        create: selectedOptions.map(o => ({
          optionItemId: o.id,
          labelSnapshot: o.label,
          extraSnapshot: o.extraPrecio,
        })),
      },
    })
  }

  const envio = restaurant.deliveryFee
  const comisionUsuarioFija = config.comisionUsuarioFija
  const comisionRepartidorFija = config.comisionRepartidorFija
  const comisionLocalPorcentaje = config.comisionLocalPorcentaje
  const comisionLocalMonto = Math.round(subtotal * (comisionLocalPorcentaje / 100) * 100) / 100
  const total = Math.round((subtotal + envio + comisionUsuarioFija) * 100) / 100

  const order = await prisma.order.create({
    data: {
      userId,
      restaurantId: restaurant.id,
      estado: 'PENDIENTE',
      subtotal,
      envio,
      comisionUsuarioFija,
      comisionRepartidorFija,
      comisionLocalPorcentaje,
      comisionLocalMonto,
      total,
      metodoPago: input.metodoPago,
      addressId: address.id,
      direccionCalle: address.calle,
      direccionNumero: address.numero,
      direccionColonia: address.colonia,
      direccionCP: address.cp,
      direccionCiudad: address.ciudad,
      direccionReferencias: address.referencias,
      instrucciones: input.instrucciones,
      items: { create: itemsData },
      statusHistory: { create: { estado: 'PENDIENTE' } },
    },
    include: { items: { include: { opciones: true } } },
  })

  // Alerta en vivo al local (LocalPanel la usará para sonido + aparición
  // instantánea, en una parte posterior) + queda en su bandeja de
  // notificaciones para siempre.
  emitToUser(restaurant.ownerId, 'order:new', { orderId: order.id, total: order.total })
  await createNotification(
    restaurant.ownerId,
    'pedido',
    'Nuevo pedido',
    `Tienes un nuevo pedido por $${order.total.toFixed(2)}.`
  )

  return order
}

export async function listMyOrders(userId: string) {
  return prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: { items: true, restaurant: { select: { nombre: true, coverImg: true } } },
  })
}

export async function listMyActiveOrders(userId: string) {
  return prisma.order.findMany({
    where: {
      userId,
      estado: { notIn: ['ENTREGADO', 'CANCELADO', 'RECHAZADO'] },
    },
    orderBy: { createdAt: 'desc' },
    include: { items: true, restaurant: { select: { nombre: true, coverImg: true } } },
  })
}

export async function getOrderDetail(orderId: string, requester: { userId: string; rol: string }) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: { include: { opciones: true } },
      statusHistory: { orderBy: { timestamp: 'asc' } },
      restaurant: { select: { id: true, nombre: true, ownerId: true, coverImg: true, direccion: true } },
      repartidor: { select: { id: true, nombre: true, driverProfile: { select: { ratingPromedio: true } } } },
      user: { select: { id: true, nombre: true, telefono: true } },
    },
  })

  if (!order) {
    throw new AppError('Pedido no encontrado.', 404)
  }

  const esDueño = order.userId === requester.userId
  const esLocalDueño = requester.rol === 'LOCAL' && order.restaurant.ownerId === requester.userId
  const esRepartidorAsignado = requester.rol === 'REPARTIDOR' && order.repartidorId === requester.userId
  const esAdmin = requester.rol === 'ADMIN'

  if (!esDueño && !esLocalDueño && !esRepartidorAsignado && !esAdmin) {
    throw new AppError('Pedido no encontrado.', 404)
  }

  return order
}

export async function cancelOrder(orderId: string, userId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order || order.userId !== userId) {
    throw new AppError('Pedido no encontrado.', 404)
  }
  if (order.estado !== 'PENDIENTE') {
    throw new AppError('Ya no puedes cancelar este pedido, el local ya lo está preparando.', 409)
  }

  const updated = await transitionStatus(orderId, 'CANCELADO')

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: order.restaurantId },
    select: { ownerId: true },
  })
  if (restaurant) {
    emitToUser(restaurant.ownerId, 'order:updated', { orderId, estado: 'CANCELADO' })
    await createNotification(restaurant.ownerId, 'pedido', 'Pedido cancelado', 'El cliente canceló un pedido antes de que lo aceptaras.')
  }

  return updated
}

async function getOwnRestaurantOrderOrThrow(orderId: string, ownerUserId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { restaurant: { select: { ownerId: true } } },
  })
  if (!order || order.restaurant.ownerId !== ownerUserId) {
    throw new AppError('Pedido no encontrado.', 404)
  }
  return order
}

export async function listRestaurantOrders(ownerUserId: string) {
  const restaurant = await prisma.restaurant.findUnique({ where: { ownerId: ownerUserId } })
  if (!restaurant) {
    throw new AppError('No tienes un restaurante asociado a tu cuenta.', 404)
  }
  return prisma.order.findMany({
    where: { restaurantId: restaurant.id },
    orderBy: { createdAt: 'desc' },
    include: { items: true, user: { select: { nombre: true, telefono: true } } },
  })
}

export async function acceptOrder(orderId: string, ownerUserId: string) {
  const order = await getOwnRestaurantOrderOrThrow(orderId, ownerUserId)
  if (order.estado !== 'PENDIENTE') {
    throw new AppError('Este pedido ya fue procesado.', 409)
  }
  const updated = await transitionStatus(orderId, 'ACEPTADO')
  emitToUser(order.userId, 'order:updated', { orderId, estado: 'ACEPTADO' })
  await createNotification(order.userId, 'pedido', 'Pedido aceptado', 'El restaurante aceptó tu pedido y ya lo está preparando.')
  return updated
}

export async function rejectOrder(orderId: string, ownerUserId: string) {
  const order = await getOwnRestaurantOrderOrThrow(orderId, ownerUserId)
  if (order.estado !== 'PENDIENTE') {
    throw new AppError('Este pedido ya fue procesado.', 409)
  }
  const updated = await transitionStatus(orderId, 'RECHAZADO')
  emitToUser(order.userId, 'order:updated', { orderId, estado: 'RECHAZADO' })
  await createNotification(order.userId, 'pedido', 'Pedido rechazado', 'El restaurante no pudo tomar tu pedido esta vez. Cualquier cargo será cancelado.')
  return updated
}

export async function markOrderReady(orderId: string, ownerUserId: string) {
  const order = await getOwnRestaurantOrderOrThrow(orderId, ownerUserId)
  if (order.estado !== 'ACEPTADO') {
    throw new AppError('El pedido debe estar aceptado antes de marcarlo listo.', 409)
  }
  const updated = await transitionStatus(orderId, 'LISTO')

  // Broadcast efímero a todo el pool de repartidores conectados — no se
  // persiste, es solo el aviso instantáneo de "hay algo nuevo que ver".
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: order.restaurantId },
    select: { nombre: true, direccion: true },
  })
  broadcastToDrivers('order:available', {
    orderId,
    restaurantNombre: restaurant?.nombre,
    restaurantDireccion: restaurant?.direccion,
  })

  return updated
}

export async function transitionStatus(orderId: string, estado: OrderStatus, extraData: Record<string, unknown> = {}) {
  return prisma.order.update({
    where: { id: orderId },
    data: {
      estado,
      ...extraData,
      statusHistory: { create: { estado } },
    },
  })
}

export async function rateOrder(
  orderId: string,
  userId: string,
  input: { ratingRestaurant: number; ratingRepartidor?: number; comentario?: string }
) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { restaurant: true },
  })

  if (!order || order.userId !== userId) {
    throw new AppError('Pedido no encontrado.', 404)
  }

  if (order.ratingRestaurant !== null) {
    throw new AppError('Este pedido ya fue calificado.', 409)
  }

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: {
      ratingRestaurant: input.ratingRestaurant,
      ratingRepartidor: input.ratingRepartidor ?? null,
      comentario: input.comentario ?? null,
    },
  })

  const ratedOrders = await prisma.order.findMany({
    where: {
      restaurantId: order.restaurantId,
      ratingRestaurant: { not: null },
    },
    select: { ratingRestaurant: true },
  })

  const totalReviews = ratedOrders.length
  if (totalReviews > 0) {
    const sumRatings = ratedOrders.reduce((sum, o) => sum + (o.ratingRestaurant ?? 0), 0)
    const avg = Math.round((sumRatings / totalReviews) * 10) / 10
    await prisma.restaurant.update({
      where: { id: order.restaurantId },
      data: {
        rating: avg,
        reviews: totalReviews,
      },
    })
  }

  if (order.repartidorId && input.ratingRepartidor !== undefined) {
    const driverRatedOrders = await prisma.order.findMany({
      where: {
        repartidorId: order.repartidorId,
        ratingRepartidor: { not: null },
      },
      select: { ratingRepartidor: true },
    })
    if (driverRatedOrders.length > 0) {
      const sumDriverRatings = driverRatedOrders.reduce((sum, o) => sum + (o.ratingRepartidor ?? 0), 0)
      const avgDriver = Math.round((sumDriverRatings / driverRatedOrders.length) * 10) / 10
      await prisma.driverProfile.updateMany({
        where: { userId: order.repartidorId },
        data: { ratingPromedio: avgDriver },
      })
    }
  }

  return updatedOrder
}

export async function listAvailableOrders() {
  return prisma.order.findMany({
    where: {
      estado: 'LISTO',
      repartidorId: null,
    },
    orderBy: { createdAt: 'desc' },
    include: {
      restaurant: { select: { id: true, nombre: true, direccion: true, coverImg: true } },
      user: { select: { id: true, nombre: true, telefono: true } },
      items: { select: { id: true, nombreSnapshot: true, cantidad: true } },
    },
  })
}

export async function claimOrder(orderId: string, driverUserId: string) {
  // Verificar si el repartidor ya tiene una entrega activa
  const activeExisting = await prisma.order.findFirst({
    where: {
      repartidorId: driverUserId,
      estado: { in: ['REPARTIDOR_ASIGNADO', 'RECOGIDO', 'EN_CAMINO'] },
    },
  })
  if (activeExisting) {
    throw new AppError('Ya tienes una entrega en curso. Complétala antes de tomar otra.', 409)
  }

  // Operación atómica de reclamo
  const updateResult = await prisma.order.updateMany({
    where: {
      id: orderId,
      estado: 'LISTO',
      repartidorId: null,
    },
    data: {
      repartidorId: driverUserId,
      estado: 'REPARTIDOR_ASIGNADO',
    },
  })

  if (updateResult.count === 0) {
    const existing = await prisma.order.findUnique({ where: { id: orderId } })
    if (!existing) {
      throw new AppError('Pedido no encontrado.', 404)
    }
    throw new AppError('Este pedido ya no está disponible.', 409)
  }

  await prisma.orderStatusHistory.create({
    data: {
      orderId,
      estado: 'REPARTIDOR_ASIGNADO',
    },
  })

  const order = await getOrderDetail(orderId, { userId: driverUserId, rol: 'REPARTIDOR' })

  if (order) {
    // Que desaparezca de la pantalla de los DEMÁS repartidores al
    // instante, sin esperar a que su próximo polling descubra el 409.
    broadcastToDrivers('order:claimed', { orderId })
    emitToUser(order.userId, 'order:updated', { orderId, estado: 'REPARTIDOR_ASIGNADO' })
    await createNotification(order.userId, 'pedido', 'Repartidor asignado', 'Un repartidor va en camino a recoger tu pedido.')
  }

  return order
}

export async function markOrderPickedUp(orderId: string, driverUserId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order || order.repartidorId !== driverUserId) {
    throw new AppError('Pedido no encontrado o no asignado a ti.', 404)
  }
  if (order.estado !== 'REPARTIDOR_ASIGNADO') {
    throw new AppError('El pedido no está en espera de ser recogido.', 409)
  }
  await transitionStatus(orderId, 'RECOGIDO')
  return getOrderDetail(orderId, { userId: driverUserId, rol: 'REPARTIDOR' })
}

export async function startOrderDelivery(orderId: string, driverUserId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order || order.repartidorId !== driverUserId) {
    throw new AppError('Pedido no encontrado o no asignado a ti.', 404)
  }
  if (order.estado !== 'RECOGIDO') {
    throw new AppError('El pedido debe estar recogido antes de iniciar camino.', 409)
  }
  await transitionStatus(orderId, 'EN_CAMINO')
  emitToUser(order.userId, 'order:updated', { orderId, estado: 'EN_CAMINO' })
  await createNotification(order.userId, 'pedido', 'Pedido en camino', 'Tu repartidor va en camino a tu dirección.')
  return getOrderDetail(orderId, { userId: driverUserId, rol: 'REPARTIDOR' })
}

export async function deliverOrder(orderId: string, driverUserId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order || order.repartidorId !== driverUserId) {
    throw new AppError('Pedido no encontrado o no asignado a ti.', 404)
  }
  if (order.estado !== 'EN_CAMINO') {
    throw new AppError('El pedido debe estar en camino para poder entregarlo.', 409)
  }

  const updated = await prisma.$transaction(async (tx) => {
    const res = await tx.order.update({
      where: { id: orderId },
      data: {
        estado: 'ENTREGADO',
        statusHistory: { create: { estado: 'ENTREGADO' } },
      },
      include: {
        items: { include: { opciones: true } },
        restaurant: { select: { id: true, nombre: true, direccion: true, coverImg: true } },
        user: { select: { id: true, nombre: true, telefono: true } },
      },
    })

    // Crear DriverEarning con la comisionRepartidorFija del pedido
    await tx.driverEarning.create({
      data: {
        repartidorId: driverUserId,
        orderId: order.id,
        monto: order.comisionRepartidorFija,
      },
    })

    return res
  })

  emitToUser(order.userId, 'order:updated', { orderId, estado: 'ENTREGADO' })
  await createNotification(order.userId, 'pedido', '¡Pedido entregado!', 'Tu pedido fue entregado. ¡Esperamos que lo disfrutes!')

  return updated
}

export async function getActiveDelivery(driverUserId: string) {
  const order = await prisma.order.findFirst({
    where: {
      repartidorId: driverUserId,
      estado: { in: ['REPARTIDOR_ASIGNADO', 'RECOGIDO', 'EN_CAMINO'] },
    },
    include: {
      items: { include: { opciones: true } },
      restaurant: { select: { id: true, nombre: true, direccion: true, coverImg: true } },
      user: { select: { id: true, nombre: true, telefono: true } },
      statusHistory: { orderBy: { timestamp: 'asc' } },
    },
  })
  return order ?? null
}

export async function listDriverDeliveries(driverUserId: string) {
  return prisma.order.findMany({
    where: {
      repartidorId: driverUserId,
      estado: 'ENTREGADO',
    },
    orderBy: { updatedAt: 'desc' },
    include: {
      items: { include: { opciones: true } },
      restaurant: { select: { id: true, nombre: true, direccion: true } },
      user: { select: { id: true, nombre: true, telefono: true } },
      driverEarning: true,
    },
  })
}


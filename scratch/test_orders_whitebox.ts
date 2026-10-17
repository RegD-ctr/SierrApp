import 'dotenv/config'
import { prisma } from '../server/src/db/prisma'
import * as ordersService from '../server/src/modules/orders/orders.service'
import { hashPassword } from '../server/src/utils/password'

async function runWhiteBoxTests() {
  console.log('====================================================================')
  console.log('🧪 INICIANDO PRUEBAS DE CAJA BLANCA (WHITE-BOX) - MÓDULO DE PEDIDOS')
  console.log('====================================================================\n')

  const commonPass = 'ClaveSegura123#'
  const passHash = await hashPassword(commonPass)

  // 1. Preparar usuarios y restaurante de prueba
  console.log('--- [Paso 0] Preparación de datos de prueba ---')

  const clientUser = await prisma.user.upsert({
    where: { email: 'wb.cliente@test.com' },
    update: { rol: 'USUARIO', status: 'ACTIVO', passwordHash: passHash },
    create: {
      email: 'wb.cliente@test.com',
      passwordHash: passHash,
      nombre: 'Cliente Caja Blanca',
      telefono: '2731001111',
      rol: 'USUARIO',
      status: 'ACTIVO',
      emailVerified: true,
    },
  })

  const clientAddress = await prisma.address.upsert({
    where: { id: 'wb-addr-1' },
    update: {},
    create: {
      id: 'wb-addr-1',
      userId: clientUser.id,
      etiqueta: 'Casa',
      calle: 'Av. Las Palmas',
      numero: '123',
      colonia: 'Centro',
      cp: '94100',
      ciudad: 'Huatusco',
      estado: 'Veracruz',
    },
  })

  const restaurantOwner = await prisma.user.upsert({
    where: { email: 'wb.local@test.com' },
    update: { rol: 'LOCAL', status: 'ACTIVO', passwordHash: passHash },
    create: {
      email: 'wb.local@test.com',
      passwordHash: passHash,
      nombre: 'Dueño Local WB',
      telefono: '2731002222',
      rol: 'LOCAL',
      status: 'ACTIVO',
      emailVerified: true,
    },
  })

  const restaurant = await prisma.restaurant.upsert({
    where: { ownerId: restaurantOwner.id },
    update: { status: 'ACTIVO', isOpen: true, nombre: 'Pizzería Napolitana WB', direccion: 'Calle 5 Sur #45' },
    create: {
      ownerId: restaurantOwner.id,
      nombre: 'Pizzería Napolitana WB',
      categoria: 'Pizza',
      direccion: 'Calle 5 Sur #45',
      tiempoEntrega: '25-35 min',
      deliveryFeeTexto: '$25.00',
      deliveryFee: 25,
      coverImg: '',
      status: 'ACTIVO',
      isOpen: true,
    },
  })

  let dish = await prisma.dish.findFirst({ where: { restaurantId: restaurant.id } })
  if (!dish) {
    dish = await prisma.dish.create({
      data: {
        restaurantId: restaurant.id,
        nombre: 'Pizza Margherita Especial WB',
        descripcion: 'Queso mozzarella fresco, albahaca y salsa de tomate.',
        precio: 160,
        disponible: true,
        categoria: 'Pizzas',
      },
    })
  }

  const driver1 = await prisma.user.upsert({
    where: { email: 'wb.driver1@test.com' },
    update: { rol: 'REPARTIDOR', status: 'ACTIVO', passwordHash: passHash },
    create: {
      email: 'wb.driver1@test.com',
      passwordHash: passHash,
      nombre: 'Raúl Repartidor Uno',
      telefono: '2731003333',
      rol: 'REPARTIDOR',
      status: 'ACTIVO',
      emailVerified: true,
    },
  })

  await prisma.driverProfile.upsert({
    where: { userId: driver1.id },
    update: { matricula: 'REP-WB001', tieneVehiculo: true, vehiculo: 'Honda Wave 110 Azul', ratingPromedio: 4.9 },
    create: {
      userId: driver1.id,
      matricula: 'REP-WB001',
      tieneVehiculo: true,
      vehiculo: 'Honda Wave 110 Azul',
      ratingPromedio: 4.9,
    },
  })

  const driver2 = await prisma.user.upsert({
    where: { email: 'wb.driver2@test.com' },
    update: { rol: 'REPARTIDOR', status: 'ACTIVO', passwordHash: passHash },
    create: {
      email: 'wb.driver2@test.com',
      passwordHash: passHash,
      nombre: 'Sofía Repartidora Dos',
      telefono: '2731004444',
      rol: 'REPARTIDOR',
      status: 'ACTIVO',
      emailVerified: true,
    },
  })

  await prisma.driverProfile.upsert({
    where: { userId: driver2.id },
    update: { matricula: 'REP-WB002', tieneVehiculo: true, vehiculo: 'Italika 125cc Negra', ratingPromedio: 5.0 },
    create: {
      userId: driver2.id,
      matricula: 'REP-WB002',
      tieneVehiculo: true,
      vehiculo: 'Italika 125cc Negra',
      ratingPromedio: 5.0,
    },
  })

  // Singleton de configuración de plataforma
  await prisma.platformConfig.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      comisionUsuarioFija: 5,
      comisionRepartidorFija: 20,
      comisionLocalPorcentaje: 10,
    },
  })

  console.log('✅ Datos de prueba creados/verificados correctamente.\n')

  // Limpiar órdenes previas de prueba de estos usuarios
  await prisma.order.deleteMany({
    where: { userId: clientUser.id },
  })

  // -------------------------------------------------------------------------
  // TEST 1: createOrder -> estado PENDIENTE, repartidorId es null
  // -------------------------------------------------------------------------
  console.log('--- [Test 1] Creación de pedido y verificación de estado PENDIENTE ---')
  const order1 = await ordersService.createOrder(clientUser.id, {
    restaurantId: restaurant.id,
    addressId: clientAddress.id,
    metodoPago: 'EFECTIVO',
    items: [
      {
        dishId: dish.id,
        cantidad: 1,
        selectedOptionItemIds: [],
      },
    ],
  })

  if (order1.estado !== 'PENDIENTE') {
    throw new Error(`Esperado estado PENDIENTE pero se obtuvo ${order1.estado}`)
  }
  if (order1.repartidorId !== null) {
    throw new Error(`repartidorId debe ser null en creación, pero es ${order1.repartidorId}`)
  }
  console.log(`✅ [Test 1 Passed] Pedido ${order1.id.slice(0, 8)} creado en estado PENDIENTE y sin repartidor asignado.`)

  // Verificar que NO aparece en listAvailableOrders
  const availBefore = await ordersService.listAvailableOrders()
  const foundBefore = availBefore.some(o => o.id === order1.id)
  if (foundBefore) {
    throw new Error('El pedido PENDIENTE NO debe ser visible para repartidores antes de ser confirmado.')
  }
  console.log('✅ [Test 1.1 Passed] Pedido PENDIENTE no es visible para repartidores.')

  // -------------------------------------------------------------------------
  // TEST 2: acceptOrder -> pasa a ACEPTADO, notificaciones creadas con datos reales
  // -------------------------------------------------------------------------
  console.log('\n--- [Test 2] Confirmación del pedido por el local (acceptOrder) ---')
  const acceptedOrder = await ordersService.acceptOrder(order1.id, restaurantOwner.id)

  if (acceptedOrder.estado !== 'ACEPTADO') {
    throw new Error(`Esperado estado ACEPTADO pero se obtuvo ${acceptedOrder.estado}`)
  }
  console.log(`✅ [Test 2.1 Passed] Pedido ${order1.id.slice(0, 8)} confirmado por el local (estado: ACEPTADO).`)

  // Verificar que se crearon notificaciones para los repartidores activos con local, dirección y número de pedido
  const driverNotif = await prisma.notification.findFirst({
    where: {
      userId: driver1.id,
      tipo: 'pedido',
      titulo: 'Nuevo pedido disponible',
    },
    orderBy: { createdAt: 'desc' },
  })

  if (!driverNotif) {
    throw new Error('No se encontró la notificación creada para el repartidor.')
  }
  const shortOrderId = order1.id.slice(0, 8).toUpperCase()
  if (!driverNotif.mensaje.includes(shortOrderId) || !driverNotif.mensaje.includes(restaurant.nombre) || !driverNotif.mensaje.includes(restaurant.direccion)) {
    throw new Error(`La notificación al repartidor no contiene todos los datos requeridos. Mensaje: "${driverNotif.mensaje}"`)
  }
  console.log(`✅ [Test 2.2 Passed] Notificación al repartidor validada: "${driverNotif.mensaje}"`)

  // Verificar que AHORA SÍ aparece en listAvailableOrders
  const availAfter = await ordersService.listAvailableOrders()
  const foundAfter = availAfter.find(o => o.id === order1.id)
  if (!foundAfter) {
    throw new Error('El pedido ACEPTADO debe aparecer en la lista de disponibles para repartidores.')
  }
  console.log(`✅ [Test 2.3 Passed] Pedido disponible para repartidores con local: "${foundAfter.restaurant.nombre}", dirección: "${foundAfter.restaurant.direccion}".`)

  // -------------------------------------------------------------------------
  // TEST 3: claimOrder -> Primer repartidor reclama el pedido exitosamente
  // -------------------------------------------------------------------------
  console.log('\n--- [Test 3] Reclamo por el primer repartidor (claimOrder) ---')
  const claimedOrder = await ordersService.claimOrder(order1.id, driver1.id)

  if (claimedOrder.repartidorId !== driver1.id) {
    throw new Error(`repartidorId esperado ${driver1.id} pero es ${claimedOrder.repartidorId}`)
  }
  if (claimedOrder.estado !== 'REPARTIDOR_ASIGNADO') {
    throw new Error(`estado esperado REPARTIDOR_ASIGNADO pero es ${claimedOrder.estado}`)
  }
  console.log(`✅ [Test 3.1 Passed] Pedido reclamado por ${driver1.nombre} (estado: ${claimedOrder.estado}).`)

  // -------------------------------------------------------------------------
  // TEST 4: Concurrencia / Segundo repartidor intentando reclamar el mismo pedido
  // -------------------------------------------------------------------------
  console.log('\n--- [Test 4] Prueba de concurrencia: segundo repartidor intenta reclamar ---')
  let secondClaimFailed = false
  try {
    await ordersService.claimOrder(order1.id, driver2.id)
  } catch (err: any) {
    secondClaimFailed = true
    if (err.status !== 409) {
      throw new Error(`Esperado error HTTP 409 pero se obtuvo ${err.status}: ${err.message}`)
    }
    console.log(`✅ [Test 4.1 Passed] Segundo repartidor fue rechazado con 409: "${err.message}".`)
  }
  if (!secondClaimFailed) {
    throw new Error('El segundo repartidor NO debió haber podido reclamar el pedido ya tomado.')
  }

  // -------------------------------------------------------------------------
  // TEST 5: getOrderDetail -> Verificación de datos del repartidor real
  // -------------------------------------------------------------------------
  console.log('\n--- [Test 5] Verificación de getOrderDetail con datos reales del repartidor ---')
  const detail = await ordersService.getOrderDetail(order1.id, { userId: clientUser.id, rol: 'USUARIO' })

  if (!detail.repartidor) {
    throw new Error('detail.repartidor no debe ser null una vez asignado.')
  }
  if (detail.repartidor.nombre !== 'Raúl Repartidor Uno') {
    throw new Error(`Nombre de repartidor incorrecto: ${detail.repartidor.nombre}`)
  }
  if (detail.repartidor.driverProfile?.vehiculo !== 'Honda Wave 110 Azul') {
    throw new Error(`Vehículo del repartidor incorrecto: ${detail.repartidor.driverProfile?.vehiculo}`)
  }
  if (detail.repartidor.driverProfile?.ratingPromedio !== 4.9) {
    throw new Error(`Rating del repartidor incorrecto: ${detail.repartidor.driverProfile?.ratingPromedio}`)
  }
  console.log('✅ [Test 5.1 Passed] getOrderDetail contiene todos los datos reales del conductor:')
  console.log(`   - Nombre: ${detail.repartidor.nombre}`)
  console.log(`   - Vehículo: ${detail.repartidor.driverProfile.vehiculo}`)
  console.log(`   - Calificación: ${detail.repartidor.driverProfile.ratingPromedio} ★`)

  // -------------------------------------------------------------------------
  // TEST 6: Flujo de Rechazo por el Local (rejectOrder)
  // -------------------------------------------------------------------------
  console.log('\n--- [Test 6] Flujo de Rechazo por el Local (rejectOrder) ---')
  const orderToReject = await ordersService.createOrder(clientUser.id, {
    restaurantId: restaurant.id,
    addressId: clientAddress.id,
    metodoPago: 'EFECTIVO',
    items: [{ dishId: dish.id, cantidad: 1, selectedOptionItemIds: [] }],
  })

  // Conteo de notificaciones de repartidor antes del rechazo
  const driverNotifCountBefore = await prisma.notification.count({
    where: { userId: driver1.id, mensaje: { contains: orderToReject.id.slice(0, 8).toUpperCase() } },
  })

  const rejectedOrder = await ordersService.rejectOrder(orderToReject.id, restaurantOwner.id)
  if (rejectedOrder.estado !== 'RECHAZADO') {
    throw new Error(`Esperado estado RECHAZADO pero fue ${rejectedOrder.estado}`)
  }

  // Notificación exclusiva para el cliente
  const clientRejectionNotif = await prisma.notification.findFirst({
    where: {
      userId: clientUser.id,
      tipo: 'pedido',
      titulo: 'Pedido rechazado',
    },
    orderBy: { createdAt: 'desc' },
  })
  if (!clientRejectionNotif) {
    throw new Error('No se encontró la notificación de rechazo para el cliente.')
  }
  console.log(`✅ [Test 6.1 Passed] Notificación al cliente: "${clientRejectionNotif.mensaje}"`)

  // Verificar que NO se crearon notificaciones para los repartidores sobre este pedido
  const driverNotifCountAfter = await prisma.notification.count({
    where: { userId: driver1.id, mensaje: { contains: orderToReject.id.slice(0, 8).toUpperCase() } },
  })
  if (driverNotifCountAfter !== driverNotifCountBefore) {
    throw new Error('NO se debió notificar a los repartidores sobre un pedido rechazado.')
  }
  console.log('✅ [Test 6.2 Passed] Se confirmó que los repartidores NO recibieron ninguna notificación del pedido rechazado.')

  // Verificar que el pedido rechazado NO aparece en listAvailableOrders
  const availAfterReject = await ordersService.listAvailableOrders()
  if (availAfterReject.some(o => o.id === orderToReject.id)) {
    throw new Error('El pedido RECHAZADO no debe aparecer en listAvailableOrders.')
  }
  console.log('✅ [Test 6.3 Passed] El pedido rechazado no aparece en órdenes disponibles.')

  console.log('\n====================================================================')
  console.log('🎉 TODAS LAS PRUEBAS DE CAJA BLANCA PASARON EXITOSAMENTE (6/6)')
  console.log('====================================================================\n')

  await prisma.$disconnect()
}

runWhiteBoxTests().catch(async (err) => {
  console.error('❌ Error en pruebas de caja blanca:', err)
  await prisma.$disconnect()
  process.exit(1)
})


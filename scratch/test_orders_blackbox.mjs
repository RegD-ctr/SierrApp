// scratch/test_orders_blackbox.mjs
const BASE_URL = 'http://localhost:4000/api'

async function request(endpoint, options = {}, token = null) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  let body = null
  const contentType = res.headers.get('content-type')
  if (contentType && contentType.includes('application/json')) {
    body = await res.json()
  } else {
    body = await res.text()
  }

  return { status: res.status, ok: res.ok, body }
}

async function login(email, password, rol) {
  const res = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password, rol }),
  })
  if (!res.ok) {
    throw new Error(`Login failed for ${email} (${rol}): ${res.status} ${JSON.stringify(res.body)}`)
  }
  return res.body.accessToken
}

async function clearActiveDeliveries(driverToken) {
  const activeRes = await request('/orders/me/active-delivery', {}, driverToken)
  if (activeRes.ok && activeRes.body?.id) {
    const oId = activeRes.body.id
    if (activeRes.body.estado === 'REPARTIDOR_ASIGNADO') {
      await request(`/orders/${oId}/picked-up`, { method: 'PATCH' }, driverToken)
      await request(`/orders/${oId}/start-delivery`, { method: 'PATCH' }, driverToken)
      await request(`/orders/${oId}/deliver`, { method: 'PATCH' }, driverToken)
    } else if (activeRes.body.estado === 'RECOGIDO') {
      await request(`/orders/${oId}/start-delivery`, { method: 'PATCH' }, driverToken)
      await request(`/orders/${oId}/deliver`, { method: 'PATCH' }, driverToken)
    } else if (activeRes.body.estado === 'EN_CAMINO') {
      await request(`/orders/${oId}/deliver`, { method: 'PATCH' }, driverToken)
    }
  }
}

async function runBlackBoxTests() {
  console.log('====================================================================')
  console.log('🧪 INICIANDO PRUEBAS DE CAJA NEGRA (BLACK-BOX REST API) - PEDIDOS')
  console.log('====================================================================\n')

  const commonPass = 'ClaveSegura123#'

  console.log('--- [Paso 1] Autenticación de roles vía REST API ---')
  const clientToken = await login('wb.cliente@test.com', commonPass, 'USUARIO')
  const localToken = await login('wb.local@test.com', commonPass, 'LOCAL')
  const driver1Token = await login('wb.driver1@test.com', commonPass, 'REPARTIDOR')
  const driver2Token = await login('wb.driver2@test.com', commonPass, 'REPARTIDOR')
  console.log('✅ Tokens JWT obtenidos exitosamente para Cliente, Local, Repartidor 1 y Repartidor 2.')

  await clearActiveDeliveries(driver1Token)
  await clearActiveDeliveries(driver2Token)
  console.log('✅ Repartidores sin entregas pendientes (estado limpio).\n')

  console.log('--- [Paso 2] Obtención de recursos públicos y direcciones ---')
  const restRes = await request('/restaurants')
  if (!restRes.ok || !Array.isArray(restRes.body) || restRes.body.length === 0) {
    throw new Error('No se pudieron obtener restaurantes.')
  }
  const restaurant = restRes.body.find(r => r.nombre === 'Pizzería Napolitana WB') || restRes.body[0]
  console.log(`✅ Restaurante encontrado: "${restaurant.nombre}" (ID: ${restaurant.id})`)

  // Obtener platos del restaurante
  const restDetailRes = await request(`/restaurants/${restaurant.id}`)
  const dishes = restDetailRes.body.dishes || []
  if (dishes.length === 0) {
    throw new Error('El restaurante no tiene platillos para ordenar.')
  }
  const dish = dishes[0]
  console.log(`✅ Platillo encontrado: "${dish.nombre}" (ID: ${dish.id}, $${dish.precio})`)

  // Obtener dirección del cliente o crear una con POST /api/users/me/addresses
  const addrRes = await request('/users/me/addresses', {}, clientToken)
  let address = addrRes.ok && Array.isArray(addrRes.body) ? addrRes.body.find(a => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(a.id)) : null
  if (!address) {
    const createAddrRes = await request('/users/me/addresses', {
      method: 'POST',
      body: JSON.stringify({
        etiqueta: 'Casa',
        calle: 'Av. Las Palmas',
        numero: '123',
        colonia: 'Centro',
        cp: '94100',
        ciudad: 'Huatusco',
        estado: 'Veracruz',
        predeterminada: true,
      }),
    }, clientToken)
    if (!createAddrRes.ok) {
      throw new Error(`Error creando dirección: ${JSON.stringify(createAddrRes.body)}`)
    }
    address = createAddrRes.body
  }
  console.log(`✅ Dirección de entrega: ${address.calle} #${address.numero}, ${address.colonia} (ID: ${address.id})\n`)

  // -------------------------------------------------------------------------
  // TEST BB-1: Creación de pedido -> PENDIENTE y no visible para repartidores
  // -------------------------------------------------------------------------
  console.log('--- [Test BB-1] Cliente hace el pedido (POST /api/orders) ---')
  const orderCreateRes = await request('/orders', {
    method: 'POST',
    body: JSON.stringify({
      restaurantId: restaurant.id,
      addressId: address.id,
      metodoPago: 'EFECTIVO',
      items: [{ dishId: dish.id, cantidad: 1, selectedOptionItemIds: [] }],
    }),
  }, clientToken)

  if (orderCreateRes.status !== 201) {
    throw new Error(`Error creando pedido: ${orderCreateRes.status} ${JSON.stringify(orderCreateRes.body)}`)
  }
  const orderId = orderCreateRes.body.id
  const shortOrderId = orderId.slice(0, 8).toUpperCase()
  console.log(`✅ Pedido #${shortOrderId} creado con éxito (estado: ${orderCreateRes.body.estado}).`)

  // Verificar detalle para el cliente
  const clientDetailRes = await request(`/orders/${orderId}`, {}, clientToken)
  if (clientDetailRes.body.estado !== 'PENDIENTE') {
    throw new Error(`Estado esperado PENDIENTE pero se obtuvo ${clientDetailRes.body.estado}`)
  }
  if (clientDetailRes.body.repartidor !== null) {
    throw new Error('El pedido PENDIENTE NO debe tener repartidor asignado.')
  }
  console.log('✅ [BB-1.1 Passed] Detalle del pedido en cliente confirma estado PENDIENTE y repartidor es null.')

  // Verificar que repartidores NO ven el pedido en disponibles
  const driverAvailRes1 = await request('/orders/available', {}, driver1Token)
  const isAvailablePrematurely = driverAvailRes1.body.some(o => o.id === orderId)
  if (isAvailablePrematurely) {
    throw new Error('El pedido PENDIENTE NO debe estar disponible para los repartidores.')
  }
  console.log('✅ [BB-1.2 Passed] Repartidor 1 no ve el pedido en su lista de disponibles.\n')

  // -------------------------------------------------------------------------
  // TEST BB-2: Local confirma el pedido -> Estado ACEPTADO, notifica repartidores
  // -------------------------------------------------------------------------
  console.log('--- [Test BB-2] Local confirma el pedido (PATCH /api/orders/:id/accept) ---')
  const localOrdersRes = await request('/orders/restaurant', {}, localToken)
  const localFound = localOrdersRes.body.some(o => o.id === orderId)
  if (!localFound) {
    throw new Error('El local no encontró el nuevo pedido en su lista.')
  }
  console.log(`✅ El restaurante recibió el pedido #${shortOrderId}.`)

  const acceptRes = await request(`/orders/${orderId}/accept`, { method: 'PATCH' }, localToken)
  if (acceptRes.status !== 200) {
    throw new Error(`Error al aceptar pedido: ${acceptRes.status} ${JSON.stringify(acceptRes.body)}`)
  }
  if (acceptRes.body.estado !== 'ACEPTADO') {
    throw new Error(`Estado esperado ACEPTADO pero fue ${acceptRes.body.estado}`)
  }
  console.log(`✅ [BB-2.1 Passed] Pedido aceptado por el restaurante (estado: ${acceptRes.body.estado}).`)

  // Repartidor consulta órdenes disponibles
  const driverAvailRes2 = await request('/orders/available', {}, driver1Token)
  const availableOrder = driverAvailRes2.body.find(o => o.id === orderId)
  if (!availableOrder) {
    throw new Error('El pedido ACEPTADO debe estar disponible para los repartidores.')
  }
  if (!availableOrder.restaurant?.nombre || !availableOrder.restaurant?.direccion) {
    throw new Error('El pedido disponible debe incluir el nombre y la dirección del local.')
  }
  console.log(`✅ [BB-2.2 Passed] Repartidores ven el pedido disponible con datos del local:`)
  console.log(`   - Local: "${availableOrder.restaurant.nombre}"`)
  console.log(`   - Dirección: "${availableOrder.restaurant.direccion}"`)
  console.log(`   - Total: $${availableOrder.total}`)

  // Repartidor consulta sus notificaciones
  const driverNotifRes = await request('/notifications', {}, driver1Token)
  const driverOrderNotif = driverNotifRes.body.find(n => n.mensaje.includes(shortOrderId))
  if (!driverOrderNotif) {
    throw new Error('El repartidor no recibió notificación sobre el nuevo pedido.')
  }
  console.log(`✅ [BB-2.3 Passed] Notificación recibida por Repartidor 1: "${driverOrderNotif.mensaje}"\n`)

  // -------------------------------------------------------------------------
  // TEST BB-3: El primer repartidor que acepta toma el pedido
  // -------------------------------------------------------------------------
  console.log('--- [Test BB-3] El primer repartidor reclama el pedido (PATCH /api/orders/:id/claim) ---')
  const claimRes1 = await request(`/orders/${orderId}/claim`, { method: 'PATCH' }, driver1Token)
  if (claimRes1.status !== 200) {
    throw new Error(`Error al reclamar pedido por Repartidor 1: ${claimRes1.status} ${JSON.stringify(claimRes1.body)}`)
  }
  if (claimRes1.body.estado !== 'REPARTIDOR_ASIGNADO') {
    throw new Error(`Estado esperado REPARTIDOR_ASIGNADO pero fue ${claimRes1.body.estado}`)
  }
  console.log(`✅ [BB-3.1 Passed] Pedido tomado por Repartidor 1 exitosamente (estado: ${claimRes1.body.estado}).\n`)

  // -------------------------------------------------------------------------
  // TEST BB-4: Segundo repartidor intenta tomar el mismo pedido -> 409 Conflict
  // -------------------------------------------------------------------------
  console.log('--- [Test BB-4] Segundo repartidor intenta reclamar el pedido ya tomado ---')
  const claimRes2 = await request(`/orders/${orderId}/claim`, { method: 'PATCH' }, driver2Token)
  if (claimRes2.status !== 409) {
    throw new Error(`Esperado código HTTP 409 pero se recibió ${claimRes2.status}: ${JSON.stringify(claimRes2.body)}`)
  }
  console.log(`✅ [BB-4.1 Passed] Repartidor 2 fue rechazado con HTTP 409 Conflict: "${claimRes2.body.error}".\n`)

  // -------------------------------------------------------------------------
  // TEST BB-5: Cliente consulta el seguimiento y ve los datos REALES del repartidor
  // -------------------------------------------------------------------------
  console.log('--- [Test BB-5] Cliente consulta el seguimiento (GET /api/orders/:id) ---')
  const trackingRes = await request(`/orders/${orderId}`, {}, clientToken)
  if (trackingRes.body.estado !== 'REPARTIDOR_ASIGNADO') {
    throw new Error(`Estado esperado REPARTIDOR_ASIGNADO pero fue ${trackingRes.body.estado}`)
  }
  const repartidor = trackingRes.body.repartidor
  if (!repartidor) {
    throw new Error('El campo repartidor no debe ser null una vez asignado.')
  }
  if (repartidor.nombre !== 'Raúl Repartidor Uno') {
    throw new Error(`Nombre esperado 'Raúl Repartidor Uno' pero se obtuvo '${repartidor.nombre}'`)
  }
  if (!repartidor.driverProfile || repartidor.driverProfile.vehiculo !== 'Honda Wave 110 Azul') {
    throw new Error(`Vehículo del repartidor incorrecto: ${repartidor.driverProfile?.vehiculo}`)
  }
  if (repartidor.driverProfile.ratingPromedio !== 4.9) {
    throw new Error(`Rating esperado 4.9 pero se obtuvo ${repartidor.driverProfile?.ratingPromedio}`)
  }
  console.log('✅ [BB-5.1 Passed] Panel de seguimiento del cliente muestra datos REALES del repartidor:')
  console.log(`   - Nombre: ${repartidor.nombre}`)
  console.log(`   - Vehículo: ${repartidor.driverProfile.vehiculo}`)
  console.log(`   - Calificación: ${repartidor.driverProfile.ratingPromedio} ★\n`)

  // -------------------------------------------------------------------------
  // TEST BB-6: Flujo de Rechazo por el Local
  // -------------------------------------------------------------------------
  console.log('--- [Test BB-6] Flujo de Rechazo por el Local ---')
  // Crear segundo pedido
  const order2Res = await request('/orders', {
    method: 'POST',
    body: JSON.stringify({
      restaurantId: restaurant.id,
      addressId: address.id,
      metodoPago: 'EFECTIVO',
      items: [{ dishId: dish.id, cantidad: 1, selectedOptionItemIds: [] }],
    }),
  }, clientToken)
  const order2Id = order2Res.body.id
  const shortOrder2Id = order2Id.slice(0, 8).toUpperCase()
  console.log(`✅ Segundo pedido #${shortOrder2Id} creado para prueba de rechazo.`)

  // Local rechaza el pedido
  const rejectRes = await request(`/orders/${order2Id}/reject`, { method: 'PATCH' }, localToken)
  if (rejectRes.status !== 200) {
    throw new Error(`Error rechazando pedido: ${rejectRes.status} ${JSON.stringify(rejectRes.body)}`)
  }
  if (rejectRes.body.estado !== 'RECHAZADO') {
    throw new Error(`Estado esperado RECHAZADO pero fue ${rejectRes.body.estado}`)
  }
  console.log(`✅ [BB-6.1 Passed] Pedido rechazado por el restaurante (estado: ${rejectRes.body.estado}).`)

  // Cliente consulta el pedido
  const clientRejectRes = await request(`/orders/${order2Id}`, {}, clientToken)
  if (clientRejectRes.body.estado !== 'RECHAZADO') {
    throw new Error(`Estado en cliente esperado RECHAZADO pero fue ${clientRejectRes.body.estado}`)
  }
  console.log('✅ [BB-6.2 Passed] Cliente verifica que el pedido está marcado como RECHAZADO.')

  // Cliente verifica su notificación de rechazo
  const clientNotifs = await request('/notifications', {}, clientToken)
  const rejectNotif = clientNotifs.body.find(n => n.titulo === 'Pedido rechazado')
  if (!rejectNotif) {
    throw new Error('El cliente no recibió la notificación de pedido rechazado.')
  }
  console.log(`✅ [BB-6.3 Passed] Notificación de rechazo entregada al cliente: "${rejectNotif.mensaje}"`)

  // Repartidor NO debe ver la orden rechazada
  const driverAvailRes3 = await request('/orders/available', {}, driver1Token)
  if (driverAvailRes3.body.some(o => o.id === order2Id)) {
    throw new Error('El pedido RECHAZADO NO debe aparecer para los repartidores.')
  }
  console.log('✅ [BB-6.4 Passed] El pedido rechazado no aparece en órdenes disponibles para repartidores.')

  // Repartidor NO debe haber recibido notificación sobre el pedido rechazado
  const driverNotifRes2 = await request('/notifications', {}, driver1Token)
  const unexpectedNotif = driverNotifRes2.body.find(n => n.mensaje.includes(shortOrder2Id))
  if (unexpectedNotif) {
    throw new Error('Los repartidores NO debieron recibir notificación de un pedido rechazado.')
  }
  console.log('✅ [BB-6.5 Passed] Se confirmó que los repartidores no recibieron ninguna notificación del pedido rechazado.\n')

  console.log('====================================================================')
  console.log('🎉 TODAS LAS PRUEBAS DE CAJA NEGRA (BLACK-BOX) PASARON (6/6)')
  console.log('====================================================================\n')
}

runBlackBoxTests().catch(err => {
  console.error('❌ Error en pruebas de caja negra:', err)
  process.exit(1)
})

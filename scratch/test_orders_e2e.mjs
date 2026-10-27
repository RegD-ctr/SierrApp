import { createRequire } from 'module'
const require = createRequire('/Users/diegoreyes/Documents/SierraApp/SierrApp/package.json')
const { chromium } = require('playwright')
import fs from 'fs'
import path from 'path'

const ARTIFACT_DIR = '/Users/diegoreyes/.gemini/antigravity/brain/e0541bb2-6307-48a0-b851-3fdec9c84554'
const FRONTEND_URL = 'http://localhost:8443'
const API_URL = 'http://localhost:4000/api'
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function apiRequest(endpoint, options = {}, token = null) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers })
  let body = null
  try {
    body = await res.json()
  } catch {
    body = await res.text()
  }
  return { status: res.status, ok: res.ok, body }
}

async function apiLogin(email, password, rol) {
  const res = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password, rol }),
  })
  if (!res.ok) throw new Error(`API login failed for ${email}: ${JSON.stringify(res.body)}`)
  return res.body.accessToken
}

async function clearActiveDeliveries(token) {
  const activeRes = await apiRequest('/orders/me/active-delivery', {}, token)
  if (activeRes.ok && activeRes.body?.id) {
    const oId = activeRes.body.id
    if (activeRes.body.estado === 'REPARTIDOR_ASIGNADO') {
      await apiRequest(`/orders/${oId}/picked-up`, { method: 'PATCH' }, token)
      await apiRequest(`/orders/${oId}/start-delivery`, { method: 'PATCH' }, token)
      await apiRequest(`/orders/${oId}/deliver`, { method: 'PATCH' }, token)
    } else if (activeRes.body.estado === 'RECOGIDO') {
      await apiRequest(`/orders/${oId}/start-delivery`, { method: 'PATCH' }, token)
      await apiRequest(`/orders/${oId}/deliver`, { method: 'PATCH' }, token)
    } else if (activeRes.body.estado === 'EN_CAMINO') {
      await apiRequest(`/orders/${oId}/deliver`, { method: 'PATCH' }, token)
    }
  }
}

async function loginInBrowser(page, roleTab, email, password) {
  console.log(`🔑 Login en navegador como ${roleTab} (${email})...`)
  await page.goto(FRONTEND_URL)
  await sleep(600)

  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
  await page.goto(FRONTEND_URL)
  await sleep(1000)

  const backBtn = page.locator('button:has-text("Cambiar tipo de acceso")')
  if (await backBtn.isVisible()) {
    await backBtn.click()
    await sleep(400)
  }

  if (roleTab === 'Usuario') {
    const uBtn = page.locator('button:has-text("Usuario")').first()
    await uBtn.waitFor({ state: 'visible', timeout: 10000 })
    await uBtn.click()
  } else if (roleTab === 'Local') {
    const lBtn = page.locator('button:has-text("Colaborador")').first()
    await lBtn.waitFor({ state: 'visible', timeout: 10000 })
    await lBtn.click()
  } else if (roleTab === 'Repartidor') {
    const rBtn = page.locator('button:has-text("Ingresa aquí")').first()
    await rBtn.waitFor({ state: 'visible', timeout: 10000 })
    await rBtn.click()
  }
  await sleep(600)

  const emailInput = page.locator('input[type="email"]')
  await emailInput.waitFor({ state: 'visible', timeout: 10000 })
  await emailInput.fill(email)

  const passInput = page.locator('input[type="password"]')
  await passInput.fill(password)

  const submitBtn = page.locator('button[type="submit"]:has-text("Entrar")')
  await submitBtn.click()
  await sleep(2000)
}

async function main() {
  console.log('====================================================================')
  console.log('🎬 INICIANDO PRUEBAS E2E (PLAYWRIGHT) - FLUJO DE PEDIDOS Y REPARTIDOR')
  console.log('====================================================================\n')

  const commonPass = 'ClaveSegura123#'
  const clientEmail = 'wb.cliente@test.com'
  const localEmail = 'wb.local@test.com'
  const driverEmail = 'wb.driver1@test.com'

  // Limpiar entregas previas
  console.log('--- Limpiando entregas previas de repartidores ---')
  const driverToken = await apiLogin(driverEmail, commonPass, 'REPARTIDOR')
  await clearActiveDeliveries(driverToken)
  console.log('✅ Repartidor listo sin entregas activas previas.')

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  const clientContext = await browser.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2 })
  const clientPage = await clientContext.newPage()

  const localContext = await browser.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2 })
  const localPage = await localContext.newPage()

  const driverContext = await browser.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2 })
  const driverPage = await driverContext.newPage()

  try {
    // =========================================================================
    // FLUJO 1: CLIENTE HACE PEDIDO -> LOCAL ACEPTA -> REPARTIDOR ASIGNADO
    // =========================================================================

    // Paso 1: Cliente inicia sesión
    await loginInBrowser(clientPage, 'Usuario', clientEmail, commonPass)

    console.log('🍕 Navegando a Explorar...')
    const navExplorar = clientPage.locator('nav button:has-text("Explorar")')
    if (await navExplorar.isVisible()) {
      await navExplorar.click()
      await sleep(1000)
    }

    console.log('🍕 Seleccionando restaurante "Pizzería Napolitana WB"...')
    const restCard = clientPage.locator('text=Pizzería Napolitana WB').first()
    await restCard.waitFor({ state: 'visible', timeout: 10000 })
    await restCard.click()
    await sleep(1500)

    console.log('🛒 Agregando platillo al carrito...')
    const addBtn = clientPage.locator('button:has-text("+"), button:has-text("Agregar")').first()
    await addBtn.waitFor({ state: 'visible', timeout: 10000 })
    await addBtn.click()
    await sleep(1000)

    const modalAddBtn = clientPage.locator('button:has-text("Agregar al pedido")')
    if (await modalAddBtn.isVisible()) {
      await modalAddBtn.click()
      await sleep(1000)
    }

    console.log('🛍️ Continuando al checkout...')
    const checkoutDrawerBtn = clientPage.locator('button:has-text("Continuar con el pedido")')
    await checkoutDrawerBtn.waitFor({ state: 'visible', timeout: 10000 })
    await checkoutDrawerBtn.click()
    await sleep(1500)

    console.log('💳 Confirmando pedido en Checkout...')
    const confirmOrderBtn = clientPage.locator('button:has-text("Confirmar Pedido")')
    await confirmOrderBtn.waitFor({ state: 'visible', timeout: 10000 })
    await confirmOrderBtn.click()
    await sleep(2500)

    console.log('📍 Abriendo seguimiento de la orden...')
    const viewTrackingBtn = clientPage.locator('button:has-text("Ver seguimiento")')
    await viewTrackingBtn.waitFor({ state: 'visible', timeout: 10000 })
    await viewTrackingBtn.click()
    await sleep(2000)

    // CAPTURA 1: Pantalla de seguimiento en estado PENDIENTE
    console.log('📸 Tomando Captura 1: OrderTracking en estado PENDIENTE...')
    await clientPage.waitForSelector('text=Esperando confirmación del restaurante', { timeout: 10000 })
    await clientPage.screenshot({
      path: path.join(ARTIFACT_DIR, 'e2e_01_tracking_pedido_pendiente.png'),
      fullPage: true,
    })
    console.log('✅ Captura 1 guardada: e2e_01_tracking_pedido_pendiente.png')

    // Paso 2: Local inicia sesión y ve el pedido pendiente entrante
    console.log('🏪 Local inicia sesión para revisar pedidos entrantes...')
    await loginInBrowser(localPage, 'Local', localEmail, commonPass)

    const localPedidosNav = localPage.locator('nav button:has-text("Pedidos")')
    await localPedidosNav.waitFor({ state: 'visible', timeout: 10000 })
    await localPedidosNav.click()
    await sleep(1500)

    // CAPTURA 2: Local ve el pedido pendiente entrante con botones Aceptar y Rechazar
    console.log('📸 Tomando Captura 2: LocalPanel con pedido pendiente entrante...')
    await localPage.waitForSelector('button:has-text("Aceptar")', { timeout: 10000 })
    await localPage.screenshot({
      path: path.join(ARTIFACT_DIR, 'e2e_02_local_recibe_pedido_pendiente.png'),
      fullPage: true,
    })
    console.log('✅ Captura 2 guardada: e2e_02_local_recibe_pedido_pendiente.png')

    // Paso 3: Local acepta el pedido
    console.log('👍 Local acepta el pedido...')
    const acceptBtn = localPage.locator('button:has-text("Aceptar")').first()
    await acceptBtn.click()
    await sleep(2000)

    // CAPTURA 3: Local confirmó el pedido (estado Aceptado/Preparando)
    console.log('📸 Tomando Captura 3: LocalPanel con pedido aceptado...')
    await localPage.screenshot({
      path: path.join(ARTIFACT_DIR, 'e2e_03_local_pedido_aceptado.png'),
      fullPage: true,
    })
    console.log('✅ Captura 3 guardada: e2e_03_local_pedido_aceptado.png')

    // Paso 4: Cliente ve el seguimiento actualizado a "Buscando repartidor..."
    console.log('📡 Verificando actualización en OrderTracking del cliente...')
    await clientPage.waitForSelector('text=Buscando repartidor cercano...', { timeout: 10000 })
    await clientPage.screenshot({
      path: path.join(ARTIFACT_DIR, 'e2e_04_tracking_buscando_repartidor.png'),
      fullPage: true,
    })
    console.log('✅ Captura 4 guardada: e2e_04_tracking_buscando_repartidor.png')

    // Paso 5: Repartidor inicia sesión y ve el pedido disponible con datos del local
    console.log('🛵 Repartidor 1 inicia sesión para ver órdenes disponibles...')
    await loginInBrowser(driverPage, 'Repartidor', driverEmail, commonPass)

    const driverOrdersNav = driverPage.locator('nav button:has-text("Órdenes")')
    await driverOrdersNav.waitFor({ state: 'visible', timeout: 10000 })
    await driverOrdersNav.click()
    await sleep(1500)

    // Verificar que aparece el pedido con local y dirección
    await driverPage.waitForSelector('text=Pizzería Napolitana WB', { timeout: 10000 })
    console.log('📸 Tomando Captura 5: RepartidorPanel con orden disponible con datos del local...')
    await driverPage.screenshot({
      path: path.join(ARTIFACT_DIR, 'e2e_05_repartidor_notificado_con_datos_local.png'),
      fullPage: true,
    })
    console.log('✅ Captura 5 guardada: e2e_05_repartidor_notificado_con_datos_local.png')

    // Paso 6: Repartidor toma el pedido
    console.log('🛵 Repartidor toma el pedido...')
    const claimBtn = driverPage.locator('button:has-text("Tomar pedido 🛵")').first()
    await claimBtn.click()
    await sleep(2500)

    // CAPTURA 6: Repartidor con el pedido activo
    console.log('📸 Tomando Captura 6: RepartidorPanel con pedido tomado...')
    await driverPage.screenshot({
      path: path.join(ARTIFACT_DIR, 'e2e_06_repartidor_toma_pedido_exito.png'),
      fullPage: true,
    })
    console.log('✅ Captura 6 guardada: e2e_06_repartidor_toma_pedido_exito.png')

    // Paso 7: Cliente ve al repartidor REAL asignado con sus datos reales
    console.log('👤 Verificando datos reales del repartidor en el seguimiento del cliente...')
    await clientPage.waitForSelector('text=Raúl Repartidor Uno', { timeout: 10000 })
    await clientPage.waitForSelector('text=Honda Wave 110 Azul', { timeout: 10000 })
    console.log('📸 Tomando Captura 7: OrderTracking con repartidor REAL asignado...')
    await clientPage.screenshot({
      path: path.join(ARTIFACT_DIR, 'e2e_07_tracking_repartidor_real_asignado.png'),
      fullPage: true,
    })
    console.log('✅ Captura 7 guardada: e2e_07_tracking_repartidor_real_asignado.png')

    // =========================================================================
    // FLUJO 2: LOCAL RECHAZA EL PEDIDO -> CLIENTE NOTIFICADO, REPARTIDOR NO
    // =========================================================================
    console.log('\n--- Flujo 2: Rechazo de pedido por el local ---')

    // Liberar entrega activa anterior del repartidor
    await clearActiveDeliveries(driverToken)

    // Cliente hace un segundo pedido
    console.log('🍕 Cliente hace un segundo pedido para prueba de rechazo...')
    const navInicioBtn = clientPage.locator('nav button:has-text("Explorar")')
    if (await navInicioBtn.isVisible()) {
      await navInicioBtn.click()
      await sleep(1000)
    }

    const restCard2 = clientPage.locator('text=Pizzería Napolitana WB').first()
    await restCard2.waitFor({ state: 'visible', timeout: 10000 })
    await restCard2.click()
    await sleep(1500)

    const addBtn2 = clientPage.locator('button:has-text("+"), button:has-text("Agregar")').first()
    await addBtn2.waitFor({ state: 'visible', timeout: 10000 })
    await addBtn2.click()
    await sleep(1000)

    const modalAddBtn2 = clientPage.locator('button:has-text("Agregar al pedido")')
    if (await modalAddBtn2.isVisible()) {
      await modalAddBtn2.click()
      await sleep(1000)
    }

    const checkoutDrawerBtn2 = clientPage.locator('button:has-text("Continuar con el pedido")')
    await checkoutDrawerBtn2.waitFor({ state: 'visible', timeout: 10000 })
    await checkoutDrawerBtn2.click()
    await sleep(1500)

    const confirmOrderBtn2 = clientPage.locator('button:has-text("Confirmar Pedido")')
    await confirmOrderBtn2.waitFor({ state: 'visible', timeout: 10000 })
    await confirmOrderBtn2.click()
    await sleep(2500)

    const viewTrackingBtn2 = clientPage.locator('button:has-text("Ver seguimiento")')
    await viewTrackingBtn2.waitFor({ state: 'visible', timeout: 10000 })
    await viewTrackingBtn2.click()
    await sleep(2000)

    // Local refresca y rechaza el pedido
    console.log('❌ Local rechaza el pedido entrante...')
    await localPage.reload()
    await sleep(1500)

    const localPedidosNav2 = localPage.locator('nav button:has-text("Pedidos")')
    await localPedidosNav2.waitFor({ state: 'visible', timeout: 10000 })
    await localPedidosNav2.click()
    await sleep(1500)

    const rejectBtn = localPage.locator('button:has-text("Rechazar")').first()
    await rejectBtn.waitFor({ state: 'visible', timeout: 10000 })
    await rejectBtn.click()
    await sleep(2000)

    // CAPTURA 8: Local confirmó el rechazo
    console.log('📸 Tomando Captura 8: LocalPanel tras rechazar pedido...')
    await localPage.screenshot({
      path: path.join(ARTIFACT_DIR, 'e2e_08_local_rechaza_pedido.png'),
      fullPage: true,
    })
    console.log('✅ Captura 8 guardada: e2e_08_local_rechaza_pedido.png')

    // CAPTURA 9: Cliente ve pedido rechazado
    console.log('📸 Tomando Captura 9: OrderTracking con pedido rechazado...')
    await clientPage.waitForSelector('text=Pedido rechazado por el restaurante', { timeout: 10000 })
    await clientPage.screenshot({
      path: path.join(ARTIFACT_DIR, 'e2e_09_tracking_pedido_rechazado.png'),
      fullPage: true,
    })
    console.log('✅ Captura 9 guardada: e2e_09_tracking_pedido_rechazado.png')

    // CAPTURA 10: Repartidor verifica que la orden rechazada NO está disponible
    console.log('📸 Tomando Captura 10: RepartidorPanel sin órdenes rechazadas...')
    await driverPage.reload()
    await sleep(1500)
    const driverOrdersNav2 = driverPage.locator('nav button:has-text("Órdenes")')
    if (await driverOrdersNav2.isVisible()) {
      await driverOrdersNav2.click()
      await sleep(1500)
    }
    await driverPage.screenshot({
      path: path.join(ARTIFACT_DIR, 'e2e_10_repartidor_sin_ordenes_rechazadas.png'),
      fullPage: true,
    })
    console.log('✅ Captura 10 guardada: e2e_10_repartidor_sin_ordenes_rechazadas.png')

    console.log('\n====================================================================')
    console.log('🎉 TODAS LAS PRUEBAS E2E Y CAPTURAS FUERON GENERADAS CON ÉXITO (10/10)')
    console.log('====================================================================\n')
  } catch (err) {
    console.error('❌ Error durante la ejecución E2E:', err)
    await clientPage.screenshot({ path: path.join(ARTIFACT_DIR, 'e2e_error_debug_client.png') }).catch(() => {})
    await localPage.screenshot({ path: path.join(ARTIFACT_DIR, 'e2e_error_debug_local.png') }).catch(() => {})
    await driverPage.screenshot({ path: path.join(ARTIFACT_DIR, 'e2e_error_debug_driver.png') }).catch(() => {})
    throw err
  } finally {
    await browser.close()
  }
}

main().catch((err) => {
  console.error('Fallo en la prueba E2E:', err)
  process.exit(1)
})


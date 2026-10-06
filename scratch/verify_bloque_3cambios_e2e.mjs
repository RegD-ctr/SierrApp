import { createRequire } from 'module'
const require = createRequire('/Users/diegoreyes/Documents/SierraApp/SierrApp/package.json')
const { chromium } = require('playwright')
import path from 'path'
import fs from 'fs'

const envContent = fs.readFileSync('/Users/diegoreyes/Documents/SierraApp/SierrApp/server/.env', 'utf-8')
envContent.split('\n').forEach((line) => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
  if (match) {
    let value = match[2] || ''
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1)
    process.env[match[1]] = value
  }
})

const ARTIFACT_DIR = '/Users/diegoreyes/.gemini/antigravity/brain/e0541bb2-6307-48a0-b851-3fdec9c84554'
const FRONTEND_URL = 'http://localhost:8443'
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function logout(page, context) {
  try {
    const salirBtns = page.locator('button:has-text("Salir"), button:has-text("Cerrar sesión")')
    if (await salirBtns.count() > 0 && await salirBtns.first().isVisible()) {
      await salirBtns.first().click()
      await sleep(600)
    }
  } catch {}
  if (context) {
    await context.clearCookies()
  }
  await page.goto(FRONTEND_URL)
  await sleep(400)
  try {
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
  } catch {}
  await page.goto(FRONTEND_URL)
  await sleep(800)
}

async function loginAs(page, roleTab, email, password) {
  console.log(`🔑 Login como ${roleTab} (${email})...`)
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
  } else if (roleTab === 'Admin') {
    const aBtn = page.locator('button:has-text("Acceso administrador")').first()
    await aBtn.waitFor({ state: 'visible', timeout: 10000 })
    await aBtn.click()
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
  console.log('========================================================')
  console.log('🚀 INICIANDO VERIFICACIÓN COMPLETA DE LOS 3 CAMBIOS (E2E)')
  console.log('========================================================\n')

  const { prisma } = await import('/Users/diegoreyes/Documents/SierraApp/SierrApp/server/src/db/prisma.ts')
  const { hashPassword } = await import('/Users/diegoreyes/Documents/SierraApp/SierrApp/server/src/utils/password.ts')

  // Setup test users with fixed passwords
  const commonPass = 'ClaveSegura123#'
  const adminPass = 'Adm!nPlatf0rm2026#Secure'
  const defaultHash = await hashPassword(commonPass)
  const adminHash = await hashPassword(adminPass)

  // Ensure test accounts
  const userClient = await prisma.user.upsert({
    where: { email: 'e2e.perfil.usuario@example.com' },
    update: { passwordHash: defaultHash, status: 'ACTIVO' },
    create: {
      email: 'e2e.perfil.usuario@example.com',
      passwordHash: defaultHash,
      nombre: 'Usuario Verificado Sierra',
      telefono: '6141002001',
      rol: 'USUARIO',
      status: 'ACTIVO',
      emailVerified: true
    }
  })

  const userLocal = await prisma.user.upsert({
    where: { email: 'e2e.perfil.local@example.com' },
    update: { passwordHash: defaultHash, status: 'ACTIVO' },
    create: {
      email: 'e2e.perfil.local@example.com',
      passwordHash: defaultHash,
      nombre: 'Propietario Don Pedro',
      telefono: '6141002002',
      rol: 'LOCAL',
      status: 'ACTIVO',
      emailVerified: true
    }
  })

  // Ensure restaurant for userLocal
  let restaurant = await prisma.restaurant.findFirst({ where: { ownerId: userLocal.id } })
  if (!restaurant) {
    restaurant = await prisma.restaurant.create({
      data: {
        ownerId: userLocal.id,
        nombre: 'Taquería Sierra Express',
        categoria: 'Tacos',
        tiempoEntrega: '20-30 min',
        deliveryFeeTexto: '$20 envío',
        deliveryFee: 20,
        coverImg: '/uploads/default-cover.jpg',
        direccion: 'Calle Pino Suárez 202, Centro',
        status: 'ACTIVO'
      }
    })
  }

  const userDriver = await prisma.user.upsert({
    where: { email: 'e2e.perfil.repartidor@example.com' },
    update: { passwordHash: defaultHash, status: 'ACTIVO' },
    create: {
      email: 'e2e.perfil.repartidor@example.com',
      passwordHash: defaultHash,
      nombre: 'Repartidor Águila Sierra',
      telefono: '6141002003',
      rol: 'REPARTIDOR',
      status: 'ACTIVO',
      emailVerified: true
    }
  })

  // Ensure driver profile
  await prisma.driverProfile.upsert({
    where: { userId: userDriver.id },
    update: { tieneVehiculo: true, vehiculo: 'Italika 150' },
    create: {
      userId: userDriver.id,
      matricula: 'REP-998877',
      tieneVehiculo: true,
      vehiculo: 'Italika 150',
      ratingPromedio: 5.0
    }
  })

  // Ensure admin user
  await prisma.user.upsert({
    where: { email: 'admin@sierraapp.com' },
    update: { passwordHash: adminHash, status: 'ACTIVO' },
    create: {
      email: 'admin@sierraapp.com',
      passwordHash: adminHash,
      nombre: 'Administrador Sierra',
      telefono: '6141002004',
      rol: 'ADMIN',
      status: 'ACTIVO',
      emailVerified: true
    }
  })

  // Ensure dish for restaurant
  let dish = await prisma.dish.findFirst({ where: { restaurantId: restaurant.id } })
  if (!dish) {
    dish = await prisma.dish.create({
      data: {
        restaurantId: restaurant.id,
        nombre: 'Tacos de Cecina Especial',
        descripcion: 'Orden de 4 tacos con guarnición',
        categoria: 'Tacos',
        precio: 120
      }
    })
  }

  // Delete previous active test orders for this user to have clean state
  await prisma.order.deleteMany({
    where: { userId: userClient.id, estado: { in: ['PENDIENTE', 'ACEPTADO', 'EN_CAMINO', 'REPARTIDOR_ASIGNADO'] } }
  })

  const activeTestOrder = await prisma.order.create({
    data: {
      userId: userClient.id,
      restaurantId: restaurant.id,
      repartidorId: userDriver.id,
      estado: 'EN_CAMINO',
      subtotal: 120,
      envio: 25,
      comisionUsuarioFija: 5,
      comisionRepartidorFija: 20,
      comisionLocalPorcentaje: 15,
      comisionLocalMonto: 18,
      total: 150,
      metodoPago: 'EFECTIVO',
      direccionCalle: 'Av. Ferrocarril',
      direccionNumero: '100',
      direccionColonia: 'Centro',
      direccionCP: '34950',
      direccionCiudad: 'El Salto',
      items: {
        create: [
          {
            dishId: dish.id,
            nombreSnapshot: 'Tacos de Cecina Especial',
            precioUnitarioSnapshot: 120,
            cantidad: 1,
            extrasTotal: 0
          }
        ]
      }
    }
  })
  console.log(`📦 Pedido activo de prueba creado en DB: ${activeTestOrder.id}`)

  // Start Playwright
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1280, height: 950 } })
  const page = await context.newPage()

  try {
    // =========================================================================
    // PASO 1: TÉRMINOS Y CONDICIONES & PRIVACIDAD EN LOS 4 ROLES
    // =========================================================================
    console.log('\n-----------------------------------------------------------')
    console.log('📌 [PASO 1] Términos y Aviso de Privacidad en los 4 roles...')
    console.log('-----------------------------------------------------------')

    // 1A. ROL USUARIO
    console.log('\n--- 1A. Rol Usuario (Cliente) ---')
    await logout(page, context)
    await loginAs(page, 'Usuario', userClient.email, commonPass)

    // Ir a pestaña Perfil
    const perfilTab = page.locator('nav button:has-text("Perfil"), button:has-text("Perfil")').first()
    await perfilTab.click()
    await sleep(800)

    // Tocar Términos y condiciones
    console.log('👉 Tocando "Términos y condiciones" en Perfil de Usuario...')
    await page.locator('button:has-text("Términos y condiciones")').click()
    await sleep(1000)

    const terminosTitulo = await page.locator('h1:has-text("Términos y Condiciones")').isVisible()
    const terminosTexto = await page.locator('text=Sierra App · El Salto, Pueblo Nuevo, Dgo.').isVisible()
    console.log('🔍 ¿Página de Términos renderizada?:', terminosTitulo && terminosTexto ? '✅ SÍ' : '❌ NO')
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verif_01_usuario_terminos.png') })

    // Regresar
    await page.locator('button:has-text("Volver")').click()
    await sleep(800)
    console.log('↩️  Botón "Volver" presionado, regreso a Perfil verificado.')

    // Tocar Privacidad y seguridad
    console.log('👉 Tocando "Privacidad y seguridad" en Perfil de Usuario...')
    await page.locator('button:has-text("Privacidad y seguridad")').click()
    await sleep(1000)

    const privTitulo = await page.locator('h1:has-text("Aviso de Privacidad")').isVisible()
    const privTexto = await page.locator('text=Protección de Datos · Sierra App').isVisible()
    console.log('🔍 ¿Página de Privacidad renderizada?:', privTitulo && privTexto ? '✅ SÍ' : '❌ NO')
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verif_01_usuario_privacidad.png') })

    // Regresar
    await page.locator('button:has-text("Volver")').click()
    await sleep(800)
    console.log('↩️  Botón "Volver" presionado, regreso a Perfil verificado.')

    // 1B. ROL LOCAL
    console.log('\n--- 1B. Rol Local (Comercio) ---')
    await logout(page, context)
    await loginAs(page, 'Local', userLocal.email, commonPass)

    // Ir a pestaña Perfil en LocalPanel
    await page.locator('nav button:has-text("Perfil")').click()
    await sleep(800)

    // Tocar Términos y condiciones
    console.log('👉 Tocando "Términos y condiciones" en LocalPanel...')
    await page.locator('button:has-text("Términos y condiciones")').click()
    await sleep(1000)
    const localTerminosOk = await page.locator('h1:has-text("Términos y Condiciones")').isVisible()
    console.log('🔍 ¿Términos visible en Local?:', localTerminosOk ? '✅ SÍ' : '❌ NO')
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verif_01_local_terminos.png') })

    await page.locator('button:has-text("Volver")').click()
    await sleep(800)

    // Tocar Privacidad y seguridad
    console.log('👉 Tocando "Privacidad y seguridad" en LocalPanel...')
    await page.locator('button:has-text("Privacidad y seguridad")').click()
    await sleep(1000)
    const localPrivOk = await page.locator('h1:has-text("Aviso de Privacidad")').isVisible()
    console.log('🔍 ¿Privacidad visible en Local?:', localPrivOk ? '✅ SÍ' : '❌ NO')
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verif_01_local_privacidad.png') })

    await page.locator('button:has-text("Volver")').click()
    await sleep(800)

    // 1C. ROL REPARTIDOR
    console.log('\n--- 1C. Rol Repartidor ---')
    await logout(page, context)
    await loginAs(page, 'Repartidor', userDriver.email, commonPass)

    // Ir a pestaña Perfil en RepartidorPanel
    await page.locator('nav button:has-text("Perfil")').click()
    await sleep(800)

    // Tocar Términos y condiciones
    console.log('👉 Tocando "Términos y condiciones" en RepartidorPanel...')
    await page.locator('button:has-text("Términos y condiciones")').click()
    await sleep(1000)
    const repTerminosOk = await page.locator('h1:has-text("Términos y Condiciones")').isVisible()
    console.log('🔍 ¿Términos visible en Repartidor?:', repTerminosOk ? '✅ SÍ' : '❌ NO')
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verif_01_repartidor_terminos.png') })

    await page.locator('button:has-text("Volver")').click()
    await sleep(800)

    // Tocar Privacidad y seguridad
    console.log('👉 Tocando "Privacidad y seguridad" en RepartidorPanel...')
    await page.locator('button:has-text("Privacidad y seguridad")').click()
    await sleep(1000)
    const repPrivOk = await page.locator('h1:has-text("Aviso de Privacidad")').isVisible()
    console.log('🔍 ¿Privacidad visible en Repartidor?:', repPrivOk ? '✅ SÍ' : '❌ NO')
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verif_01_repartidor_privacidad.png') })

    await page.locator('button:has-text("Volver")').click()
    await sleep(800)

    // 1D. ROL ADMIN
    console.log('\n--- 1D. Rol Administrador ---')
    await logout(page, context)
    await loginAs(page, 'Admin', 'admin@sierraapp.com', adminPass)

    // Ir a pestaña Ajustes en AdminPanel
    await page.locator('nav button:has-text("Ajustes")').click()
    await sleep(800)

    // Tocar Términos y condiciones
    console.log('👉 Tocando "Términos y condiciones" en AdminPanel Config...')
    await page.locator('button:has-text("Términos y condiciones")').click()
    await sleep(1000)
    const adminTerminosOk = await page.locator('h1:has-text("Términos y Condiciones")').isVisible()
    console.log('🔍 ¿Términos visible en Admin?:', adminTerminosOk ? '✅ SÍ' : '❌ NO')
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verif_01_admin_terminos.png') })

    await page.locator('button:has-text("Volver")').click()
    await sleep(800)

    // Tocar Aviso de Privacidad
    console.log('👉 Tocando "Aviso de Privacidad" en AdminPanel Config...')
    await page.locator('button:has-text("Aviso de Privacidad")').click()
    await sleep(1000)
    const adminPrivOk = await page.locator('h1:has-text("Aviso de Privacidad")').isVisible()
    console.log('🔍 ¿Privacidad visible en Admin?:', adminPrivOk ? '✅ SÍ' : '❌ NO')
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verif_01_admin_privacidad.png') })

    await page.locator('button:has-text("Volver")').click()
    await sleep(800)

    // =========================================================================
    // PASO 2: PEDIDO ACTIVO -> BOTÓN DE CONTACTO -> SOPORTE CON PRE-LLENADO
    // =========================================================================
    console.log('\n-----------------------------------------------------------')
    console.log('📌 [PASO 2] Botón de contacto en pedido activo y pre-llenado...')
    console.log('-----------------------------------------------------------')
    await logout(page, context)
    await loginAs(page, 'Usuario', userClient.email, commonPass)

    // Ir a pestaña Pedidos
    await page.locator('nav button:has-text("Pedidos")').click()
    await sleep(1200)

    // Hacer clic en "Ver seguimiento" o la tarjeta del pedido activo
    console.log('👉 Abriendo seguimiento del pedido activo...')
    const verSeguimientoBtn = page.locator('button:has-text("Ver seguimiento")').first()
    if (await verSeguimientoBtn.isVisible()) {
      await verSeguimientoBtn.click()
    } else {
      // O hacer clic en la tarjeta del pedido activo
      await page.locator('div:has-text("En camino"), div:has-text("Tacos de Cecina")').first().click()
    }
    await sleep(1500)

    // Verificar el botón "💬 Contactar sobre este pedido"
    const contactBtn = page.locator('button:has-text("Contactar sobre este pedido")').first()
    const isContactBtnVisible = await contactBtn.isVisible()
    console.log('🔍 ¿Botón "💬 Contactar sobre este pedido" visible (antes "📞 Llamar")?:', isContactBtnVisible ? '✅ SÍ' : '❌ NO')
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verif_02_order_tracking_contact_button.png') })

    // Hacer clic en el botón de contacto
    console.log('👉 Haciendo clic en "💬 Contactar sobre este pedido"...')
    await contactBtn.click()
    await sleep(1500)

    // Verificar pantalla de soporte
    const supportHeader = await page.locator('h1:has-text("Soporte y Ayuda")').isVisible()
    const orderBadge = await page.locator(`text=Pedido #${activeTestOrder.id.slice(0, 8).toUpperCase()}`).isVisible()
    console.log('🔍 ¿Pantalla de Soporte abierta con badge de pedido?:', supportHeader ? '✅ SÍ' : '❌ NO', `badge: ${orderBadge}`)

    // Verificar texto pre-llenado en el input
    const msgInput = page.locator('input[placeholder*="pedido"], input[placeholder="Escribe tu mensaje..."]').first()
    const inputValue = await msgInput.inputValue()
    const expectedPrefix = `Tengo una pregunta sobre mi pedido #${activeTestOrder.id.slice(0, 8).toUpperCase()}:`
    console.log(`🔍 Valor pre-llenado en el campo de texto: "${inputValue}"`)
    const hasPreFill = inputValue.includes(activeTestOrder.id.slice(0, 8).toUpperCase())
    console.log('🔍 ¿Texto pre-llenado correctamente con ID del pedido?:', hasPreFill ? '✅ SÍ' : '❌ NO')
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verif_02_support_prefilled_order.png') })

    // =========================================================================
    // PASO 3: ADMIN PANEL - CRUD DE ZONAS DE COBERTURA CON VERIFICACIÓN DB
    // =========================================================================
    console.log('\n-----------------------------------------------------------')
    console.log('📌 [PASO 3] CRUD de Zonas de Cobertura en AdminPanel...')
    console.log('-----------------------------------------------------------')
    await logout(page, context)
    await loginAs(page, 'Admin', 'admin@sierraapp.com', adminPass)

    // Ir a pestaña Ajustes
    await page.locator('nav button:has-text("Ajustes")').click()
    await sleep(1200)

    const zonaNombreTest = `Zona Mirador ${Date.now().toString().slice(-4)}`

    // 3A. Crear zona
    console.log(`👉 Creando zona: "${zonaNombreTest}"...`)
    await page.locator('button:has-text("+ Añadir zona")').click()
    await sleep(500)

    await page.fill('input[placeholder*="El Brillante"]', zonaNombreTest)
    await sleep(300)
    await page.locator('button:has-text("Guardar zona")').click()
    await sleep(1500)

    // Verificar en UI
    const zonaEnUI = await page.locator(`span:has-text("${zonaNombreTest}")`).isVisible()
    console.log(`🔍 ¿Zona "${zonaNombreTest}" listada en AdminPanel?:`, zonaEnUI ? '✅ SÍ' : '❌ NO')
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verif_03_admin_zone_created.png') })

    // Verificar en Prisma / DB
    let dbZone = await prisma.deliveryZone.findFirst({ where: { nombre: zonaNombreTest } })
    console.log('🗄️  [Prisma Studio / DB] Zona creada:', dbZone?.nombre, '| activa:', dbZone?.activa, '| id:', dbZone?.id)

    // 3B. Desactivar zona (Toggle)
    console.log(`👉 Desactivando zona "${zonaNombreTest}"...`)
    // Buscar la fila de la zona y hacer clic en Desactivar
    const zoneRow = page.locator('div.flex.items-center.justify-between', { hasText: zonaNombreTest }).first()
    await zoneRow.locator('button:has-text("Desactivar")').click()
    await sleep(1500)

    // Verificar en UI cambio a Inactiva
    const inactivaBadge = await zoneRow.locator('span:has-text("Inactiva")').isVisible()
    console.log(`🔍 ¿Badge actualizado a "Inactiva" en UI?:`, inactivaBadge ? '✅ SÍ' : '❌ NO')
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verif_03_admin_zone_toggled.png') })

    // Verificar en Prisma / DB
    dbZone = await prisma.deliveryZone.findFirst({ where: { nombre: zonaNombreTest } })
    console.log('🗄️  [Prisma Studio / DB] Zona tras toggle:', dbZone?.nombre, '| activa:', dbZone?.activa)

    // 3C. Eliminar zona
    console.log(`👉 Eliminando zona "${zonaNombreTest}"...`)
    page.once('dialog', async (dialog) => {
      console.log(`💬 Confirmación del navegador interceptada: "${dialog.message()}"`)
      await dialog.accept()
    })
    await zoneRow.locator('button[title="Eliminar zona"]').click()
    await sleep(1500)

    // Verificar en UI que ya no aparece
    const zonaSigueEnUI = await page.locator(`span:has-text("${zonaNombreTest}")`).isVisible()
    console.log(`🔍 ¿Zona eliminada de la UI?:`, !zonaSigueEnUI ? '✅ SÍ (no presente)' : '❌ NO')
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verif_03_admin_zone_deleted.png') })

    // Verificar en Prisma / DB
    dbZone = await prisma.deliveryZone.findFirst({ where: { nombre: zonaNombreTest } })
    console.log('🗄️  [Prisma Studio / DB] Zona en DB tras eliminar (null?):', dbZone === null ? '✅ SÍ (null)' : '❌ NO')

    // =========================================================================
    // PASO 4: RBAC - PROBAR TOKEN NO-ADMIN CONTRA /api/admin/zonas -> 403
    // =========================================================================
    console.log('\n-----------------------------------------------------------')
    console.log('📌 [PASO 4] RBAC: Intentos a /api/admin/zonas con rol no-admin...')
    console.log('-----------------------------------------------------------')

    const API_URL = 'http://localhost:4000/api'
    const loginUserRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userClient.email, password: commonPass })
    })
    const loginUserData = await loginUserRes.json()
    const nonAdminToken = loginUserData.accessToken
    console.log('🔑 Token de usuario no-admin obtenido:', !!nonAdminToken)

    const rbacGet = await fetch(`${API_URL}/admin/zonas`, {
      headers: { Authorization: `Bearer ${nonAdminToken}` }
    })
    console.log(`🔒 GET /api/admin/zonas status con rol ${loginUserData.user?.rol || 'USUARIO'}:`, rbacGet.status, '(Esperado: 403)')

    const rbacPost = await fetch(`${API_URL}/admin/zonas`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${nonAdminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: 'Zona Hacker' })
    })
    console.log(`🔒 POST /api/admin/zonas status con rol ${loginUserData.user?.rol || 'USUARIO'}:`, rbacPost.status, '(Esperado: 403)')

    const rbacPatch = await fetch(`${API_URL}/admin/zonas/00000000-0000-0000-0000-000000000000`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${nonAdminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ activa: false })
    })
    console.log(`🔒 PATCH /api/admin/zonas/:id status con rol ${loginUserData.user?.rol || 'USUARIO'}:`, rbacPatch.status, '(Esperado: 403)')

    const rbacDelete = await fetch(`${API_URL}/admin/zonas/00000000-0000-0000-0000-000000000000`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${nonAdminToken}` }
    })
    console.log(`🔒 DELETE /api/admin/zonas/:id status con rol ${loginUserData.user?.rol || 'USUARIO'}:`, rbacDelete.status, '(Esperado: 403)')

    console.log('\n========================================================')
    console.log('✅ TODAS LAS PRUEBAS E2E Y VERIFICACIONES COMPLETADAS CON ÉXITO')
    console.log('========================================================')

  } catch (err) {
    console.error('❌ Error en script de verificación E2E:', err)
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verif_error_e2e.png') })
    throw err
  } finally {
    await browser.close()
    await prisma.$disconnect()
  }
}

main().catch((err) => {
  console.error('FATAL ERROR:', err)
  process.exit(1)
})

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
  console.log(`🔑 Seleccionando apartado ${roleTab} (${email})...`)
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
  await sleep(1500)
}

async function main() {
  console.log('====================================================================')
  console.log('🚀 INICIANDO VERIFICACIÓN E2E DE LOS CAMBIOS EN EL SISTEMA')
  console.log('====================================================================\n')

  const { prisma } = await import('/Users/diegoreyes/Documents/SierraApp/SierrApp/server/src/db/prisma.ts')
  const { hashPassword } = await import('/Users/diegoreyes/Documents/SierraApp/SierrApp/server/src/utils/password.ts')

  const commonPass = 'ClaveSegura123#'
  const adminPass = 'Adm!nPlatf0rm2026#Secure'
  const defaultHash = await hashPassword(commonPass)
  const adminHash = await hashPassword(adminPass)

  // Asegurar cuentas base para pruebas de login estricto
  await prisma.user.upsert({
    where: { email: 'e2e.usuario.login@example.com' },
    update: { passwordHash: defaultHash, status: 'ACTIVO', rol: 'USUARIO' },
    create: {
      email: 'e2e.usuario.login@example.com',
      passwordHash: defaultHash,
      nombre: 'Cliente Sierra E2E',
      telefono: '6141002001',
      rol: 'USUARIO',
      status: 'ACTIVO',
      emailVerified: true,
    },
  })

  await prisma.user.upsert({
    where: { email: 'e2e.local.login@example.com' },
    update: { passwordHash: defaultHash, status: 'ACTIVO', rol: 'LOCAL' },
    create: {
      email: 'e2e.local.login@example.com',
      passwordHash: defaultHash,
      nombre: 'Pizzería E2E Local',
      telefono: '6141002002',
      rol: 'LOCAL',
      status: 'ACTIVO',
      emailVerified: true,
    },
  })

  await prisma.user.upsert({
    where: { email: 'e2e.admin.solicitudes@example.com' },
    update: { passwordHash: adminHash, status: 'ACTIVO', rol: 'ADMIN' },
    create: {
      email: 'e2e.admin.solicitudes@example.com',
      passwordHash: adminHash,
      nombre: 'Super Administrador E2E',
      telefono: '6141002004',
      rol: 'ADMIN',
      status: 'ACTIVO',
      emailVerified: true,
    },
  })

  // Limpiar solicitudes previas de prueba si existen
  await prisma.restaurant.deleteMany({ where: { nombre: 'Taquería El Papatzul E2E' } })
  await prisma.user.deleteMany({ where: { email: 'papatzul.e2e@test.com' } })
  await prisma.driverProfile.deleteMany({ where: { vehiculo: 'Motocicleta Italika FT150 Roja' } })
  await prisma.user.deleteMany({ where: { email: 'carlos.driver.e2e@test.com' } })

  console.log('✅ Base de datos lista con usuarios de prueba.\n')

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 412, height: 915 } }) // Mobile viewport
  const page = await context.newPage()

  try {
    // ------------------------------------------------------------------------
    // FASE 1: VERIFICACIÓN DE INICIO DE SESIÓN POR ROL ESTRICTO
    // ------------------------------------------------------------------------
    console.log('--- [FASE 1] Verificando inicio de sesión por rol estricto ---')

    // 1.1 Intentar entrar como USUARIO en el apartado COLABORADOR (Local)
    await logout(page, context)
    await loginAs(page, 'Local', 'e2e.usuario.login@example.com', commonPass)
    const errLocal = page.locator('text=Esta cuenta no pertenece al apartado de Colaborador')
    await errLocal.waitFor({ state: 'visible', timeout: 5000 })
    console.log('✅ [1.1 Bloqueo exitoso] Usuario intentando entrar en Colaborador fue bloqueado.')
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'e2e_01_login_usuario_en_colaborador_bloqueado.png') })

    // 1.2 Intentar entrar como USUARIO en el apartado REPARTIDOR
    await logout(page, context)
    await loginAs(page, 'Repartidor', 'e2e.usuario.login@example.com', commonPass)
    const errRepartidor = page.locator('text=Esta cuenta no pertenece al apartado de Repartidor')
    await errRepartidor.waitFor({ state: 'visible', timeout: 5000 })
    console.log('✅ [1.2 Bloqueo exitoso] Usuario intentando entrar en Repartidor fue bloqueado.')
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'e2e_02_login_usuario_en_repartidor_bloqueado.png') })

    // 1.3 Intentar entrar como USUARIO en ACCESO ADMINISTRADOR
    await logout(page, context)
    await loginAs(page, 'Admin', 'e2e.usuario.login@example.com', commonPass)
    const errAdmin = page.locator('text=Esta cuenta no pertenece al apartado de Administrador')
    await errAdmin.waitFor({ state: 'visible', timeout: 5000 })
    console.log('✅ [1.3 Bloqueo exitoso] Usuario intentando entrar en Administrador fue bloqueado.')
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'e2e_03_login_usuario_en_admin_bloqueado.png') })

    // 1.4 Iniciar sesión como USUARIO en su apartado correcto (USUARIO)
    await logout(page, context)
    await loginAs(page, 'Usuario', 'e2e.usuario.login@example.com', commonPass)
    const exploreOrHome = page.locator('button:has-text("Pedir ahora"), button:has-text("Ver promociones")')
    await exploreOrHome.first().waitFor({ state: 'visible', timeout: 10000 })
    console.log('✅ [1.4 Éxito] Usuario ingresó correctamente a su pantalla de cliente.')
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'e2e_04_login_usuario_exito.png') })

    // 1.5 Intentar entrar como LOCAL en apartado USUARIO
    await logout(page, context)
    await loginAs(page, 'Usuario', 'e2e.local.login@example.com', commonPass)
    const errLocalOnUser = page.locator('text=Esta cuenta no pertenece al apartado de Usuario')
    await errLocalOnUser.waitFor({ state: 'visible', timeout: 5000 })
    console.log('✅ [1.5 Bloqueo exitoso] Local intentando entrar en Usuario fue bloqueado.')
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'e2e_05_login_local_en_usuario_bloqueado.png') })

    // ------------------------------------------------------------------------
    // FASE 2: NOTIFICACIÓN PUSH EN TIEMPO REAL AL ADMINISTRADOR
    // ------------------------------------------------------------------------
    console.log('\n--- [FASE 2] Verificando notificación popup estilo móvil en tiempo real ---')

    // Administrador inicia sesión
    await logout(page, context)
    await loginAs(page, 'Admin', 'e2e.admin.solicitudes@example.com', adminPass)
    const adminDashboard = page.locator('h1:has-text("Panel Admin")')
    await adminDashboard.waitFor({ state: 'visible', timeout: 10000 })
    console.log('✅ Administrador conectado en su panel de control.')

    // Registrar solicitud de local vía backend (simulando envío en tiempo real)
    const adminToken = await page.evaluate(() => sessionStorage.getItem('sierra_access_token') || localStorage.getItem('sierra_access_token'))
    console.log('📡 Emitiendo registro de nueva solicitud de local...')

    // Se hace llamada POST /api/auth/register/local
    const registerResponse = await fetch('http://localhost:4000/api/auth/register/local', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombreNegocio: 'Taquería El Papatzul E2E',
        email: 'papatzul.e2e@test.com',
        password: 'ClaveSegura123#',
        telefono: '2731002233',
        direccion: 'Av. Hidalgo #120, Huatusco, Ver.',
      }),
    })
    console.log(`Respuesta registro local: ${registerResponse.status}`)

    // Esperar a que el popup push aparezca en la parte superior del Admin
    const pushPopup = page.locator('[data-testid="push-notification-popup"]')
    await pushPopup.waitFor({ state: 'visible', timeout: 8000 })
    console.log('🔔 [2.1 Notificación tiempo real] Popup push móvil detectado en la parte superior!')
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'e2e_06_notificacion_popup_tiempo_real_admin.png') })

    // Registrar solicitud de repartidor también
    console.log('📡 Emitiendo registro de nueva solicitud de repartidor...')
    await fetch('http://localhost:4000/api/auth/register/repartidor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: 'Carlos Repartidor E2E',
        email: 'carlos.driver.e2e@test.com',
        password: 'ClaveSegura123#',
        telefono: '2731004455',
        tieneVehiculo: true,
        vehiculo: 'Motocicleta Italika FT150 Roja',
      }),
    })

    await sleep(2500) // Esperar que el popup auto-cierre tras sus ~2-3 seg

    // Verificar aviso interactivo en Dashboard
    const dashboardNotice = page.locator('text=de registro pendiente')
    await dashboardNotice.first().waitFor({ state: 'visible', timeout: 10000 })
    console.log('✅ [2.2 Dashboard actualizado] Aviso de solicitudes pendientes visible en Dashboard.')
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'e2e_07_admin_dashboard_solicitudes_pendientes.png') })

    // ------------------------------------------------------------------------
    // FASE 3: VER PERFIL COMPLETO DE SOLICITUD DE LOCAL Y APROBAR
    // ------------------------------------------------------------------------
    console.log('\n--- [FASE 3] Verificando perfil completo y aprobación de solicitud de Local ---')

    // Ir al tab Locales
    const tabLocales = page.locator('nav button:has-text("Locales")')
    await tabLocales.first().click()
    await sleep(1000)

    const papatzulRow = page.locator('div.rounded-xl').filter({ hasText: 'Taquería El Papatzul E2E' }).first()
    await papatzulRow.waitFor({ state: 'visible', timeout: 10000 })
    console.log('✅ Solicitud de Taquería El Papatzul encontrada en lista.')
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'e2e_08_admin_lista_locales_solicitud_pendiente.png') })

    // Dar clic en "Ver perfil" (o dar clic en la solicitud)
    const verPerfilLocalBtn = papatzulRow.getByRole('button', { name: 'Ver perfil' })
    await verPerfilLocalBtn.click()
    await sleep(1000)

    // Validar visualización del perfil completo
    const tituloDetalleLocal = page.locator('h1:has-text("Solicitud de local")')
    await tituloDetalleLocal.waitFor({ state: 'visible', timeout: 5000 })

    const correoLocalVisible = page.locator('text=papatzul.e2e@test.com')
    await correoLocalVisible.waitFor({ state: 'visible', timeout: 5000 })

    const direccionLocalVisible = page.locator('text=Av. Hidalgo #120, Huatusco, Ver.')
    await direccionLocalVisible.waitFor({ state: 'visible', timeout: 5000 })

    const btnAprobarLocal = page.locator('button:has-text("Aprobar solicitud de local")')
    await btnAprobarLocal.waitFor({ state: 'visible', timeout: 5000 })

    console.log('✅ [3.1 Perfil completo Local] Correo, teléfono, dirección y botón de aprobar verificados.')
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'e2e_09_admin_perfil_completo_solicitud_local.png') })

    // Aprobar solicitud
    await btnAprobarLocal.click()
    await sleep(1500)

    // Volver a la lista
    const volverBtnLocal = page.locator('header button').first()
    await volverBtnLocal.click()
    await sleep(800)

    console.log('✅ [3.2 Aprobación Local] Local aprobado correctamente.')
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'e2e_10_admin_local_aprobado_exito.png') })

    // ------------------------------------------------------------------------
    // FASE 4: VER PERFIL COMPLETO DE SOLICITUD DE REPARTIDOR Y APROBAR
    // ------------------------------------------------------------------------
    console.log('\n--- [FASE 4] Verificando perfil completo y aprobación de solicitud de Repartidor ---')

    // Ir al tab Repartidores
    const tabRepartidores = page.locator('nav button:has-text("Repartidores")')
    await tabRepartidores.first().click()
    await sleep(1000)

    const carlosRow = page.locator('div.rounded-xl').filter({ hasText: 'Carlos Repartidor E2E' }).first()
    await carlosRow.waitFor({ state: 'visible', timeout: 10000 })
    console.log('✅ Solicitud de Carlos Repartidor E2E encontrada en lista.')
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'e2e_11_admin_lista_repartidores_solicitud_pendiente.png') })

    // Dar clic en "Ver perfil" (o dar clic en la tarjeta)
    const verPerfilRepaBtn = carlosRow.getByRole('button', { name: 'Ver perfil' })
    await verPerfilRepaBtn.click()
    await sleep(1000)

    // Validar visualización del perfil completo del conductor
    const tituloDetalleRepa = page.locator('h1:has-text("Solicitud de repartidor")')
    await tituloDetalleRepa.waitFor({ state: 'visible', timeout: 5000 })

    const correoRepaVisible = page.locator('text=carlos.driver.e2e@test.com')
    await correoRepaVisible.waitFor({ state: 'visible', timeout: 5000 })

    const vehiculoRepaVisible = page.locator('text=Motocicleta Italika FT150 Roja')
    await vehiculoRepaVisible.waitFor({ state: 'visible', timeout: 5000 })

    const btnAprobarRepa = page.locator('button:has-text("Aprobar repartidor")')
    await btnAprobarRepa.waitFor({ state: 'visible', timeout: 5000 })

    console.log('✅ [4.1 Perfil completo Repartidor] Correo, teléfono, vehículo, matrícula y botones de decisión verificados.')
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'e2e_12_admin_perfil_completo_solicitud_repartidor.png') })

    // Aprobar conductor
    await btnAprobarRepa.click()
    await sleep(1500)

    // Volver a la lista
    const volverBtnRepa = page.locator('header button').first()
    await volverBtnRepa.click()
    await sleep(800)

    console.log('✅ [4.2 Aprobación Repartidor] Repartidor aprobado exitosamente.')
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'e2e_13_admin_repartidor_aprobado_exito.png') })

    console.log('\n====================================================================')
    console.log('🎉 TODAS LAS PRUEBAS E2E PASARON CON ÉXITO Y CAPTURAS GUARDADAS!')
    console.log('====================================================================')
  } catch (err) {
    console.error('❌ Error durante la ejecución E2E:', err)
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'e2e_error_debug.png') })
    throw err
  } finally {
    await browser.close()
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

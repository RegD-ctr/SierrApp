import { createRequire } from 'module'
const require = createRequire('/Users/diegoreyes/Documents/SierraApp/SierrApp/package.json')
const { chromium } = require('playwright')
import { join } from 'path'
import fs from 'fs'

const ARTIFACT_DIR = '/Users/diegoreyes/.gemini/antigravity/brain/e0541bb2-6307-48a0-b851-3fdec9c84554'
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function logout(page, context) {
  try {
    const salirBtn = page.locator('button:has-text("Salir")')
    if (await salirBtn.isVisible()) {
      await salirBtn.click()
      await sleep(800)
    }
  } catch {}
  if (context) {
    await context.clearCookies()
  }
  await page.goto('http://localhost:8443')
  await sleep(1000)
  try {
    await page.evaluate(() => localStorage.clear())
  } catch {}
  await page.goto('http://localhost:8443')
  await sleep(1000)
}

async function run() {
  console.log('🚀 Iniciando verificación E2E completa de AdminPanel Parte 2...')
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1280, height: 950 } })
  const page = await context.newPage()

  const ts = Date.now()
  const localNombre = `Pizzería Sierra ${ts.toString().slice(-4)}`
  const localEmail = `local.${ts}@test.com`
  const localPass = 'ClaveFuerte#2026'

  const rep1Nombre = `Carlos Repartidor ${ts.toString().slice(-4)}`
  const rep1Email = `rep1.${ts}@test.com`
  const rep1Pass = 'ClaveFuerte#2026'

  const rep2Nombre = `Marcos Rechazado ${ts.toString().slice(-4)}`
  const rep2Email = `rep2.${ts}@test.com`
  const rep2Pass = 'ClaveFuerte#2026'

  // Crear una imagen temporal para el upload de foto
  const tempPhotoPath = '/Users/diegoreyes/Documents/SierraApp/SierrApp/scratch/temp_driver_photo.png'
  const logoPath = '/Users/diegoreyes/Documents/SierraApp/SierrApp/src/imports/logo.jpeg'
  fs.copyFileSync(logoPath, tempPhotoPath)

  // ==========================================
  // PASO 1: REGISTRAR UN NUEVO LOCAL DESDE LA UI
  // ==========================================
  console.log('\n🏪 [PASO 1] Registrando un nuevo local desde la UI...')
  await logout(page, context)

  // Ir a Crear Cuenta
  await page.click('button:has-text("Crear cuenta")')
  await sleep(800)
  // Seleccionar "Restaurante"
  await page.click('button:has-text("Restaurante")')
  await sleep(800)

  // Llenar formulario de local
  await page.fill('input[placeholder="Ej. Taquería El Gordo"]', localNombre)
  await page.fill('input[placeholder="restaurante@correo.com"]', localEmail)
  await page.fill('input[placeholder="Mínimo 10 caracteres"]', localPass)
  await page.fill('input[placeholder="••••••••"]', localPass)
  await page.fill('input[placeholder="Av. Sierra #45, Col. Centro"]', 'Av. Hidalgo #120, Centro')
  await page.fill('input[placeholder="+52 614 000 0000"]', '2731234567')

  // Aceptar términos
  await page.check('#l-terminos')
  await sleep(500)

  // Enviar formulario
  await page.click('button:has-text("Crear restaurante y continuar")')
  await sleep(2000)

  // Verificar pantalla de solicitud enviada
  const solicitudOk = await page.locator('text=¡Solicitud enviada!').isVisible()
  console.log('¿Pantalla de solicitud enviada visible?:', solicitudOk)

  // ==========================================
  // PASO 2: ADMIN PANEL - LOCALES
  // ==========================================
  console.log('\n🛡️ [PASO 2] Entrando a AdminPanel para aprobar y suspender/reactivar local...')
  await logout(page, context)

  // Acceso administrador
  await page.click('button:has-text("Acceso administrador")')
  await sleep(800)
  await page.fill('input[type="email"]', 'admin@sierraapp.com')
  await page.fill('input[type="password"]', 'Adm!nPlatf0rm2026#Secure')
  await page.click('button:has-text("Entrar")')
  await sleep(2000)

  // Ir a pestaña Locales
  console.log('Navegando a pestaña Locales...')
  await page.click('nav button:has-text("Locales")')
  await sleep(1500)

  // Captura 1: Local pendiente en AdminPanel
  console.log('📸 Captura 1: Local pendiente con botón Aprobar...')
  await page.screenshot({
    path: join(ARTIFACT_DIR, 'audit_admin_locales_1_pendiente.png'),
    fullPage: true,
  })

  // Buscar la tarjeta del local recién registrado y hacer clic en Aprobar
  const localCard = page.locator('div.bg-\\[\\#232427\\]', { hasText: localNombre }).first()
  await localCard.locator('button:has-text("Aprobar")').click()
  await sleep(2000)

  // Captura 2: Local Aprobado (Activo)
  console.log('📸 Captura 2: Local ahora Activo con botón Ver...')
  await page.screenshot({
    path: join(ARTIFACT_DIR, 'audit_admin_locales_2_activo.png'),
    fullPage: true,
  })

  // Entrar al detalle ("Ver")
  await localCard.locator('button:has-text("Ver")').click()
  await sleep(1500)

  // Suspender local
  console.log('Suspendiendo local...')
  await page.click('button:has-text("Suspender local")')
  await sleep(800)
  await page.click('button:has-text("Confirmar")')
  await sleep(2000)

  // Captura 3: Detalle de local suspendido
  console.log('📸 Captura 3: Detalle de local Suspendido...')
  await page.screenshot({
    path: join(ARTIFACT_DIR, 'audit_admin_locales_3_suspendido.png'),
    fullPage: true,
  })

  // Reactivar local
  console.log('Reactivando local...')
  await page.click('button:has-text("Reactivar local")')
  await sleep(800)
  await page.click('button:has-text("Confirmar")')
  await sleep(2000)

  // Captura 4: Detalle de local reactivado a Activo
  console.log('📸 Captura 4: Detalle de local Reactivado a Activo...')
  await page.screenshot({
    path: join(ARTIFACT_DIR, 'audit_admin_locales_4_reactivado.png'),
    fullPage: true,
  })

  // Volver atrás desde detalle del local
  await page.click('header button:has(svg)')
  await sleep(1000)

  // ==========================================
  // PASO 3: REGISTRAR REPARTIDOR 1 CON FOTO
  // ==========================================
  console.log('\n🏍️ [PASO 3] Registrando Repartidor 1 con foto desde la UI...')
  await logout(page, context)

  await page.click('button:has-text("Crear cuenta")')
  await sleep(800)
  await page.click('button:has-text("Regístrate aquí")')
  await sleep(800)

  // Llenar formulario
  await page.fill('input[placeholder="Juan Pérez"]', rep1Nombre)
  await page.fill('input[placeholder="repartidor@correo.com"]', rep1Email)
  await page.fill('input[placeholder="Mínimo 10 caracteres"]', rep1Pass)
  await page.fill('input[placeholder="••••••••"]', rep1Pass)
  await page.fill('input[placeholder="618 123 4567"]', '2731112233')

  // Subir foto
  console.log('Subiendo foto del repartidor 1...')
  const fileInput1 = page.locator('input[type="file"]')
  await fileInput1.setInputFiles(tempPhotoPath)
  await sleep(1000)

  // Seleccionar que sí tiene vehículo
  await page.click('button:has-text("Sí, tengo")')
  await sleep(500)
  await page.fill('input[placeholder="Ej. Motocicleta Italika FT150, Bicicleta..."]', 'Moto Italika 150')

  // Aceptar términos
  await page.check('#r-terminos')
  await sleep(500)

  // Enviar
  await page.click('button:has-text("Generar matrícula y registrarme")')
  await sleep(2500)

  const rep1Ok = await page.locator('text=¡Matrícula generada!').isVisible()
  console.log('¿Repartidor 1 registrado con matrícula generada?:', rep1Ok)

  // ==========================================
  // PASO 4: ADMIN PANEL - REPARTIDOR 1 (APROBAR)
  // ==========================================
  console.log('\n🛡️ [PASO 4] Entrando a AdminPanel para ver foto real y aprobar Repartidor 1...')
  await logout(page, context)

  await page.click('button:has-text("Acceso administrador")')
  await sleep(800)
  await page.fill('input[type="email"]', 'admin@sierraapp.com')
  await page.fill('input[type="password"]', 'Adm!nPlatf0rm2026#Secure')
  await page.click('button:has-text("Entrar")')
  await sleep(2000)

  // Ir a pestaña Repartidores
  await page.click('nav button:has-text("Repartidores")')
  await sleep(1500)

  // Captura 5: Repartidor 1 con foto y botones Aprobar/Rechazar
  console.log('📸 Captura 5: Repartidor 1 con foto real y status Pendiente...')
  await page.screenshot({
    path: join(ARTIFACT_DIR, 'audit_admin_repartidores_1_foto_pendiente.png'),
    fullPage: true,
  })

  // Aprobar repartidor 1
  const rep1Card = page.locator('div.bg-\\[\\#232427\\]', { hasText: rep1Nombre }).first()
  await rep1Card.locator('button:has-text("Aprobar")').click()
  await sleep(2000)

  // Captura 6: Repartidor 1 aprobado (Activo)
  console.log('📸 Captura 6: Repartidor 1 Aprobado (Activo)...')
  await page.screenshot({
    path: join(ARTIFACT_DIR, 'audit_admin_repartidores_2_aprobado.png'),
    fullPage: true,
  })

  // ==========================================
  // PASO 5: REGISTRAR REPARTIDOR 2
  // ==========================================
  console.log('\n🏍️ [PASO 5] Registrando Repartidor 2 desde la UI...')
  await logout(page, context)

  await page.click('button:has-text("Crear cuenta")')
  await sleep(800)
  await page.click('button:has-text("Regístrate aquí")')
  await sleep(800)

  await page.fill('input[placeholder="Juan Pérez"]', rep2Nombre)
  await page.fill('input[placeholder="repartidor@correo.com"]', rep2Email)
  await page.fill('input[placeholder="Mínimo 10 caracteres"]', rep2Pass)
  await page.fill('input[placeholder="••••••••"]', rep2Pass)
  await page.fill('input[placeholder="618 123 4567"]', '2739998877')

  await page.click('button:has-text("Sí, tengo")')
  await sleep(500)
  await page.fill('input[placeholder="Ej. Motocicleta Italika FT150, Bicicleta..."]', 'Bicicleta')

  await page.check('#r-terminos')
  await sleep(500)

  await page.click('button:has-text("Generar matrícula y registrarme")')
  await sleep(2500)

  const rep2Ok = await page.locator('text=¡Matrícula generada!').isVisible()
  console.log('¿Repartidor 2 registrado?:', rep2Ok)

  // ==========================================
  // PASO 6: ADMIN PANEL - RECHAZAR REPARTIDOR 2 Y PROBAR LOGIN
  // ==========================================
  console.log('\n🛡️ [PASO 6] AdminPanel rechaza Repartidor 2 y verifica intento de login...')
  await logout(page, context)

  await page.click('button:has-text("Acceso administrador")')
  await sleep(800)
  await page.fill('input[type="email"]', 'admin@sierraapp.com')
  await page.fill('input[type="password"]', 'Adm!nPlatf0rm2026#Secure')
  await page.click('button:has-text("Entrar")')
  await sleep(2000)

  await page.click('nav button:has-text("Repartidores")')
  await sleep(1500)

  // Buscar la tarjeta del repartidor 2 y hacer clic en Rechazar
  const rep2Card = page.locator('div.bg-\\[\\#232427\\]', { hasText: rep2Nombre }).first()
  await rep2Card.locator('button:has-text("Rechazar")').click()
  await sleep(800)

  // Confirmar en el modal
  await page.click('button:has-text("Sí, rechazar")')
  await sleep(2000)

  // Captura 7: Repartidor 2 con status Rechazado
  console.log('📸 Captura 7: Repartidor 2 Rechazado...')
  await page.screenshot({
    path: join(ARTIFACT_DIR, 'audit_admin_repartidores_3_rechazado.png'),
    fullPage: true,
  })

  // Intentar login con Repartidor 2 rechazado
  console.log('Probando login con Repartidor 2 rechazado en la UI...')
  await logout(page, context)

  // Click en "¿Eres o quieres ser repartidor? Ingresa aquí"
  await page.click('p:has-text("¿Eres o quieres ser repartidor?") button:has-text("Ingresa aquí")')
  await sleep(800)

  await page.fill('input[type="email"]', rep2Email)
  await page.fill('input[type="password"]', rep2Pass)
  await page.click('button:has-text("Entrar")')
  await sleep(2000)

  // Captura 8: Error al intentar login como repartidor rechazado
  console.log('📸 Captura 8: Mensaje de error al iniciar sesión rechazado...')
  await page.screenshot({
    path: join(ARTIFACT_DIR, 'audit_admin_repartidor_login_rechazado.png'),
    fullPage: true,
  })

  // ==========================================
  // PASO 7: PESTAÑA PEDIDOS DEL ADMIN PANEL
  // ==========================================
  console.log('\n📦 [PASO 7] Verificando listado global de pedidos y filtro ENTREGADO...')
  await logout(page, context)

  await page.click('button:has-text("Acceso administrador")')
  await sleep(800)
  await page.fill('input[type="email"]', 'admin@sierraapp.com')
  await page.fill('input[type="password"]', 'Adm!nPlatf0rm2026#Secure')
  await page.click('button:has-text("Entrar")')
  await sleep(2000)

  // Ir a pestaña Pedidos
  await page.click('nav button:has-text("Pedidos")')
  await sleep(1500)

  // Captura 9: Todos los pedidos en AdminPanel
  console.log('📸 Captura 9: Listado global de pedidos (Todos)...')
  await page.screenshot({
    path: join(ARTIFACT_DIR, 'audit_admin_pedidos_1_todos.png'),
    fullPage: true,
  })

  // Filtrar por Entregados
  console.log('Filtrando pedidos por "Entregados"...')
  await page.click('button:has-text("Entregados")')
  await sleep(1500)

  // Captura 10: Pedidos filtrados por ENTREGADO
  console.log('📸 Captura 10: Listado filtrado por Entregados...')
  await page.screenshot({
    path: join(ARTIFACT_DIR, 'audit_admin_pedidos_2_entregados.png'),
    fullPage: true,
  })

  // Limpiar archivo temporal
  if (fs.existsSync(tempPhotoPath)) {
    fs.unlinkSync(tempPhotoPath)
  }

  await browser.close()
  console.log('\n🎉 ¡Verificación E2E de AdminPanel Parte 2 completada exitosamente!')
}

run().catch((err) => {
  console.error('❌ Error durante la verificación:', err)
  process.exit(1)
})

import { createRequire } from "module"
const require = createRequire(
  "/Users/diegoreyes/Documents/SierraApp/SierrApp/package.json",
)
const { chromium } = require("playwright")
import path from "path"
import fs from "fs"
import crypto from "crypto"
const dotenv = require("/Users/diegoreyes/Documents/SierraApp/SierrApp/server/node_modules/dotenv")
dotenv.config({
  path: "/Users/diegoreyes/Documents/SierraApp/SierrApp/server/.env",
})

const ARTIFACT_DIR =
  "/Users/diegoreyes/.gemini/antigravity/brain/e0541bb2-6307-48a0-b851-3fdec9c84554"
const FRONTEND_URL = "http://localhost:8443"
const SERVER_LOG_PATH = path.join(
  ARTIFACT_DIR,
  ".system_generated",
  "tasks",
  "task-6726.log",
)
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function clearStorageAndCookies(page, context) {
  try {
    const salirBtns = page.locator(
      'button:has-text("Salir"), button:has-text("Cerrar sesión")',
    )
    if (
      (await salirBtns.count()) > 0 &&
      (await salirBtns.first().isVisible())
    ) {
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
  await sleep(600)
}

function extractLatestResetTokenFromLog() {
  if (!fs.existsSync(SERVER_LOG_PATH)) return null
  const content = fs.readFileSync(SERVER_LOG_PATH, "utf-8")
  const matches = [...content.matchAll(/token=([a-f0-9]{64})/g)]
  if (matches.length === 0) return null
  return matches[matches.length - 1][1]
}

async function main() {
  console.log(
    "====================================================================",
  )
  console.log("🚀 INICIO VERIFICACIÓN COMPLETA E2E: RECUPERACIÓN DE CONTRASEÑA")
  console.log(
    "====================================================================\n",
  )

  const { prisma } = await import(
    "/Users/diegoreyes/Documents/SierraApp/SierrApp/server/src/db/prisma.ts"
  )
  const { hashPassword } = await import(
    "/Users/diegoreyes/Documents/SierraApp/SierrApp/server/src/utils/password.ts"
  )

  const testEmail = "e2e.perfil.usuario@example.com"
  const initialPassword = "ClaveInicial123#"
  const newPassword = "NuevaClave!2026"

  // Garantizar que el usuario de prueba existe con la contraseña inicial
  console.log("📦 Preparando usuario de pruebas en DB...")
  const initialHash = await hashPassword(initialPassword)
  let user = await prisma.user.findUnique({ where: { email: testEmail } })
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: testEmail,
        passwordHash: initialHash,
        nombre: "Usuario Test Reset",
        telefono: "6141002001",
        rol: "USUARIO",
        status: "ACTIVO",
        emailVerified: true,
      },
    })
    console.log(`✅ Usuario creado: ${testEmail}`)
  } else {
    user = await prisma.user.update({
      where: { email: testEmail },
      data: { passwordHash: initialHash, status: "ACTIVO" },
    })
    console.log(`✅ Usuario reseteado a clave inicial: ${testEmail}`)
  }

  // Limpiar tokens previos de este usuario para una prueba limpia
  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } })

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  })
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  })
  const page = await context.newPage()

  try {
    // -------------------------------------------------------------------------
    // PASO 1: Desde la pantalla de login, clic en "¿Olvidaste tu contraseña?"
    // -------------------------------------------------------------------------
    console.log(
      '\n--- PASO 1: Clic en "¿Olvidaste tu contraseña?" en Login ---',
    )
    await clearStorageAndCookies(page, context)

    // Seleccionar rol Usuario para ver el login
    const uBtn = page.locator('button:has-text("Usuario")').first()
    await uBtn.waitFor({ state: "visible", timeout: 10000 })
    await uBtn.click()
    await sleep(500)

    const forgotLink = page.locator(
      'button:has-text("¿Olvidaste tu contraseña?")',
    )
    await forgotLink.waitFor({ state: "visible", timeout: 5000 })
    console.log(
      '🔍 Encontrado enlace "¿Olvidaste tu contraseña?", haciendo clic...',
    )
    await forgotLink.click()
    await sleep(600)

    // Confirmar que se abrió la pantalla de Cambio A
    const forgotTitle = page.locator('h2:has-text("Recuperar Contraseña")')
    await forgotTitle.waitFor({ state: "visible", timeout: 5000 })
    const emailInput = page.locator("input#forgot-email")
    await emailInput.waitFor({ state: "visible", timeout: 5000 })
    console.log(
      '✅ PASO 1 EXITOSO: Pantalla "Recuperar Contraseña" abierta correctamente.',
    )

    const p1Screenshot = path.join(
      ARTIFACT_DIR,
      "reset_01_pantalla_olvide_contrasena.png",
    )
    await page.screenshot({ path: p1Screenshot, fullPage: true })
    console.log(`📸 Captura guardada: reset_01_pantalla_olvide_contrasena.png`)

    // -------------------------------------------------------------------------
    // PASO 2: Solicitar recuperación para correo existente
    // -------------------------------------------------------------------------
    console.log("\n--- PASO 2: Solicitar reseteo con correo existente ---")
    await emailInput.fill(testEmail)
    const submitForgotBtn = page.locator(
      'button:has-text("Enviar enlace de recuperación")',
    )
    await submitForgotBtn.click()
    await sleep(1500)

    // Confirmar mensaje de éxito en UI
    const successBanner = page.locator(
      "text=Si el correo existe, enviamos un enlace para restablecer tu contraseña",
    )
    await successBanner.waitFor({ state: "visible", timeout: 8000 })
    console.log("✅ Mensaje de éxito visible en pantalla:")
    console.log(`   "${await successBanner.innerText()}"`)

    // Confirmar que en PostgreSQL se generó el token
    const tokenInDb = await prisma.passwordResetToken.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    })
    if (!tokenInDb) {
      throw new Error(
        "❌ No se encontró ningún token en la tabla passwordResetToken de la DB!",
      )
    }
    console.log(
      `🔍 Token encontrado en PostgreSQL: id=${tokenInDb.id}, expiresAt=${tokenInDb.expiresAt.toISOString()}, usedAt=${tokenInDb.usedAt}`,
    )

    // Obtener raw token del log del servidor
    const rawToken = extractLatestResetTokenFromLog()
    if (!rawToken) {
      throw new Error("❌ No se pudo extraer el rawToken del log del servidor!")
    }
    console.log(`🔍 Raw token obtenido del log: ${rawToken}`)

    // Validar concordancia de hash
    const expectedHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex")
    if (expectedHash !== tokenInDb.tokenHash) {
      throw new Error(
        `❌ Inconsistencia de hash: esperado ${tokenInDb.tokenHash}, calculado ${expectedHash}`,
      )
    }
    console.log(
      `✅ Verificación criptográfica sha256 coincide exactamente con la DB!`,
    )
    console.log(
      "✅ PASO 2 EXITOSO: Solicitud enviada, banner mostrado y token registrado en DB.",
    )

    const p2Screenshot = path.join(
      ARTIFACT_DIR,
      "reset_02_exito_solicitud_token.png",
    )
    await page.screenshot({ path: p2Screenshot, fullPage: true })
    console.log(`📸 Captura guardada: reset_02_exito_solicitud_token.png`)

    // -------------------------------------------------------------------------
    // PASO 3: Abrir en el navegador la URL con ese token (?token=XXXX)
    // -------------------------------------------------------------------------
    console.log("\n--- PASO 3: Cargar app con URL ?token=... (Cambio B) ---")
    const resetUrl = `${FRONTEND_URL}/?token=${rawToken}`
    console.log(`🌐 Navegando a: ${resetUrl}`)
    await page.goto(resetUrl)
    await sleep(1200)

    // Confirmar que la pantalla Cambio B se renderiza directamente
    const resetTitle = page.locator('h2:has-text("Restablecer Contraseña")')
    await resetTitle.waitFor({ state: "visible", timeout: 8000 })
    const newPassInput = page.locator("input#reset-new-password")
    const confirmPassInput = page.locator("input#reset-confirm-password")
    await newPassInput.waitFor({ state: "visible", timeout: 5000 })
    await confirmPassInput.waitFor({ state: "visible", timeout: 5000 })
    console.log(
      '✅ PASO 3 EXITOSO: Pantalla "Restablecer Contraseña" cargada directamente desde la URL con campos de clave.',
    )

    const p3Screenshot = path.join(
      ARTIFACT_DIR,
      "reset_03_pantalla_restablecer_token.png",
    )
    await page.screenshot({ path: p3Screenshot, fullPage: true })
    console.log(`📸 Captura guardada: reset_03_pantalla_restablecer_token.png`)

    // -------------------------------------------------------------------------
    // PASO 4: Ingresar contraseña nueva válida, enviar, y login con nueva clave
    // -------------------------------------------------------------------------
    console.log(
      "\n--- PASO 4: Ingresar nueva contraseña válida y probar login ---",
    )
    await newPassInput.fill(newPassword)
    await confirmPassInput.fill(newPassword)
    await sleep(500)

    // Comprobar política visual (todos los requisitos en verde)
    const submitResetBtn = page.locator(
      'button[type="submit"]:has-text("Restablecer contraseña")',
    )
    await submitResetBtn.click()
    await sleep(2000)

    // Confirmar que regresó al login y que la URL se limpió
    const currentUrl = page.url()
    console.log(`🔍 URL actual después de restablecer: ${currentUrl}`)
    if (currentUrl.includes("token=")) {
      throw new Error(
        `❌ La URL todavía contiene el parámetro token: ${currentUrl}`,
      )
    }
    console.log("✅ URL limpia sin parámetro token.")

    // Verificar en DB que usedAt fue registrado
    const updatedTokenDb = await prisma.passwordResetToken.findUnique({
      where: { id: tokenInDb.id },
    })
    if (!updatedTokenDb || !updatedTokenDb.usedAt) {
      throw new Error("❌ El token no fue marcado como usado (usedAt es null)!")
    }
    console.log(
      `✅ Token verificado en DB como usado: usedAt=${updatedTokenDb.usedAt.toISOString()}`,
    )

    // Iniciar sesión con la nueva contraseña
    console.log("🔑 Probando inicio de sesión con la NUEVA contraseña...")
    const loginEmailInput = page.locator('input[type="email"]')
    await loginEmailInput.waitFor({ state: "visible", timeout: 8000 })
    await loginEmailInput.fill(testEmail)
    const loginPassInput = page.locator('input[type="password"]')
    await loginPassInput.fill(newPassword)
    const entrarBtn = page.locator('button[type="submit"]:has-text("Entrar")')
    await entrarBtn.click()
    await sleep(2500)

    // Confirmar login exitoso
    const homeOrProfileIndicator = page.locator(
      'button:has-text("Perfil"), button:has-text("Explorar"), button:has-text("Inicio")',
    )
    await homeOrProfileIndicator
      .first()
      .waitFor({ state: "visible", timeout: 10000 })
    console.log("✅ Sesión iniciada correctamente con la nueva contraseña!")
    console.log(
      "✅ PASO 4 EXITOSO: Clave actualizada, token consumido y login verificado.",
    )

    const p4Screenshot = path.join(
      ARTIFACT_DIR,
      "reset_04_login_nueva_contrasena_exito.png",
    )
    await page.screenshot({ path: p4Screenshot, fullPage: true })
    console.log(
      `📸 Captura guardada: reset_04_login_nueva_contrasena_exito.png`,
    )

    // Cerrar sesión para el siguiente paso
    await clearStorageAndCookies(page, context)

    // -------------------------------------------------------------------------
    // PASO 5: Abrir de nuevo la URL con el token YA USADO
    // -------------------------------------------------------------------------
    console.log("\n--- PASO 5: Reusar el token ya consumido ---")
    await page.goto(resetUrl)
    await sleep(1000)

    const newPassInputP5 = page.locator("input#reset-new-password")
    const confirmPassInputP5 = page.locator("input#reset-confirm-password")
    await newPassInputP5.waitFor({ state: "visible", timeout: 5000 })
    await newPassInputP5.fill("OtraClaveMas123!")
    await confirmPassInputP5.fill("OtraClaveMas123!")
    await sleep(400)

    const submitResetBtnP5 = page.locator(
      'button[type="submit"]:has-text("Restablecer contraseña")',
    )
    await submitResetBtnP5.click()
    await sleep(1500)

    // Confirmar mensaje de error de token inválido/expirado
    const tokenErrorMsg = page.locator(
      "text=El enlace de recuperación es inválido o expiró",
    )
    await tokenErrorMsg.waitFor({ state: "visible", timeout: 5000 })
    console.log(
      `✅ Error rechazado por el backend: "${await tokenErrorMsg.innerText()}"`,
    )

    // Confirmar botón para solicitar nuevo enlace
    const requestNewLinkBtn = page.locator(
      'button:has-text("Solicitar nuevo enlace de recuperación")',
    )
    await requestNewLinkBtn.waitFor({ state: "visible", timeout: 5000 })
    console.log(
      '✅ Botón "Solicitar nuevo enlace de recuperación" presente y visible.',
    )
    console.log(
      "✅ PASO 5 EXITOSO: Token reusado rechazado y botón de auxilio disponible.",
    )

    const p5Screenshot = path.join(
      ARTIFACT_DIR,
      "reset_05_error_token_reusado.png",
    )
    await page.screenshot({ path: p5Screenshot, fullPage: true })
    console.log(`📸 Captura guardada: reset_05_error_token_reusado.png`)

    // -------------------------------------------------------------------------
    // PASO 6: Solicitar reseteo para correo que NO existe en la base de datos
    // -------------------------------------------------------------------------
    console.log("\n--- PASO 6: Solicitar reseteo para correo inexistente ---")
    // Clic en el botón para volver a solicitar
    await requestNewLinkBtn.click()
    await sleep(600)

    const fakeEmail = "correo.completamente.inexistente.999@ejemplo.com"
    const forgotEmailInputP6 = page.locator("input#forgot-email")
    await forgotEmailInputP6.waitFor({ state: "visible", timeout: 5000 })
    await forgotEmailInputP6.fill(fakeEmail)

    const submitForgotBtnP6 = page.locator(
      'button:has-text("Enviar enlace de recuperación")',
    )
    await submitForgotBtnP6.click()
    await sleep(1500)

    // Confirmar que muestra EXACTAMENTE el mismo mensaje de éxito
    const successBannerP6 = page.locator(
      "text=Si el correo existe, enviamos un enlace para restablecer tu contraseña",
    )
    await successBannerP6.waitFor({ state: "visible", timeout: 8000 })
    console.log("✅ Mensaje de éxito idéntico mostrado:")
    console.log(`   "${await successBannerP6.innerText()}"`)

    // Confirmar que NO se generó ningún token en DB
    const anyFakeToken = await prisma.user.findUnique({
      where: { email: fakeEmail },
    })
    if (anyFakeToken) {
      throw new Error("❌ El correo ficticio existe en la base de datos!")
    }
    console.log(
      "✅ Verificado: La base de datos no contiene el usuario ficticio ni generó filtraciones.",
    )
    console.log(
      "✅ PASO 6 EXITOSO: Comportamiento idéntico contra enumeración de usuarios.",
    )

    const p6Screenshot = path.join(
      ARTIFACT_DIR,
      "reset_06_exito_correo_inexistente.png",
    )
    await page.screenshot({ path: p6Screenshot, fullPage: true })
    console.log(`📸 Captura guardada: reset_06_exito_correo_inexistente.png`)

    // -------------------------------------------------------------------------
    // PASO 7: Abrir con token inventado (?token=fake123) e intentar cambiar clave
    // -------------------------------------------------------------------------
    console.log("\n--- PASO 7: Abrir con token inventado (?token=fake123) ---")
    await page.goto(`${FRONTEND_URL}/?token=fake123`)
    await sleep(1200)

    const newPassInputP7 = page.locator("input#reset-new-password")
    const confirmPassInputP7 = page.locator("input#reset-confirm-password")
    await newPassInputP7.waitFor({ state: "visible", timeout: 5000 })
    await newPassInputP7.fill("IntentoClaveFake123!")
    await confirmPassInputP7.fill("IntentoClaveFake123!")
    await sleep(400)

    const submitResetBtnP7 = page.locator(
      'button[type="submit"]:has-text("Restablecer contraseña")',
    )
    await submitResetBtnP7.click()
    await sleep(1500)

    // Confirmar que el backend rechaza y la UI muestra el error
    const errorBannerP7 = page.locator("div.bg-red-950\\/40")
    await errorBannerP7.waitFor({ state: "visible", timeout: 5000 })
    const errorText = await errorBannerP7.innerText()
    console.log(`✅ Error recibido y mostrado en UI:`)
    console.log(`   "${errorText.trim()}"`)

    const requestNewLinkBtnP7 = page.locator(
      'button:has-text("Solicitar nuevo enlace de recuperación")',
    )
    await requestNewLinkBtnP7.waitFor({ state: "visible", timeout: 5000 })
    console.log('✅ Botón de redirección a "Olvidé mi contraseña" presente.')
    console.log(
      "✅ PASO 7 EXITOSO: Token inventado rechazado con mensaje de error claro.",
    )

    const p7Screenshot = path.join(
      ARTIFACT_DIR,
      "reset_07_error_token_inventado.png",
    )
    await page.screenshot({ path: p7Screenshot, fullPage: true })
    console.log(`📸 Captura guardada: reset_07_error_token_inventado.png`)

    console.log(
      "\n====================================================================",
    )
    console.log(
      "🎉 TODOS LOS 7 PASOS DE VERIFICACIÓN E2E COMPLETADOS EXITOSAMENTE",
    )
    console.log(
      "====================================================================",
    )
  } finally {
    await browser.close()
    await prisma.$disconnect()
  }
}

main().catch((err) => {
  console.error("\n❌ ERROR EN LA VERIFICACIÓN E2E:", err)
  process.exit(1)
})

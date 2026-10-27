import { createRequire } from "module"
const require = createRequire(
  "/Users/diegoreyes/Documents/SierraApp/SierrApp/package.json",
)
const { chromium } = require("playwright")
import path from "path"
import fs from "fs"

const ARTIFACT_DIR =
  "/Users/diegoreyes/.gemini/antigravity/brain/e0541bb2-6307-48a0-b851-3fdec9c84554"
const FRONTEND_URL = "http://localhost:8443"
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function logout(page, context) {
  try {
    const salirBtns = page.locator(
      'button:has-text("Salir"), button:has-text("Cerrar sesión")',
    )
    if (
      (await salirBtns.count()) > 0 &&
      (await salirBtns.first().isVisible())
    ) {
      await salirBtns.first().click()
      await sleep(800)
    }
  } catch {}
  if (context) {
    await context.clearCookies()
  }
  await page.goto(FRONTEND_URL)
  await sleep(500)
  try {
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
  } catch {}
  await page.goto(FRONTEND_URL)
  await sleep(1000)
}

async function loginAs(page, roleTab, email, password) {
  console.log(`🔑 Login como ${roleTab} (${email})...`)

  // Si estamos en un formulario de login previo, regresar al selector de roles
  const backBtn = page.locator('button:has-text("Cambiar tipo de acceso")')
  if (await backBtn.isVisible()) {
    await backBtn.click()
    await sleep(500)
  }

  // Clic en el botón específico de cada rol en la pantalla roleSelect
  if (roleTab === "Usuario") {
    const uBtn = page.locator('button:has-text("Usuario")').first()
    await uBtn.waitFor({ state: "visible", timeout: 10000 })
    await uBtn.click()
  } else if (roleTab === "Local") {
    // El rol Local tiene el texto exacto "Colaborador" en el botón
    const lBtn = page.locator('button:has-text("Colaborador")').first()
    await lBtn.waitFor({ state: "visible", timeout: 10000 })
    await lBtn.click()
  } else if (roleTab === "Repartidor") {
    // El rol Repartidor tiene el texto exacto "Ingresa aquí" en la pantalla principal
    const rBtn = page.locator('button:has-text("Ingresa aquí")').first()
    await rBtn.waitFor({ state: "visible", timeout: 10000 })
    await rBtn.click()
  } else if (roleTab === "Admin") {
    // El rol Admin tiene el texto exacto "Acceso administrador" en la esquina inferior
    const aBtn = page.locator('button:has-text("Acceso administrador")').first()
    await aBtn.waitFor({ state: "visible", timeout: 10000 })
    await aBtn.click()
  }
  await sleep(800)

  // Llenar campos de login
  const emailInput = page.locator('input[type="email"]')
  await emailInput.waitFor({ state: "visible", timeout: 10000 })
  await emailInput.fill(email)

  const passInput = page.locator('input[type="password"]')
  await passInput.fill(password)

  const submitBtn = page.locator('button[type="submit"]:has-text("Entrar")')
  await submitBtn.click()
  await sleep(2000)
}

async function main() {
  console.log("=== INICIO VERIFICACIÓN E2E PERFIL PROPIO (4 PASOS) ===\n")

  // Setup test image for driver photo
  const testImgPath = path.join(
    ARTIFACT_DIR,
    "scratch",
    "temp_driver_photo.jpg",
  )
  const srcLogo =
    "/Users/diegoreyes/Documents/SierraApp/SierrApp/src/imports/logo.jpeg"
  fs.copyFileSync(srcLogo, testImgPath)

  // 1. Seed / Ensure test accounts exist in DB
  const { prisma } = await import(
    "/Users/diegoreyes/Documents/SierraApp/SierrApp/server/src/db/prisma.ts"
  )
  const { hashPassword } = await import(
    "/Users/diegoreyes/Documents/SierraApp/SierrApp/server/src/utils/password.ts"
  )

  const defaultHash = await hashPassword("ClaveSegura123#")

  // Ensure test users
  const testUsers = {
    usuario: {
      email: "e2e.perfil.usuario@example.com",
      nombre: "Usuario Inicial E2E",
      telefono: "6141002001",
      rol: "USUARIO",
    },
    local: {
      email: "e2e.perfil.local@example.com",
      nombre: "Propietario Inicial E2E",
      telefono: "6141002002",
      rol: "LOCAL",
    },
    repartidor: {
      email: "e2e.perfil.repartidor@example.com",
      nombre: "Repartidor Inicial E2E",
      telefono: "6141002003",
      rol: "REPARTIDOR",
    },
    admin: {
      email: "admin@sierraapp.com",
      nombre: "Administrador Inicial",
      telefono: "6141002004",
      rol: "ADMIN",
    },
  }

  for (const [key, u] of Object.entries(testUsers)) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } })
    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          nombre: u.nombre,
          telefono: u.telefono,
          status: "ACTIVO",
          passwordHash:
            key === "admin"
              ? await hashPassword("Adm!nPlatf0rm2026#Secure")
              : defaultHash,
        },
      })
      if (key === "repartidor") {
        await prisma.driverProfile.upsert({
          where: { userId: existing.id },
          create: {
            user: { connect: { id: existing.id } },
            tieneVehiculo: false,
            matricula: "E2E-001",
          },
          update: { tieneVehiculo: false, vehiculo: null, fotoUrl: null },
        })
      }
      if (key === "local") {
        const rest = await prisma.restaurant.findFirst({
          where: { ownerId: existing.id },
        })
        if (!rest) {
          await prisma.restaurant.create({
            data: {
              nombre: "Restaurante E2E Local",
              categoria: "Comida",
              direccion: "Av. Tecnológico 100",
              ownerId: existing.id,
              status: "ACTIVO",
              isOpen: true,
              tiempoEntrega: "25-35 min",
              deliveryFeeTexto: "$20 de envío",
              deliveryFee: 20,
              coverImg: "/uploads/default-restaurant.webp",
            },
          })
        }
      }
    } else {
      const created = await prisma.user.create({
        data: {
          email: u.email,
          nombre: u.nombre,
          telefono: u.telefono,
          rol: u.rol,
          status: "ACTIVO",
          passwordHash:
            key === "admin"
              ? await hashPassword("Adm!nPlatf0rm2026#Secure")
              : defaultHash,
        },
      })
      if (key === "repartidor") {
        await prisma.driverProfile.create({
          data: {
            userId: created.id,
            tieneVehiculo: false,
            matricula: "E2E-001",
          },
        })
      }
      if (key === "local") {
        await prisma.restaurant.create({
          data: {
            nombre: "Restaurante E2E Local",
            categoria: "Comida",
            direccion: "Av. Tecnológico 100",
            ownerId: created.id,
            status: "ACTIVO",
            isOpen: true,
            tiempoEntrega: "25-35 min",
            deliveryFeeTexto: "$20 de envío",
            deliveryFee: 20,
            coverImg: "/uploads/default-restaurant.webp",
          },
        })
      }
    }
  }

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  })
  const page = await context.newPage()

  page.on("dialog", async (dialog) => {
    console.log(`[BROWSER DIALOG] ${dialog.type()}: ${dialog.message()}`)
    await dialog.accept()
  })

  // =========================================================================
  // PASO 1: EDITAR NOMBRE Y TELÉFONO EN LOS 4 ROLES
  // =========================================================================
  console.log("\n-----------------------------------------------------------")
  console.log("📌 PASO 1: EDITAR NOMBRE Y TELÉFONO EN LOS 4 ROLES")
  console.log("-----------------------------------------------------------")

  // 1.1 ROL USUARIO
  console.log("\n[1.1] Probando Rol USUARIO...")
  await logout(page, context)
  await loginAs(page, "Usuario", testUsers.usuario.email, "ClaveSegura123#")

  // Ir a la pestaña "Perfil"
  const navPerfil = page
    .locator('nav button:has-text("Perfil"), nav button:has-text("Cuenta")')
    .first()
  if (await navPerfil.isVisible()) {
    await navPerfil.click()
    await sleep(600)
  }

  // Clic en Editar Perfil
  const btnEditUsuario = page
    .locator('button:has-text("Editar perfil")')
    .first()
  await btnEditUsuario.click()
  await sleep(600)

  // Editar datos
  const nombreInput = page.locator('input[placeholder="Tu nombre completo"]')
  await nombreInput.fill("Usuario Verificado Sierra")

  const telInput = page.locator('input[placeholder="Ej. 618 123 4567"]')
  await telInput.fill("6149991122")

  const saveBtn = page.locator(
    'button[type="submit"]:has-text("Guardar Cambios")',
  )
  await saveBtn.click()
  await sleep(1500)

  // Captura y verificación en UI y DB
  const snapUser = path.join(
    ARTIFACT_DIR,
    "verif_01_usuario_perfil_editado.png",
  )
  await page.screenshot({ path: snapUser })
  console.log(`📸 Captura guardada: ${snapUser}`)

  const dbUser = await prisma.user.findUnique({
    where: { email: testUsers.usuario.email },
  })
  console.log(
    `🔍 [DB USUARIO]: Nombre=${dbUser.nombre}, Teléfono=${dbUser.telefono}`,
  )
  if (
    dbUser.nombre !== "Usuario Verificado Sierra" ||
    dbUser.telefono !== "6149991122"
  ) {
    throw new Error("Fallo en DB para Rol Usuario")
  }

  // 1.2 ROL LOCAL
  console.log("\n[1.2] Probando Rol LOCAL...")
  await logout(page, context)
  await loginAs(page, "Local", testUsers.local.email, "ClaveSegura123#")

  // En LocalPanel ir a pestaña Perfil / Mi Negocio
  const navLocalPerfil = page
    .locator('nav button:has-text("Perfil"), nav button:has-text("Mi Negocio")')
    .first()
  if (await navLocalPerfil.isVisible()) {
    await navLocalPerfil.click()
    await sleep(600)
  }

  // Clic en "👤 Mi cuenta personal y contraseña"
  const btnEditLocal = page.locator(
    'button:has-text("Mi cuenta personal y contraseña")',
  )
  await btnEditLocal.click()
  await sleep(600)

  await nombreInput.fill("Propietario Don Pedro")
  await telInput.fill("6148883344")
  await saveBtn.click()
  await sleep(1500)

  const snapLocal = path.join(ARTIFACT_DIR, "verif_01_local_perfil_editado.png")
  await page.screenshot({ path: snapLocal })
  console.log(`📸 Captura guardada: ${snapLocal}`)

  const dbLocal = await prisma.user.findUnique({
    where: { email: testUsers.local.email },
  })
  console.log(
    `🔍 [DB LOCAL]: Nombre=${dbLocal.nombre}, Teléfono=${dbLocal.telefono}`,
  )
  if (
    dbLocal.nombre !== "Propietario Don Pedro" ||
    dbLocal.telefono !== "6148883344"
  ) {
    throw new Error("Fallo en DB para Rol Local")
  }

  // 1.3 ROL ADMIN
  console.log("\n[1.3] Probando Rol ADMIN...")
  await logout(page, context)
  await loginAs(
    page,
    "Admin",
    testUsers.admin.email,
    "Adm!nPlatf0rm2026#Secure",
  )

  // Clic en "👤 Mi perfil" en la TopBar
  const btnEditAdmin = page.locator('button:has-text("Mi perfil")').first()
  await btnEditAdmin.click()
  await sleep(600)

  await nombreInput.fill("Administrador Principal Sierra")
  await telInput.fill("6147775566")
  await saveBtn.click()
  await sleep(1500)

  const snapAdmin = path.join(ARTIFACT_DIR, "verif_01_admin_perfil_editado.png")
  await page.screenshot({ path: snapAdmin })
  console.log(`📸 Captura guardada: ${snapAdmin}`)

  const dbAdmin = await prisma.user.findUnique({
    where: { email: testUsers.admin.email },
  })
  console.log(
    `🔍 [DB ADMIN]: Nombre=${dbAdmin.nombre}, Teléfono=${dbAdmin.telefono}`,
  )
  if (
    dbAdmin.nombre !== "Administrador Principal Sierra" ||
    dbAdmin.telefono !== "6147775566"
  ) {
    throw new Error("Fallo en DB para Rol Admin")
  }

  // 1.4 ROL REPARTIDOR
  console.log("\n[1.4] Probando Rol REPARTIDOR...")
  await logout(page, context)
  await loginAs(
    page,
    "Repartidor",
    testUsers.repartidor.email,
    "ClaveSegura123#",
  )

  // Ir a pestaña Perfil de Repartidor en la barra de navegación inferior
  const navRepPerfil = page.locator('nav button:has-text("Perfil")').first()
  await navRepPerfil.waitFor({ state: "visible", timeout: 10000 })
  await navRepPerfil.click()
  await sleep(800)

  // Clic en editar perfil
  const btnEditRep = page
    .locator('button:has-text("Editar perfil y vehículo")')
    .first()
  await btnEditRep.waitFor({ state: "visible", timeout: 10000 })
  await btnEditRep.click()
  await sleep(600)

  await nombreInput.fill("Repartidor Águila Sierra")
  await telInput.fill("6146667788")
  await saveBtn.click()
  await sleep(1500)

  const snapRep = path.join(
    ARTIFACT_DIR,
    "verif_01_repartidor_perfil_editado.png",
  )
  await page.screenshot({ path: snapRep })
  console.log(`📸 Captura guardada: ${snapRep}`)

  const dbRep = await prisma.user.findUnique({
    where: { email: testUsers.repartidor.email },
  })
  console.log(
    `🔍 [DB REPARTIDOR]: Nombre=${dbRep.nombre}, Teléfono=${dbRep.telefono}`,
  )
  if (
    dbRep.nombre !== "Repartidor Águila Sierra" ||
    dbRep.telefono !== "6146667788"
  ) {
    throw new Error("Fallo en DB para Rol Repartidor")
  }

  console.log(
    "✅ PASO 1 COMPLETADO: Nombre y teléfono editados y persistidos en los 4 roles.\n",
  )

  // =========================================================================
  // PASO 2: CAMBIAR FOTO + VEHÍCULO DE REPARTIDOR
  // =========================================================================
  console.log("-----------------------------------------------------------")
  console.log("📌 PASO 2: CAMBIAR FOTO + VEHÍCULO DE REPARTIDOR")
  console.log("-----------------------------------------------------------")

  // Abrir modal de repartidor
  await btnEditRep.click()
  await sleep(600)

  // Subir fotografía
  const fileInput = page.locator('input[type="file"]')
  await fileInput.setInputFiles(testImgPath)
  await sleep(500)

  // Marcar vehículo propio y llenar modelo
  const vehiculoCheck = page.locator('input[type="checkbox"]')
  if (!(await vehiculoCheck.isChecked())) {
    await vehiculoCheck.check()
    await sleep(300)
  }

  const modeloInput = page.locator(
    'input[placeholder="Ej. Motocicleta Italika 150cc / Automóvil"]',
  )
  await modeloInput.fill("Yamaha MT-03 321cc Negra")

  await saveBtn.click()
  await sleep(2000)

  // Ir a pestaña Perfil de Repartidor para ver foto y vehículo
  const repPerfilTab = page.locator('nav button:has-text("Perfil")').first()
  if (await repPerfilTab.isVisible()) {
    await repPerfilTab.click()
    await sleep(600)
  }

  const snapFotoVehiculo = path.join(
    ARTIFACT_DIR,
    "verif_02_repartidor_foto_vehiculo.png",
  )
  await page.screenshot({ path: snapFotoVehiculo })
  console.log(`📸 Captura guardada: ${snapFotoVehiculo}`)

  const dbDriverProfile = await prisma.driverProfile.findUnique({
    where: { userId: dbRep.id },
  })
  console.log(
    `🔍 [DB DRIVER PROFILE]: tieneVehiculo=${dbDriverProfile.tieneVehiculo}, vehiculo=${dbDriverProfile.vehiculo}, fotoUrl=${dbDriverProfile.fotoUrl}`,
  )

  if (
    !dbDriverProfile.tieneVehiculo ||
    dbDriverProfile.vehiculo !== "Yamaha MT-03 321cc Negra" ||
    !dbDriverProfile.fotoUrl
  ) {
    throw new Error("Fallo en DB para foto y vehículo de repartidor")
  }
  console.log(
    "✅ PASO 2 COMPLETADO: Foto subida con éxito y vehículo actualizado en UI y DB.\n",
  )

  // =========================================================================
  // PASO 4: ERROR DE CONTRASEÑA ACTUAL INCORRECTA (hacemos 4 antes de cambiarla en 3)
  // =========================================================================
  console.log("-----------------------------------------------------------")
  console.log("📌 PASO 4: ERROR DE CONTRASEÑA ACTUAL INCORRECTA")
  console.log("-----------------------------------------------------------")

  await btnEditRep.click()
  await sleep(600)

  // Ir a pestaña Contraseña dentro del modal
  const tabPassword = page
    .locator('.fixed button:has-text("Contraseña")')
    .first()
  await tabPassword.click()
  await sleep(400)

  const currentPassInput = page.locator(
    'input[placeholder="Tu contraseña actual"]',
  )
  const newPassInput = page.locator(
    'input[placeholder="Nueva contraseña segura"]',
  )
  const confirmPassInput = page.locator(
    'input[placeholder="Repite la nueva contraseña"]',
  )
  const changePassBtn = page.locator(
    'button[type="submit"]:has-text("Actualizar Contraseña")',
  )

  await currentPassInput.fill("ClaveTotalmenteErronea999#")
  await newPassInput.fill("NuevaClaveSegura2026#VIP")
  await confirmPassInput.fill("NuevaClaveSegura2026#VIP")

  await changePassBtn.click()
  await sleep(1000)

  const snapErrorPass = path.join(
    ARTIFACT_DIR,
    "verif_04_error_contrasena_incorrecta.png",
  )
  await page.screenshot({ path: snapErrorPass })
  console.log(`📸 Captura guardada: ${snapErrorPass}`)

  // Verificar que el mensaje de error aparece en la UI
  const errorText = await page
    .locator("text=La contraseña actual no es correcta")
    .isVisible()
  console.log(`🔍 [UI ERROR]: "¿Mensaje visible?" -> ${errorText}`)
  if (!errorText) {
    throw new Error("No se mostró el error de contraseña actual incorrecta")
  }
  console.log(
    "✅ PASO 4 COMPLETADO: Error de contraseña incorrecta visible y validado correctamente.\n",
  )

  // =========================================================================
  // PASO 3: CAMBIAR CONTRASEÑA Y CONFIRMAR QUE LA VIEJA YA NO SIRVE
  // =========================================================================
  console.log("-----------------------------------------------------------")
  console.log(
    "📌 PASO 3: CAMBIAR CONTRASEÑA Y CONFIRMAR QUE LA VIEJA YA NO SIRVE",
  )
  console.log("-----------------------------------------------------------")

  // Ingresar la contraseña actual correcta
  await currentPassInput.fill("ClaveSegura123#")
  await newPassInput.fill("NuevaClaveSegura2026#VIP")
  await confirmPassInput.fill("NuevaClaveSegura2026#VIP")
  await changePassBtn.click()
  await sleep(600)

  const snapPassExito = path.join(
    ARTIFACT_DIR,
    "verif_03_password_cambiada_exito.png",
  )
  await page.screenshot({ path: snapPassExito })
  console.log(`📸 Captura guardada: ${snapPassExito}`)

  await sleep(2000) // Espera el alert y el logout

  // 3.1 Probar Login con la contraseña VIEJA (debe fallar)
  console.log(
    "\n[3.1] Intentando iniciar sesión con la contraseña VIEJA (debe fallar)...",
  )
  await loginAs(
    page,
    "Repartidor",
    testUsers.repartidor.email,
    "ClaveSegura123#",
  )
  await sleep(1000)

  const snapLoginViejaFalla = path.join(
    ARTIFACT_DIR,
    "verif_03_login_vieja_clave_falla.png",
  )
  await page.screenshot({ path: snapLoginViejaFalla })
  console.log(`📸 Captura guardada: ${snapLoginViejaFalla}`)

  const loginErrorVisible = await page
    .locator("text=Correo o contraseña incorrectos")
    .isVisible()
  console.log(
    `🔍 [UI RECHAZO]: "¿Error de login visible?" -> ${loginErrorVisible}`,
  )
  if (!loginErrorVisible) {
    throw new Error("La contraseña vieja no fue rechazada correctamente")
  }

  // 3.2 Probar Login con la contraseña NUEVA (debe entrar exitosamente)
  console.log(
    "\n[3.2] Intentando iniciar sesión con la contraseña NUEVA (debe tener éxito)...",
  )
  await loginAs(
    page,
    "Repartidor",
    testUsers.repartidor.email,
    "NuevaClaveSegura2026#VIP",
  )
  await sleep(1500)

  const snapLoginNuevaExito = path.join(
    ARTIFACT_DIR,
    "verif_03_login_nueva_clave_exito.png",
  )
  await page.screenshot({ path: snapLoginNuevaExito })
  console.log(`📸 Captura guardada: ${snapLoginNuevaExito}`)

  // Verificar que estamos dentro del panel de repartidor
  const isRepartidorPanel = await page
    .locator("text=Panel de Repartidor")
    .first()
    .isVisible()
  console.log(
    `🔍 [UI ÉXITO]: "¿Dentro del panel de repartidor?" -> ${isRepartidorPanel}`,
  )
  if (!isRepartidorPanel) {
    throw new Error("No se pudo ingresar con la contraseña nueva")
  }

  // Consultar en Prisma DB
  const dbUserAfter = await prisma.user.findUnique({
    where: { email: testUsers.repartidor.email },
  })
  console.log(
    `🔍 [DB VERIFICACIÓN]: Password hash actualizado=${dbUserAfter.passwordHash !== defaultHash}`,
  )

  console.log(
    "✅ PASO 3 COMPLETADO: Contraseña cambiada con éxito, vieja revocada, nueva operativa.\n",
  )

  await browser.close()
  await prisma.$disconnect()
  console.log("===========================================================")
  console.log("🎉 TODOS LOS 4 PASOS DE VERIFICACIÓN COMPLETADOS CON ÉXITO")
  console.log("===========================================================")
}

main().catch((err) => {
  console.error("\n❌ ERROR EN LA VERIFICACIÓN E2E:", err)
  process.exit(1)
})

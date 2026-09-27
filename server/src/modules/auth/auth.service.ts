// Destino: server/src/modules/auth/auth.service.ts

import { prisma } from '../../db/prisma'
import { hashPassword, verifyPassword, checkPasswordPolicy } from '../../utils/password'
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
  generateSecureToken,
} from '../../utils/tokens'
import { sendVerificationEmail, sendPasswordResetEmail, sendAccountLockedAlert } from '../../utils/email'

const MAX_FAILED_ATTEMPTS = 5
const LOCK_DURATION_MS = 15 * 60 * 1000 // 15 minutos

// Mensaje idéntico para "correo no existe" y "contraseña incorrecta" —
// a propósito. Si fueran distintos, alguien podría usar el endpoint de
// login para descubrir qué correos están registrados (enumeración de
// usuarios), que es una filtración de información real.
const GENERIC_LOGIN_ERROR = 'Correo o contraseña incorrectos.'

export class AuthError extends Error {
  status: number
  constructor(message: string, status = 400) {
    super(message)
    this.status = status
  }
}

// ------------------------------------------------------------
// REGISTRO
// ------------------------------------------------------------

async function assertEmailAvailable(email: string) {
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    // Aquí SÍ es aceptable ser específico (a diferencia del login),
    // porque el registro ya requiere que el usuario apenas esté
    // creando la cuenta — no hay nada sensible que enumerar todavía
    // en el mismo sentido que con login.
    throw new AuthError('Ya existe una cuenta con este correo.', 409)
  }
}

function assertStrongPassword(password: string) {
  const policy = checkPasswordPolicy(password)
  if (!policy.valid) {
    throw new AuthError(policy.errors.join(' '), 422)
  }
}

async function createEmailVerification(userId: string, email: string) {
  const { raw, hash } = generateSecureToken()
  await prisma.emailVerificationToken.create({
    data: {
      userId,
      tokenHash: hash,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
    },
  })
  await sendVerificationEmail(email, raw)
}

export async function registerUsuario(input: {
  nombre: string
  email: string
  password: string
  telefono: string
  direccion: {
    calle: string; numero: string; colonia: string; cp: string; ciudad: string
    estado: string; referencias?: string
  }
}) {
  await assertEmailAvailable(input.email)
  assertStrongPassword(input.password)

  const passwordHash = await hashPassword(input.password)

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      nombre: input.nombre,
      telefono: input.telefono,
      rol: 'USUARIO',
      status: 'ACTIVO', // el usuario final no requiere aprobación del admin
      addresses: {
        create: {
          etiqueta: 'Casa',
          calle: input.direccion.calle,
          numero: input.direccion.numero,
          colonia: input.direccion.colonia,
          cp: input.direccion.cp,
          ciudad: input.direccion.ciudad,
          estado: input.direccion.estado,
          referencias: input.direccion.referencias,
          predeterminada: true,
        },
      },
    },
  })

  await createEmailVerification(user.id, user.email)
  return { userId: user.id }
}

export async function registerLocal(input: {
  nombreNegocio: string
  email: string
  password: string
  telefono: string
  direccion: string
}) {
  await assertEmailAvailable(input.email)
  assertStrongPassword(input.password)

  const passwordHash = await hashPassword(input.password)

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      nombre: input.nombreNegocio,
      telefono: input.telefono,
      rol: 'LOCAL',
      status: 'PENDIENTE', // requiere aprobación del admin — ver AdminPanel
      restaurant: {
        create: {
          nombre: input.nombreNegocio,
          categoria: 'Sin categoría',
          tiempoEntrega: '—',
          deliveryFeeTexto: '—',
          deliveryFee: 0,
          coverImg: '', // se completa después vía el módulo de subida de imágenes
          direccion: input.direccion,
          status: 'PENDIENTE',
        },
      },
    },
  })

  await createEmailVerification(user.id, user.email)
  return { userId: user.id }
}

export async function registerRepartidor(input: {
  nombre: string
  email: string
  password: string
  telefono: string
  tieneVehiculo: boolean
  vehiculo?: string
  fotoUrl?: string
}) {
  await assertEmailAvailable(input.email)
  assertStrongPassword(input.password)

  const passwordHash = await hashPassword(input.password)
  const matricula = await generateUniqueMatricula()

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      nombre: input.nombre,
      telefono: input.telefono,
      rol: 'REPARTIDOR',
      status: 'PENDIENTE', // requiere aprobación del admin
      driverProfile: {
        create: {
          matricula,
          tieneVehiculo: input.tieneVehiculo,
          vehiculo: input.vehiculo,
          fotoUrl: input.fotoUrl,
        },
      },
    },
  })

  await createEmailVerification(user.id, user.email)
  return { userId: user.id, matricula }
}

async function generateUniqueMatricula(): Promise<string> {
  // Reintenta si por rarísima coincidencia el número ya existe —
  // mismo formato REP-XXXXXX que ya usa el frontend.
  for (let i = 0; i < 5; i++) {
    const n = Math.floor(100000 + Math.random() * 900000)
    const candidate = `REP-${n}`
    const exists = await prisma.driverProfile.findUnique({ where: { matricula: candidate } })
    if (!exists) return candidate
  }
  throw new AuthError('No se pudo generar una matrícula única, intenta de nuevo.', 500)
}

// ------------------------------------------------------------
// LOGIN
// ------------------------------------------------------------

export async function login(email: string, password: string, ip: string) {
  const user = await prisma.user.findUnique({ where: { email } })

  // No reveles si el correo existe o no — mismo mensaje en ambos casos.
  if (!user) {
    throw new AuthError(GENERIC_LOGIN_ERROR, 401)
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const minutosRestantes = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000)
    throw new AuthError(`Cuenta bloqueada temporalmente. Intenta de nuevo en ${minutosRestantes} minuto(s).`, 423)
  }

  const passwordOk = await verifyPassword(user.passwordHash, password)

  if (!passwordOk) {
    const attempts = user.failedLoginAttempts + 1
    const shouldLock = attempts >= MAX_FAILED_ATTEMPTS

    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: shouldLock ? 0 : attempts,
        lockedUntil: shouldLock ? new Date(Date.now() + LOCK_DURATION_MS) : null,
      },
    })

    if (shouldLock) {
      await sendAccountLockedAlert(user.email)
    }

    throw new AuthError(GENERIC_LOGIN_ERROR, 401)
  }

  // Login correcto — resetea el contador de intentos fallidos.
  if (user.failedLoginAttempts > 0) {
    await prisma.user.update({ where: { id: user.id }, data: { failedLoginAttempts: 0, lockedUntil: null } })
  }

  if (user.status === 'SUSPENDIDO') {
    throw new AuthError('Tu cuenta ha sido suspendida. Contacta a soporte.', 403)
  }
  if (user.status === 'PENDIENTE') {
    throw new AuthError('Tu cuenta está pendiente de aprobación. Te avisaremos por correo cuando esté lista.', 403)
  }
  if (user.status === 'RECHAZADO') {
    throw new AuthError('Tu solicitud fue rechazada. Contacta a soporte para más información.', 403)
  }

  return issueTokens(user.id, user.rol)
}

async function issueTokens(userId: string, rol: string) {
  const accessToken = signAccessToken({ userId, rol })
  const refreshToken = signRefreshToken(userId)

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  })

  return { accessToken, refreshToken }
}

// ------------------------------------------------------------
// REFRESH — rota el refresh token en cada uso (mejor práctica: un
// refresh token robado y luego usado por el atacante invalida el del
// dueño legítimo también, lo cual actúa como señal de alarma)
// ------------------------------------------------------------

export async function refreshSession(oldRefreshToken: string) {
  let payload: { userId: string }
  try {
    payload = verifyRefreshToken(oldRefreshToken)
  } catch {
    throw new AuthError('Sesión inválida, inicia sesión de nuevo.', 401)
  }

  const tokenHash = hashToken(oldRefreshToken)
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } })

  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    throw new AuthError('Sesión inválida, inicia sesión de nuevo.', 401)
  }

  const user = await prisma.user.findUnique({ where: { id: payload.userId } })
  if (!user || user.status !== 'ACTIVO') {
    throw new AuthError('Sesión inválida, inicia sesión de nuevo.', 401)
  }

  // Revoca el token viejo y emite uno nuevo (rotación).
  await prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } })

  return issueTokens(user.id, user.rol)
}

export async function logout(refreshToken: string) {
  const tokenHash = hashToken(refreshToken)
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  })
}

// Revoca TODAS las sesiones activas de un usuario — útil para
// "cerrar sesión en todos los dispositivos" o si detectas actividad
// sospechosa en una cuenta.
export async function revokeAllSessions(userId: string) {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  })
}

// ------------------------------------------------------------
// VERIFICACIÓN DE CORREO
// ------------------------------------------------------------

export async function verifyEmail(rawToken: string) {
  const tokenHash = hashToken(rawToken)
  const record = await prisma.emailVerificationToken.findUnique({ where: { tokenHash } })

  if (!record || record.expiresAt < new Date()) {
    throw new AuthError('El enlace de verificación es inválido o expiró.', 400)
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { emailVerified: true } }),
    prisma.emailVerificationToken.delete({ where: { id: record.id } }),
  ])
}

// ------------------------------------------------------------
// RECUPERACIÓN DE CONTRASEÑA
// ------------------------------------------------------------

export async function requestPasswordReset(email: string) {
  const user = await prisma.user.findUnique({ where: { email } })

  // Responde igual exista o no la cuenta — evita enumeración de usuarios
  // también en este endpoint. El controller siempre devuelve el mismo
  // mensaje de éxito sin importar lo que pase aquí adentro.
  if (!user) return

  const { raw, hash } = generateSecureToken()
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: hash,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hora
    },
  })
  await sendPasswordResetEmail(user.email, raw)
}

export async function resetPassword(rawToken: string, newPassword: string) {
  assertStrongPassword(newPassword)

  const tokenHash = hashToken(rawToken)
  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } })

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    throw new AuthError('El enlace de recuperación es inválido o expiró.', 400)
  }

  const passwordHash = await hashPassword(newPassword)

  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    // Al cambiar la contraseña, revoca todas las sesiones activas —
    // si alguien más tenía acceso, se cae en cuanto se cambia la clave.
  ])
  await revokeAllSessions(record.userId)
}

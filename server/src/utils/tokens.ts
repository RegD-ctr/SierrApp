// Destino: server/src/utils/tokens.ts
//
// Instala primero:
//   pnpm add jsonwebtoken
//   pnpm add -D @types/jsonwebtoken

import jwt from 'jsonwebtoken'
import crypto from 'node:crypto'

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET

if (!ACCESS_SECRET || !REFRESH_SECRET) {
  throw new Error('JWT_ACCESS_SECRET y JWT_REFRESH_SECRET deben estar definidos en .env')
}

const validAccessSecret: string = ACCESS_SECRET
const validRefreshSecret: string = REFRESH_SECRET

export interface AccessTokenPayload {
  userId: string
  rol: string
}

// Corta duración a propósito: si un access token se filtra, la ventana
// de daño es de minutos, no de días.
export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, validAccessSecret, { expiresIn: '15m' })
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, validAccessSecret) as unknown as AccessTokenPayload
}

// El refresh token JWT solo lleva el userId — su validez real depende
// de que el HASH correspondiente siga existiendo y no esté revocado en
// la tabla RefreshToken (ver auth.service.ts). Esto es lo que permite
// "cerrar sesión en todos los dispositivos" de verdad.
export function signRefreshToken(userId: string): string {
  return jwt.sign({ userId }, validRefreshSecret, { expiresIn: '7d' })
}

export function verifyRefreshToken(token: string): { userId: string } {
  return jwt.verify(token, validRefreshSecret) as unknown as { userId: string }
}

// Para hashear el refresh token antes de guardarlo en la base de datos
// (nunca se guarda el JWT en texto plano — si alguien copia la base de
// datos, no puede reusar sesiones directamente).
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

// Tokens de un solo uso para verificación de correo / reseteo de
// contraseña. Se genera un valor random que se manda por correo, y se
// guarda solo su hash en la base de datos — igual que con contraseñas,
// nunca guardes el secreto real.
export function generateSecureToken(): { raw: string; hash: string } {
  const raw = crypto.randomBytes(32).toString('hex')
  const hash = crypto.createHash('sha256').update(raw).digest('hex')
  return { raw, hash }
}

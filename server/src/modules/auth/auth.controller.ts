import type { Request, Response } from 'express'
import * as authService from './auth.service'
import {
  registerUsuarioSchema,
  registerLocalSchema,
  registerRepartidorSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from './auth.validation'

const REFRESH_COOKIE_NAME = 'sierra_refresh'
const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/api/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000,
}

function handleError(res: Response, err: unknown) {
  if (err instanceof authService.AuthError) {
    return res.status(err.status).json({ error: err.message })
  }
  console.error(err)
  return res.status(500).json({ error: 'Ocurrió un error inesperado.' })
}

export async function registerUsuario(req: Request, res: Response) {
  try {
    const input = registerUsuarioSchema.parse(req.body)
    const result = await authService.registerUsuario(input)
    res.status(201).json({ message: 'Cuenta creada. Revisa tu correo para verificarla.', ...result })
  } catch (err) {
    handleError(res, err)
  }
}

export async function registerLocal(req: Request, res: Response) {
  try {
    const input = registerLocalSchema.parse(req.body)
    const result = await authService.registerLocal(input)
    res.status(201).json({ message: 'Solicitud enviada. Un administrador revisará tu negocio pronto.', ...result })
  } catch (err) {
    handleError(res, err)
  }
}

export async function registerRepartidor(req: Request, res: Response) {
  try {
    const input = registerRepartidorSchema.parse(req.body)
    const result = await authService.registerRepartidor(input)
    res.status(201).json({ message: 'Solicitud enviada. Un administrador revisará tu perfil pronto.', ...result })
  } catch (err) {
    handleError(res, err)
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = loginSchema.parse(req.body)
    const ip = req.ip ?? 'unknown'
    const { accessToken, refreshToken } = await authService.login(email, password, ip)

    res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions)
    res.json({ accessToken })
  } catch (err) {
    handleError(res, err)
  }
}

export async function refresh(req: Request, res: Response) {
  try {
    const oldToken = req.cookies?.[REFRESH_COOKIE_NAME]
    if (!oldToken) return res.status(401).json({ error: 'No hay sesión activa.' })

    const { accessToken, refreshToken } = await authService.refreshSession(oldToken)
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions)
    res.json({ accessToken })
  } catch (err) {
    handleError(res, err)
  }
}

export async function logout(req: Request, res: Response) {
  const token = req.cookies?.[REFRESH_COOKIE_NAME]
  if (token) await authService.logout(token)
  res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/auth' })
  res.json({ message: 'Sesión cerrada.' })
}

export async function verifyEmail(req: Request, res: Response) {
  try {
    const { token } = verifyEmailSchema.parse(req.body)
    await authService.verifyEmail(token)
    res.json({ message: 'Correo verificado correctamente.' })
  } catch (err) {
    handleError(res, err)
  }
}

export async function forgotPassword(req: Request, res: Response) {
  try {
    const { email } = forgotPasswordSchema.parse(req.body)
    await authService.requestPasswordReset(email)
    res.json({ message: 'Si el correo existe, enviamos un enlace para restablecer tu contraseña.' })
  } catch (err) {
    handleError(res, err)
  }
}

export async function resetPassword(req: Request, res: Response) {
  try {
    const { token, newPassword } = resetPasswordSchema.parse(req.body)
    await authService.resetPassword(token, newPassword)
    res.json({ message: 'Contraseña actualizada. Ya puedes iniciar sesión.' })
  } catch (err) {
    handleError(res, err)
  }
}

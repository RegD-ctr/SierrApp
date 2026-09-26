import type { Request, Response, NextFunction } from 'express'
import { verifyAccessToken } from '../utils/tokens'

declare global {
  namespace Express {
    interface Request {
      user?: { userId: string; rol: string }
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autenticado.' })
  }

  const token = authHeader.slice('Bearer '.length)

  try {
    const payload = verifyAccessToken(token)
    req.user = payload
    next()
  } catch {
    return res.status(401).json({ error: 'Sesión inválida o expirada.' })
  }
}

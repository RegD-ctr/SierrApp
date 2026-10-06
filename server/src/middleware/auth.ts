// Destino: server/src/middleware/auth.ts

import type { Request, Response, NextFunction } from 'express'
import { verifyAccessToken } from '../utils/tokens'

// Extiende el tipo Request para poder usar req.user en el resto del código
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
    // Cubre tanto token inválido como expirado — el frontend debe
    // reaccionar a un 401 intentando refrescar con el refresh token.
    return res.status(401).json({ error: 'Sesión inválida o expirada.' })
  }
}

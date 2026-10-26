// Destino: server/src/middleware/auth.ts

import type { Request, Response, NextFunction } from 'express'
import { verifyAccessToken } from '../utils/tokens'
import { prisma } from '../db/prisma'

// Extiende el tipo Request para poder usar req.user en el resto del código
declare global {
  namespace Express {
    interface Request {
      user?: { userId: string; rol: string }
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autenticado.' })
  }

  const token = authHeader.slice('Bearer '.length)

  try {
    const payload = verifyAccessToken(token)
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, rol: true, status: true },
    })
    if (!user || user.status !== 'ACTIVO') {
      return res.status(403).json({ error: 'Cuenta inactiva o suspendida.' })
    }
    req.user = { userId: user.id, rol: user.rol }
    next()
  } catch {
    // Cubre tanto token inválido como expirado — el frontend debe
    // reaccionar a un 401 intentando refrescar con el refresh token.
    return res.status(401).json({ error: 'Sesión inválida o expirada.' })
  }
}

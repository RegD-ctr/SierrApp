import type { Request, Response, NextFunction } from 'express'

export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado.' })
    }
    if (!allowedRoles.includes(req.user.rol)) {
      return res.status(403).json({ error: 'No tienes permiso para esta acción.' })
    }
    next()
  }
}

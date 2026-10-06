// Destino: server/src/app.ts
//
// Instala primero:
//   pnpm add express helmet cors cookie-parser
//   pnpm add -D @types/express @types/cors @types/cookie-parser

import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { authRouter } from './modules/auth/auth.routes'
import { restaurantsRouter } from './modules/restaurants/restaurants.routes'
import { ordersRouter } from './modules/orders/orders.routes'
import { usersRouter } from './modules/users/users.routes'
import { uploadsRouter } from './modules/uploads/uploads.routes'
import { adminRouter } from './modules/admin/admin.routes'
import { notificationsRouter } from './modules/notifications/notifications.routes'
import { promotionsRouter } from './modules/promotions/promotions.routes'
import { supportRouter } from './modules/support/support.routes'
import { UPLOAD_DIR } from './modules/uploads/uploads.service'
import { generalLimiter } from './middleware/rateLimiter'

export const app = express()

// Cabeceras HTTP seguras por default (previene varios ataques comunes:
// sniffing de MIME, clickjacking, etc.)
app.use(helmet())

// Configuración de CORS dinámica: en desarrollo permite localhost (cualquier puerto),
// 127.0.0.1, IPs de red local y el origen configurado; en producción restringe a CORS_ORIGIN.
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true)
      if (process.env.NODE_ENV !== 'production') {
        return callback(null, true)
      }
      const allowed = [process.env.CORS_ORIGIN, 'http://localhost:8443'].filter(Boolean)
      if (allowed.includes(origin)) {
        return callback(null, true)
      }
      callback(new Error('Bloqueado por CORS'))
    },
    credentials: true,
  })
)

app.use(cookieParser())

// Límite de tamaño del body — previene payloads gigantes como vector
// de denegación de servicio.
app.use(express.json({ limit: '1mb' }))

app.use(
  '/uploads',
  express.static(UPLOAD_DIR, {
    index: false,
    dotfiles: 'deny',
    setHeaders: res => {
      // Helmet pone "same-origin" por default, lo que bloquearía que el
      // frontend (otro origen) muestre estas imágenes.
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
      // Los nombres son UUID únicos, así que es seguro cachear "para siempre".
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
    },
  })
)

app.use(generalLimiter)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/auth', authRouter)
app.use('/api/restaurants', restaurantsRouter)
app.use('/api/orders', ordersRouter)
app.use('/api/users', usersRouter)
app.use('/api/admin', adminRouter)
app.use('/api/notifications', notificationsRouter)
app.use('/api/promotions', promotionsRouter)
app.use('/api/support', supportRouter)
app.use('/api/uploads', uploadsRouter)

// Manejador de errores de último recurso — nunca dejes que un error
// no capturado filtre un stack trace al cliente en producción.
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err)
  res.status(500).json({ error: 'Ocurrió un error inesperado.' })
})

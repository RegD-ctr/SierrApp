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
import { generalLimiter } from './middleware/rateLimiter'

export const app = express()

// Cabeceras HTTP seguras por default (previene varios ataques comunes:
// sniffing de MIME, clickjacking, etc.)
app.use(helmet())

// Solo el frontend de Sierra App puede hacer requests con credenciales
// (cookies) — cualquier otro origen es rechazado por el navegador.
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
)

app.use(cookieParser())

// Límite de tamaño del body — previene payloads gigantes como vector
// de denegación de servicio.
app.use(express.json({ limit: '1mb' }))

app.use(generalLimiter)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/auth', authRouter)
app.use('/api/restaurants', restaurantsRouter)
app.use('/api/orders', ordersRouter)

// Manejador de errores de último recurso — nunca dejes que un error
// no capturado filtre un stack trace al cliente en producción.
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err)
  res.status(500).json({ error: 'Ocurrió un error inesperado.' })
})

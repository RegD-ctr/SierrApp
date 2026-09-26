import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { authRouter } from './modules/auth/auth.routes'
import { generalLimiter } from './middleware/rateLimiter'

export const app = express()

app.use(helmet())

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
)

app.use(cookieParser())

app.use(express.json({ limit: '1mb' }))

app.use(generalLimiter)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/auth', authRouter)

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err)
  res.status(500).json({ error: 'Ocurrió un error inesperado.' })
})

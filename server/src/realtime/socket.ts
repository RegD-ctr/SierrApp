import { Server as SocketIOServer } from 'socket.io'
import type { Server as HTTPServer } from 'node:http'
import { verifyAccessToken } from '../utils/tokens'
import { prisma } from '../db/prisma'

let io: SocketIOServer | null = null

export function initSocket(httpServer: HTTPServer) {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === 'production' ? (process.env.CORS_ORIGIN || 'http://localhost:8443') : true,
      credentials: true,
    },
  })

  // Autenticación del socket: el cliente manda el mismo accessToken que
  // ya usa para las llamadas REST, en el handshake (no en una cookie —
  // los sockets no comparten el mecanismo httpOnly del refresh token).
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token
    if (!token) return next(new Error('No autenticado.'))
    try {
      const payload = verifyAccessToken(token)
      socket.data.userId = payload.userId
      socket.data.rol = payload.rol
      next()
    } catch {
      next(new Error('Token inválido o expirado.'))
    }
  })

  io.on('connection', async socket => {
    const { userId, rol } = socket.data

    // Todo usuario conectado se une a su propio canal personal — es
    // donde llegan sus notificaciones persistidas y avisos de sus
    // propios pedidos.
    socket.join(`user:${userId}`)

    if (rol === 'REPARTIDOR') {
      // Pool de repartidores conectados — aquí se transmiten los
      // pedidos disponibles en tiempo real.
      socket.join('drivers:online')
    }

    if (rol === 'ADMIN') {
      socket.join('admin')
    }

    socket.on('disconnect', () => {
      // socket.io limpia las salas solo — no hace falta salir a mano.
    })
  })

  return io
}

function getIO(): SocketIOServer {
  if (!io) {
    throw new Error('Socket.io no se ha inicializado. Llama a initSocket() primero.')
  }
  return io
}

// --- Broadcasts efímeros (no se guardan en base de datos) ---

export function broadcastToDrivers(event: string, payload: unknown) {
  getIO().to('drivers:online').emit(event, payload)
}

export function emitToUser(userId: string, event: string, payload: unknown) {
  getIO().to(`user:${userId}`).emit(event, payload)
}

export function emitToAdmins(event: string, payload: unknown) {
  getIO().to('admin').emit(event, payload)
}

// --- Notificación persistida + push en el mismo paso ---
// Esta es la función que va a usarse en las Partes 2 y 3 para avisar
// cosas que sí deben quedar en el historial del usuario (bandeja de
// notificaciones), a diferencia de los broadcasts efímeros de arriba.

export async function createNotification(userId: string, tipo: string, titulo: string, mensaje: string) {
  const notification = await prisma.notification.create({
    data: { userId, tipo, titulo, mensaje },
  })
  emitToUser(userId, 'notification:new', notification)
  return notification
}

// Notifica a TODOS los admins a la vez — persiste una notificación por 
// cada uno (puede haber más de un admin) y transmite el aviso en vivo a 
// los que estén conectados en ese momento.
export async function notifyAdmins(tipo: string, titulo: string, mensaje: string) {
  const admins = await prisma.user.findMany({
    where: { rol: 'ADMIN' },
    select: { id: true },
  })

  await Promise.all(
    admins.map(async admin => {
      await createNotification(admin.id, tipo, titulo, mensaje)
    })
  )

  emitToAdmins('admin:alert', { tipo, titulo, mensaje })
}

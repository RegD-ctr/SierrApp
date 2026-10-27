import { io, type Socket } from 'socket.io-client'
import { getApiBaseUrl } from './api'

let socket: Socket | null = null

// Se llama justo después de un login exitoso (o de restoreSession()),
// pasándole el accessToken vigente.
export function connectSocket(accessToken: string) {
  if (socket) {
    socket.auth = { token: accessToken }
    if (!socket.connected) {
      socket.connect()
    }
    return socket
  }

  const socketUrl = getApiBaseUrl()
  socket = io(socketUrl || undefined, {
    auth: { token: accessToken },
    autoConnect: true,
  })

  return socket
}

export function updateSocketToken(accessToken: string) {
  if (socket) {
    socket.auth = { token: accessToken }
  }
}

// Se llama en logout.
export function disconnectSocket() {
  socket?.disconnect()
  socket = null
}

export function getSocket(): Socket | null {
  return socket
}

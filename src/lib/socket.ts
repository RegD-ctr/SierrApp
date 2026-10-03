import { io, type Socket } from 'socket.io-client'
import { getApiBaseUrl } from './api'

const SOCKET_URL = getApiBaseUrl()

let socket: Socket | null = null

// Se llama justo después de un login exitoso (o de restoreSession()), 
// pasándole el accessToken vigente.
export function connectSocket(accessToken: string) {
  if (socket?.connected) return socket

  socket = io(SOCKET_URL || undefined, {
    auth: { token: accessToken },
    autoConnect: true,
  })

  return socket
}

// Se llama en logout.
export function disconnectSocket() {
  socket?.disconnect()
  socket = null
}

export function getSocket(): Socket | null {
  return socket
}


import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export function getSocket(): Socket {
  if (!socket) {
    socket = io({
      path: '/api/socket/io',
      addTrailingSlash: false,
      autoConnect: false,
    })
  }
  return socket
}

export function connectSocket(): Socket {
  const s = getSocket()
  if (!s.connected) {
    s.connect()
  }
  return s
}

export function disconnectSocket(): void {
  if (socket?.connected) {
    socket.disconnect()
  }
}

export function joinRoom(roomId: string): void {
  const s = getSocket()
  if (s.connected) {
    s.emit('join-room', roomId)
  }
}

export function leaveRoom(roomId: string): void {
  const s = getSocket()
  if (s.connected) {
    s.emit('leave-room', roomId)
  }
}

export function sendMessage(roomId: string, message: unknown): void {
  const s = getSocket()
  if (s.connected) {
    s.emit('send-message', { roomId, message })
  }
}

export function onNewMessage(callback: (message: unknown) => void): void {
  const s = getSocket()
  s.on('new-message', callback)
}

export function offNewMessage(): void {
  const s = getSocket()
  s.off('new-message')
}


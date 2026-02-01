

const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { Server } = require('socket.io')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = parseInt(process.env.PORT || '3000', 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true)
    handle(req, res, parsedUrl)
  })

  const io = new Server(httpServer, {
    path: '/api/socket/io',
    addTrailingSlash: false,
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  })

  io.on('connection', (socket) => {
    console.log(`🔌 Cliente conectado: ${socket.id}`)

    socket.on('join-room', (roomId) => {
      socket.join(roomId)
      console.log(`👥 Socket ${socket.id} entrou na sala: ${roomId}`)
    })

    socket.on('leave-room', (roomId) => {
      socket.leave(roomId)
      console.log(`👋 Socket ${socket.id} saiu da sala: ${roomId}`)
    })

    socket.on('send-message', ({ roomId, message }) => {

      socket.to(roomId).emit('new-message', message)
      console.log(`💬 Mensagem enviada na sala ${roomId}`)
    })

    socket.on('typing', ({ roomId, userName }) => {
      socket.to(roomId).emit('user-typing', { userName })
    })

    socket.on('stop-typing', ({ roomId }) => {
      socket.to(roomId).emit('user-stop-typing')
    })

    socket.on('disconnect', () => {
      console.log(`❌ Cliente desconectado: ${socket.id}`)
    })
  })

  httpServer.listen(port, () => {
    console.log(`
    ╔═══════════════════════════════════════════════════╗
    ║                                                   ║
    ║   🚗 Takahashi - Servidor Iniciado ║
    ║                                                   ║
    ║   Local:   http:
    ║   Socket:  Conectado ✓                            ║
    ║                                                   ║
    ╚═══════════════════════════════════════════════════╝
    `)
  })
})


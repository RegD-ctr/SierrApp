import 'dotenv/config'
import { createServer } from 'node:http'
import { app } from './app'
import { initSocket } from './realtime/socket'

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000

const httpServer = createServer(app)
initSocket(httpServer)

httpServer.listen(PORT, () => {
  console.log(`Servidor de Sierra App corriendo en http://localhost:${PORT}`)
})

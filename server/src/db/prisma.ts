// Destino: server/src/db/prisma.ts
//
// Prisma 7 requiere un "driver adapter" explícito para crear el cliente
// (ya no basta con `new PrismaClient()` a secas). Instala primero:
//
//   pnpm add @prisma/adapter-pg pg
//   pnpm add -D @types/pg

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL no está definida en las variables de entorno.')
}

const adapter = new PrismaPg({ connectionString })

// Instancia única reutilizada en toda la app — evita abrir una conexión
// nueva por cada import.
export const prisma = new PrismaClient({ adapter })

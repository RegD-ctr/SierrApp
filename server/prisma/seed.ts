import 'dotenv/config'
import { prisma } from '../src/db/prisma'
import { hashPassword } from '../src/utils/password'

async function main() {
  const existingConfig = await prisma.platformConfig.findUnique({ where: { id: 'singleton' } })
  if (!existingConfig) {
    await prisma.platformConfig.create({
      data: {
        id: 'singleton',
        comisionLocalPorcentaje: 15,
        comisionRepartidorFija: 20,
        comisionUsuarioFija: 5,
      },
    })
    console.log('✅ PlatformConfig creado con valores default (15% / $20 / $5).')
  } else {
    console.log('ℹ️  PlatformConfig ya existía, no se tocó.')
  }

  const adminEmail = process.env.ADMIN_SEED_EMAIL
  const adminPassword = process.env.ADMIN_SEED_PASSWORD

  if (!adminEmail || !adminPassword) {
    console.warn('⚠️  ADMIN_SEED_EMAIL / ADMIN_SEED_PASSWORD no están definidos en .env — se omitió la creación del admin.')
    return
  }

  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } })
  if (existingAdmin) {
    console.log(`ℹ️  Ya existe una cuenta con el correo ${adminEmail}, no se creó otra.`)
    return
  }

  const passwordHash = await hashPassword(adminPassword)
  await prisma.user.create({
    data: {
      email: adminEmail,
      passwordHash,
      nombre: 'Administrador',
      rol: 'ADMIN',
      status: 'ACTIVO',
      emailVerified: true,
    },
  })
  console.log(`✅ Cuenta admin creada: ${adminEmail}`)
}

main()
  .catch(err => {
    console.error('❌ Error corriendo el seed:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

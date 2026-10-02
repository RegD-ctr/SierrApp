import { prisma } from '../../db/prisma'

export async function listActivePromotions() {
  const now = new Date()
  return prisma.promotion.findMany({
    where: {
      activo: true,
      restaurant: { status: 'ACTIVO' },
      OR: [
        { vigenciaInicio: null, vigenciaFin: null },
        { vigenciaInicio: { lte: now }, vigenciaFin: { gte: now } },
        { vigenciaInicio: { lte: now }, vigenciaFin: null },
        { vigenciaInicio: null, vigenciaFin: { gte: now } },
      ],
    },
    orderBy: { createdAt: 'desc' },
    include: { restaurant: { select: { id: true, nombre: true, coverImg: true, categoria: true } } },
  })
}

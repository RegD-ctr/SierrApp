import { z } from 'zod'

export const idParamSchema = z.object({
  id: z.string().uuid('ID inválido'),
})

export const updateConfigSchema = z.object({
  comisionLocalPorcentaje: z.number().min(0).max(100).optional(),
  comisionRepartidorFija: z.number().min(0).max(1000).optional(),
  comisionUsuarioFija: z.number().min(0).max(1000).optional(),
})

import { z } from 'zod'

export const createZoneSchema = z.object({
  nombre: z.string().trim().min(2).max(100),
})

export const updateZoneSchema = z.object({
  nombre: z.string().trim().min(2).max(100).optional(),
  activa: z.boolean().optional(),
})

export const idParamSchema = z.object({
  id: z.string().uuid(),
})

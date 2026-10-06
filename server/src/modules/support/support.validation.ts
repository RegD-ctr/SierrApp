import { z } from 'zod'

export const sendMessageSchema = z.object({
  mensaje: z.string().trim().min(1).max(1000),
  orderId: z.string().uuid().optional(),
})

export const userIdParamSchema = z.object({
  userId: z.string().uuid('ID de usuario inválido'),
})

import { z } from 'zod'

const orderItemInputSchema = z.object({
  dishId: z.string().uuid('ID de platillo inválido'),
  cantidad: z.number().int().min(1).max(50),
  notas: z.string().trim().max(200).optional(),
  selectedOptionItemIds: z.array(z.string().uuid()).max(30).default([]),
})

export const createOrderSchema = z.object({
  restaurantId: z.string().uuid('ID de restaurante inválido'),
  addressId: z.string().uuid('ID de dirección inválido'),
  metodoPago: z.enum(['TARJETA', 'EFECTIVO', 'VENTANILLA']),
  instrucciones: z.string().trim().max(300).optional(),
  items: z.array(orderItemInputSchema).min(1, 'El pedido debe tener al menos un platillo').max(50),
})

export const idParamSchema = z.object({
  id: z.string().uuid('ID de pedido inválido'),
})

export const rateOrderSchema = z.object({
  ratingRestaurant: z.number().int().min(0).max(5),
  ratingRepartidor: z.number().int().min(0).max(5).optional(),
  comentario: z.string().trim().max(500).optional(),
})

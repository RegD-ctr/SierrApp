// Destino: server/src/modules/restaurants/restaurants.validation.ts

import { z } from 'zod'
import { uploadedImagePathSchema } from '../uploads/uploads.validation'

export const updateRestaurantSchema = z.object({
  nombre: z.string().trim().min(2).max(100).optional(),
  categoria: z.string().trim().min(2).max(50).optional(),
  tiempoEntrega: z.string().trim().min(1).max(30).optional(),
  deliveryFee: z.number().min(0).max(500).optional(),
  deliveryFeeTexto: z.string().trim().max(50).optional(),
  direccion: z.string().trim().min(5).max(200).optional(),
  coverImg: uploadedImagePathSchema.optional(),
  badge: z.string().trim().max(30).optional(),
})

export const toggleOpenSchema = z.object({
  isOpen: z.boolean(),
})

export const createDishSchema = z.object({
  nombre: z.string().trim().min(2).max(100),
  descripcion: z.string().trim().max(300).default(''),
  categoria: z.string().trim().min(2).max(50),
  precio: z.number().positive().max(50000),
  imagen: uploadedImagePathSchema.optional(),
})

export const updateDishSchema = z.object({
  nombre: z.string().trim().min(2).max(100).optional(),
  descripcion: z.string().trim().max(300).optional(),
  categoria: z.string().trim().min(2).max(50).optional(),
  precio: z.number().positive().max(50000).optional(),
  imagen: uploadedImagePathSchema.optional(),
  disponible: z.boolean().optional(),
})

export const listRestaurantsQuerySchema = z.object({
  categoria: z.string().trim().max(50).optional(),
  search: z.string().trim().max(100).optional(),
  take: z.coerce.number().int().min(1).max(100).default(50),
  skip: z.coerce.number().int().min(0).default(0),
})

export const idParamSchema = z.object({
  id: z.string().uuid('ID inválido'),
})

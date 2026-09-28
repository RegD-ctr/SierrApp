import { z } from 'zod'

export const createAddressSchema = z.object({
  etiqueta: z.string().trim().min(1).max(30),
  calle: z.string().trim().min(2).max(150),
  numero: z.string().trim().min(1).max(20),
  colonia: z.string().trim().min(2).max(100),
  cp: z.string().trim().min(4).max(10),
  ciudad: z.string().trim().min(2).max(100),
  estado: z.string().trim().min(2).max(100),
  referencias: z.string().trim().max(300).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  predeterminada: z.boolean().optional(),
})

// La dirección predeterminada solo se cambia con su endpoint propio
// (/default), no editando el campo directamente.
export const updateAddressSchema = createAddressSchema.omit({ predeterminada: true }).partial()

export const idParamSchema = z.object({
  id: z.string().uuid('ID inválido'),
})

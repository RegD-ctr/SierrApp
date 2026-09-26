import { z } from 'zod'

const emailSchema = z.string().trim().toLowerCase().email('Correo inválido').max(255)
const passwordSchema = z.string().min(10).max(128)
const telefonoSchema = z.string().regex(/^[0-9 +()-]{7,20}$/, 'Teléfono inválido')

export const registerUsuarioSchema = z.object({
  nombre: z.string().trim().min(2).max(100),
  email: emailSchema,
  password: passwordSchema,
  telefono: telefonoSchema,
  direccion: z.object({
    calle: z.string().trim().min(2).max(150),
    numero: z.string().trim().min(1).max(20),
    colonia: z.string().trim().min(2).max(100),
    cp: z.string().trim().min(4).max(10),
    ciudad: z.string().trim().min(2).max(100),
    estado: z.string().trim().min(2).max(100),
    referencias: z.string().trim().max(300).optional(),
  }),
})

export const registerLocalSchema = z.object({
  nombreNegocio: z.string().trim().min(2).max(100),
  email: emailSchema,
  password: passwordSchema,
  telefono: telefonoSchema,
  direccion: z.string().trim().min(5).max(200),
})

export const registerRepartidorSchema = z.object({
  nombre: z.string().trim().min(2).max(100),
  email: emailSchema,
  password: passwordSchema,
  telefono: telefonoSchema,
  tieneVehiculo: z.boolean(),
  vehiculo: z.string().trim().max(100).optional(),
  fotoUrl: z.string().url().optional(),
})

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
})

export const forgotPasswordSchema = z.object({
  email: emailSchema,
})

export const resetPasswordSchema = z.object({
  token: z.string().min(10),
  newPassword: passwordSchema,
})

export const verifyEmailSchema = z.object({
  token: z.string().min(10),
})

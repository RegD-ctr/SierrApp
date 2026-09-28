import { z } from 'zod'

// Las imágenes se guardan como ruta relativa. El servidor las genera
// con nombre aleatorio (UUID) y siempre en formato .webp, así que solo
// aceptamos exactamente ese formato.
export const uploadedImagePathSchema = z
  .string()
  .regex(
    /^\/uploads\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.webp$/,
    'La imagen debe subirse primero a través de la plataforma.'
  )

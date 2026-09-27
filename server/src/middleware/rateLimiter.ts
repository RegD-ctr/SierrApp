// Destino: server/src/middleware/rateLimiter.ts
//
// Instala primero:
//   pnpm add express-rate-limit

import rateLimit from 'express-rate-limit'

// Límite estricto para login: previene fuerza bruta contra una cuenta
// específica, más allá del bloqueo de cuenta que ya maneja auth.service.ts.
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // 10 intentos por IP en esa ventana
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.' },
})

// Límite más permisivo para registro (menos frecuente, pero igual
// vulnerable a bots creando cuentas masivamente).
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados registros desde esta red. Inténtalo más tarde.' },
})

// Límite para solicitudes de reseteo de contraseña — evita que alguien
// spamee de correos de reseteo a una bandeja de entrada ajena.
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes. Inténtalo más tarde.' },
})

// Límite general para toda la API — una red de seguridad amplia.
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
})

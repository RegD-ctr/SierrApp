// Destino: server/src/utils/password.ts
//
// Instala primero:
//   pnpm add argon2

import argon2 from 'argon2'

// Parámetros de Argon2id recomendados por OWASP para un servicio web
// (memoria en KiB, iteraciones, paralelismo). Ajusta memoryCost hacia
// abajo solo si tu servidor de producción tiene muy poca RAM.
const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19456, // ~19 MB
  timeCost: 2,
  parallelism: 1,
} as const

export async function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain, ARGON2_OPTIONS)
}

export async function verifyPassword(hash: string, plain: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plain)
  } catch {
    // Un hash corrupto o con formato inesperado nunca debe tumbar el
    // login — simplemente se trata como contraseña incorrecta.
    return false
  }
}

export interface PasswordPolicyResult {
  valid: boolean
  errors: string[]
}

// Validado en el SERVIDOR, no solo en el frontend — un frontend se
// puede saltar con una llamada directa a la API.
export function checkPasswordPolicy(password: string): PasswordPolicyResult {
  const errors: string[] = []

  if (password.length < 10) {
    errors.push('La contraseña debe tener al menos 10 caracteres.')
  }
  if (password.length > 128) {
    errors.push('La contraseña es demasiado larga.')
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Debe incluir al menos una letra minúscula.')
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Debe incluir al menos una letra mayúscula.')
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Debe incluir al menos un número.')
  }

  // Lista corta de contraseñas triviales — bloquea los casos más obvios.
  // No sustituye un chequeo contra "haveibeenpwned" (opcional, ver nota
  // al final de este archivo), pero detiene el 90% de los intentos malos.
  const COMMON_PASSWORDS = ['password', 'contraseña', '12345678', 'qwerty123', 'sierraapp']
  if (COMMON_PASSWORDS.some(p => password.toLowerCase().includes(p))) {
    errors.push('Esta contraseña es demasiado común o predecible.')
  }

  return { valid: errors.length === 0, errors }
}

// MEJORA OPCIONAL (no incluida por simplicidad, pero recomendada más
// adelante): consultar la API pública de "Have I Been Pwned" (k-anonymity,
// no envía la contraseña completa) para rechazar contraseñas ya
// filtradas en brechas de datos conocidas. https://haveibeenpwned.com/API/v3

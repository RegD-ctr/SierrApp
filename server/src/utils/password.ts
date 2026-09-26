import argon2 from 'argon2'

const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
}

export async function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain, ARGON2_OPTIONS)
}

export async function verifyPassword(hash: string, plain: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plain)
  } catch {
    return false
  }
}

export interface PasswordPolicyResult {
  valid: boolean
  errors: string[]
}

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

  const COMMON_PASSWORDS = ['password', 'contraseña', '12345678', 'qwerty123', 'sierraapp']
  if (COMMON_PASSWORDS.some(p => password.toLowerCase().includes(p))) {
    errors.push('Esta contraseña es demasiado común o predecible.')
  }

  return { valid: errors.length === 0, errors }
}

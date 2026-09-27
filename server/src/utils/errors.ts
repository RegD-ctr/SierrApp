// Destino: server/src/utils/errors.ts
//
// Mismo concepto que AuthError en el módulo de auth, pero de nombre
// genérico para usarse en el resto de los módulos (restaurants, orders,
// etc.) sin acoplarlos al módulo de auth.

export class AppError extends Error {
  status: number
  constructor(message: string, status = 400) {
    super(message)
    this.status = status
  }
}

export function handleServiceError(err: unknown): { status: number; message: string } {
  if (err instanceof AppError) {
    return { status: err.status, message: err.message }
  }
  console.error(err)
  return { status: 500, message: 'Ocurrió un error inesperado.' }
}

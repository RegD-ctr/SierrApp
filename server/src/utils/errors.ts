import { ZodError } from 'zod'

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

  if (err instanceof ZodError) {
    const message = err.issues.map(issue => issue.message).join(' ')
    return { status: 400, message: message || 'Datos inválidos.' }
  }

  console.error(err)
  return { status: 500, message: 'Ocurrió un error inesperado.' }
}

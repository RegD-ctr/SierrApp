const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export function getImageUrl(path?: string | null): string {
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path
  }
  return `${API_URL}${path.startsWith('/') ? '' : '/'}${path}`
}

let accessToken: string | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
}

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

let refreshPromise: Promise<boolean> | null = null

async function tryRefresh(): Promise<boolean> {
  // Si ya hay un refresh en curso (ej. varias llamadas 401 al mismo
  // tiempo), todas esperan el mismo resultado en vez de disparar
  // refresh por triplicado.
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })
      .then(async res => {
        if (!res.ok) return false
        const data = await res.json()
        setAccessToken(data.accessToken)
        return true
      })
      .catch(() => false)
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

async function request<T>(path: string, options: RequestInit = {}, isRetry = false): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options.headers,
    },
  })

  if (res.status === 401 && !isRetry && path !== '/api/auth/refresh' && path !== '/api/auth/login') {
    const refreshed = await tryRefresh()
    if (refreshed) {
      return request<T>(path, options, true)
    }
  }

  if (res.status === 204) {
    return undefined as T
  }

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new ApiError(data.error || 'Ocurrió un error inesperado.', res.status)
  }

  return data as T
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}

export interface CurrentUser {
  id: string
  email: string
  nombre: string
  telefono: string
  rol: 'USUARIO' | 'LOCAL' | 'REPARTIDOR' | 'ADMIN'
  status: 'PENDIENTE' | 'ACTIVO' | 'SUSPENDIDO' | 'RECHAZADO'
  emailVerified: boolean
  driverProfile?: {
    matricula: string
    tieneVehiculo: boolean
    vehiculo: string | null
    fotoUrl: string | null
    ratingPromedio: number
  } | null
  restaurant?: {
    id: string
    nombre: string
    status: string
    isOpen: boolean
  } | null
}

// Se llama UNA vez al montar App.tsx — intenta recuperar la sesión 
// usando la cookie httpOnly del refresh token (si el usuario ya había 
// iniciado sesión antes y no expiró). Si no hay sesión válida, 
// simplemente devuelve null sin mostrar ningún error.
export async function restoreSession(): Promise<CurrentUser | null> {
  const refreshed = await tryRefresh()
  if (!refreshed) return null
  try {
    return await api.get<CurrentUser>('/api/auth/me')
  } catch {
    return null
  }
}


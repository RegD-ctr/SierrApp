export interface OpcionItem {
  id: string
  label: string
  extra: number
}

export interface OpcionGroup {
  id: string
  titulo: string
  obligatoria: boolean
  tipo: 'radio' | 'checkbox'
  opciones: OpcionItem[]
}

export interface Platillo {
  id: number
  restaurantId: number
  nombre: string
  descripcion: string
  categoria: string
  precio: number
  imagen: string | null
  disponible: boolean
  opciones?: OpcionGroup[]
}

export interface Restaurant {
  id: number
  name: string
  category: string
  rating: number
  reviews: number
  time: string
  delivery: string
  deliveryFee: number
  promo: string | null
  coverImg: string
  badge: string | null
  address: string
  isOpen: boolean
}

export interface CartItem {
  cartId: string
  platillo: Platillo
  restaurant: Restaurant
  cantidad: number
  selecciones: Record<string, string | string[]>
  extrasTotal: number
  notas: string
}

// TODO: reemplazar con datos reales del backend (GET /api/restaurants)
export const restaurants: Restaurant[] = []

// TODO: reemplazar con datos reales del backend (GET /api/restaurants/:id/platillos)
export const platillos: Platillo[] = []


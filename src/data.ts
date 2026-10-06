export interface OpcionItem {
  id: string
  label: string
  extra?: number
  extraPrecio?: number
}

export interface OpcionGroup {
  id: string
  titulo: string
  obligatoria: boolean
  tipo: 'RADIO' | 'CHECKBOX'
  opciones: OpcionItem[]
  orden?: number
}

export interface Platillo {
  id: string | number
  restaurantId?: string | number
  nombre: string
  descripcion: string
  categoria: string
  precio: number
  imagen: string | null
  disponible: boolean
  opciones?: OpcionGroup[]
  optionGroups?: OpcionGroup[]
}

export interface Restaurant {
  id: string | number
  nombre?: string
  name?: string
  categoria?: string
  category?: string
  rating: number
  reviews: number
  tiempoEntrega?: string
  time?: string
  deliveryFeeTexto?: string
  delivery?: string
  deliveryFee: number
  promo?: string | null
  coverImg: string
  badge?: string | null
  direccion?: string
  address?: string
  isOpen: boolean
  status?: string
  dishes?: Platillo[]
}

export function getCategoryEmoji(categoria: string = ''): string {
  const cat = categoria.toLowerCase()
  if (cat.includes('burger') || cat.includes('hamb')) return '🍔'
  if (cat.includes('pizza') || cat.includes('ital')) return '🍕'
  if (cat.includes('taco') || cat.includes('mexic')) return '🌮'
  if (cat.includes('sushi') || cat.includes('jap')) return '🍣'
  if (cat.includes('carne') || cat.includes('steak')) return '🥩'
  if (cat.includes('pollo') || cat.includes('chicken')) return '🐔'
  if (cat.includes('postre') || cat.includes('pastel') || cat.includes('cake')) return '🍰'
  if (cat.includes('café') || cat.includes('cafe')) return '☕'
  if (cat.includes('ensalada') || cat.includes('salad')) return '🥗'
  if (cat.includes('super') || cat.includes('súper')) return '🛒'
  if (cat.includes('farma') || cat.includes('medic')) return '💊'
  if (cat.includes('bebida') || cat.includes('drink')) return '🥤'
  if (cat.includes('helad') || cat.includes('ice')) return '🍦'
  if (cat.includes('ramen')) return '🍜'
  return '🍽️'
}

export interface CartItem {
  cartId: string
  platillo: Platillo
  restaurant: Restaurant
  cantidad: number
  selecciones: Record<string, string | string[]>
  selectedOptionItemIds?: string[]
  extrasTotal: number
  notas: string
}

// Datos vacíos por defecto; la aplicación consume el backend real vía API
export const restaurants: Restaurant[] = []
export const platillos: Platillo[] = []


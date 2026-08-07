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

export const restaurants: Restaurant[] = [
  {
    id: 1, name: 'El Rincón del Sabor', category: 'Comida Mexicana', rating: 4.8, reviews: 324,
    time: '25-35 min', delivery: 'Envío $20', deliveryFee: 20, promo: '2x1 en tacos',
    coverImg: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&w=800&h=300',
    badge: 'Popular', address: 'Mercado Sierra, Local 12, Col. Centro', isOpen: true,
  },
  {
    id: 2, name: 'Sierra Burger Co.', category: 'Hamburguesas', rating: 4.6, reviews: 210,
    time: '20-30 min', delivery: 'Envío gratis', deliveryFee: 0, promo: '15% desc. hoy',
    coverImg: 'https://images.unsplash.com/photo-1512152272829-e3139592d56f?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&w=800&h=300',
    badge: 'Nuevo', address: 'Av. Sierra #45, Col. Centro', isOpen: true,
  },
  {
    id: 3, name: 'Sakura Sushi', category: 'Japonesa', rating: 4.9, reviews: 518,
    time: '30-45 min', delivery: 'Envío $15', deliveryFee: 15, promo: null,
    coverImg: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&w=800&h=300',
    badge: null, address: 'Zona Rosa, Calle Flores #8', isOpen: true,
  },
  {
    id: 4, name: 'Pizzería Napoli', category: 'Italiana', rating: 4.7, reviews: 402,
    time: '25-40 min', delivery: 'Envío gratis', deliveryFee: 0, promo: 'Pizza + refresco',
    coverImg: 'https://images.unsplash.com/photo-1566843972142-a7fcb70de55a?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&w=800&h=300',
    badge: 'Top', address: 'Calle Olivo #12, Col. Roma', isOpen: true,
  },
  {
    id: 5, name: 'La Parrilla Sierra', category: 'Carnes & Asados', rating: 4.5, reviews: 188,
    time: '35-50 min', delivery: 'Envío $25', deliveryFee: 25, promo: null,
    coverImg: 'https://images.unsplash.com/photo-1505826759037-406b40feb4cd?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&w=800&h=300',
    badge: null, address: 'Blvd. Montaña #120, Fracc. Las Cumbres', isOpen: false,
  },
  {
    id: 6, name: 'Rolls & More', category: 'Sushi Fusión', rating: 4.7, reviews: 275,
    time: '30-40 min', delivery: 'Envío $10', deliveryFee: 10, promo: '20% en rolls',
    coverImg: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&w=800&h=300',
    badge: 'Oferta', address: 'Plaza Sierra, Local 5-B', isOpen: true,
  },
]

export const platillos: Platillo[] = [
  // ---- El Rincón del Sabor (id: 1) ----
  {
    id: 101, restaurantId: 1, nombre: 'Orden de Tacos', categoria: 'Tacos',
    descripcion: 'Tres tacos de carne asada con cebolla, cilantro y salsas al gusto.',
    precio: 85, imagen: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&w=300&h=300',
    disponible: true,
    opciones: [
      { id: 'carne', titulo: 'Tipo de carne', obligatoria: true, tipo: 'radio', opciones: [
        { id: 'asada', label: 'Carne asada', extra: 0 },
        { id: 'pastor', label: 'Al pastor', extra: 0 },
        { id: 'chorizo', label: 'Chorizo', extra: 0 },
        { id: 'campechano', label: 'Campechano', extra: 10 },
      ]},
      { id: 'extras', titulo: 'Extras', obligatoria: false, tipo: 'checkbox', opciones: [
        { id: 'guac', label: 'Guacamole', extra: 20 },
        { id: 'queso', label: 'Queso fundido', extra: 15 },
        { id: 'doble', label: 'Doble carne', extra: 25 },
      ]},
    ],
  },
  {
    id: 102, restaurantId: 1, nombre: 'Quesadillas (2 pzas)', categoria: 'Antojitos',
    descripcion: 'Tortilla de maíz rellena de quesillo, con opciones de guisado.',
    precio: 70, imagen: null, disponible: true,
    opciones: [
      { id: 'guisado', titulo: 'Guisado', obligatoria: true, tipo: 'radio', opciones: [
        { id: 'rajas', label: 'Rajas con crema', extra: 0 },
        { id: 'hongo', label: 'Hongos', extra: 0 },
        { id: 'tinga', label: 'Tinga de pollo', extra: 10 },
      ]},
    ],
  },
  {
    id: 103, restaurantId: 1, nombre: 'Agua de Jamaica 1L', categoria: 'Bebidas',
    descripcion: 'Agua fresca de jamaica natural, sin azúcar añadida.', precio: 35,
    imagen: null, disponible: true,
  },
  {
    id: 104, restaurantId: 1, nombre: 'Torta de Carnitas', categoria: 'Tortas',
    descripcion: 'Pan telera con carnitas, frijoles, aguacate y chile jalapeño.', precio: 95,
    imagen: null, disponible: false,
  },

  // ---- Sierra Burger Co. (id: 2) ----
  {
    id: 201, restaurantId: 2, nombre: 'Burger Clásica', categoria: 'Burgers',
    descripcion: 'Carne 200g, lechuga, tomate, pepinillo, queso cheddar y aderezo de la casa.',
    precio: 120, imagen: 'https://images.unsplash.com/photo-1512152272829-e3139592d56f?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&w=300&h=300',
    disponible: true,
    opciones: [
      { id: 'coccion', titulo: 'Cocción', obligatoria: true, tipo: 'radio', opciones: [
        { id: 'med', label: 'Término medio', extra: 0 },
        { id: 'bien', label: 'Bien cocida', extra: 0 },
        { id: '3/4', label: '3/4', extra: 0 },
      ]},
      { id: 'pan', titulo: 'Tipo de pan', obligatoria: false, tipo: 'radio', opciones: [
        { id: 'brioche', label: 'Brioche (incluido)', extra: 0 },
        { id: 'integral', label: 'Pan integral', extra: 0 },
        { id: 'sin', label: 'Sin pan', extra: -10 },
      ]},
      { id: 'extras', titulo: 'Extras', obligatoria: false, tipo: 'checkbox', opciones: [
        { id: 'xqueso', label: 'Extra queso', extra: 15 },
        { id: 'bacon', label: 'Tocino', extra: 20 },
        { id: 'huevo', label: 'Huevo estrellado', extra: 18 },
        { id: 'jalap', label: 'Jalapeños', extra: 10 },
      ]},
      { id: 'quitar', titulo: 'Sin ingredientes', obligatoria: false, tipo: 'checkbox', opciones: [
        { id: 'sin_pic', label: 'Sin pepinillo', extra: 0 },
        { id: 'sin_ceb', label: 'Sin cebolla', extra: 0 },
        { id: 'sin_tom', label: 'Sin tomate', extra: 0 },
      ]},
    ],
  },
  {
    id: 202, restaurantId: 2, nombre: 'Papas Fritas', categoria: 'Complementos',
    descripcion: 'Papas crujientes con sal y ajo, porción grande.', precio: 55,
    imagen: 'https://images.unsplash.com/photo-1517434324-1db605ff03c7?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&w=300&h=300',
    disponible: true,
    opciones: [
      { id: 'size', titulo: 'Tamaño', obligatoria: true, tipo: 'radio', opciones: [
        { id: 'med', label: 'Mediana', extra: 0 },
        { id: 'grande', label: 'Grande', extra: 15 },
      ]},
      { id: 'salsa', titulo: 'Salsa', obligatoria: false, tipo: 'radio', opciones: [
        { id: 'ketch', label: 'Ketchup', extra: 0 },
        { id: 'mayo', label: 'Mayonesa', extra: 0 },
        { id: 'bbq', label: 'BBQ', extra: 0 },
      ]},
    ],
  },
  {
    id: 203, restaurantId: 2, nombre: 'Combo Doble', categoria: 'Combos',
    descripcion: '2 Burgers Clásicas + 2 Papas medianas + 2 Refrescos 600ml.', precio: 290,
    imagen: null, disponible: true,
  },
  {
    id: 204, restaurantId: 2, nombre: 'Refresco 600ml', categoria: 'Bebidas',
    descripcion: 'Variedad: cola, naranja o limón.', precio: 30, imagen: null, disponible: false,
  },

  // ---- Sakura Sushi (id: 3) ----
  {
    id: 301, restaurantId: 3, nombre: 'Roll California', categoria: 'Rolls',
    descripcion: 'Cangrejo, aguacate y pepino, cubierto con semillas de ajonjolí.',
    precio: 135, imagen: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&w=300&h=300',
    disponible: true,
    opciones: [
      { id: 'piezas', titulo: 'Piezas', obligatoria: true, tipo: 'radio', opciones: [
        { id: '8', label: '8 piezas', extra: 0 },
        { id: '16', label: '16 piezas', extra: 110 },
      ]},
      { id: 'extras', titulo: 'Extras', obligatoria: false, tipo: 'checkbox', opciones: [
        { id: 'picante', label: 'Con salsa picante', extra: 0 },
        { id: 'mango', label: 'Mango encima', extra: 20 },
        { id: 'cream', label: 'Queso crema', extra: 15 },
      ]},
    ],
  },
  {
    id: 302, restaurantId: 3, nombre: 'Roll Spicy Tuna', categoria: 'Rolls',
    descripcion: 'Atún picante con pepino y cubierta de masago.', precio: 155,
    imagen: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&w=300&h=300',
    disponible: true,
    opciones: [
      { id: 'picante', titulo: 'Nivel de picante', obligatoria: true, tipo: 'radio', opciones: [
        { id: 'leve', label: 'Leve', extra: 0 },
        { id: 'medio', label: 'Medio', extra: 0 },
        { id: 'fuerte', label: 'Fuerte 🌶️', extra: 0 },
      ]},
    ],
  },
  {
    id: 303, restaurantId: 3, nombre: 'Miso Soup', categoria: 'Sopas',
    descripcion: 'Sopa de miso tradicional con tofu y wakame.', precio: 45,
    imagen: null, disponible: true,
  },

  // ---- Pizzería Napoli (id: 4) ----
  {
    id: 401, restaurantId: 4, nombre: 'Pizza Margherita', categoria: 'Pizzas',
    descripcion: 'Salsa de tomate, mozzarella fresca y albahaca.',
    precio: 165, imagen: 'https://images.unsplash.com/photo-1566843972142-a7fcb70de55a?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&w=300&h=300',
    disponible: true,
    opciones: [
      { id: 'tamano', titulo: 'Tamaño', obligatoria: true, tipo: 'radio', opciones: [
        { id: 'ind', label: 'Individual 25cm', extra: 0 },
        { id: 'med', label: 'Mediana 30cm', extra: 50 },
        { id: 'grande', label: 'Grande 40cm', extra: 110 },
      ]},
      { id: 'masa', titulo: 'Masa', obligatoria: false, tipo: 'radio', opciones: [
        { id: 'delgada', label: 'Delgada', extra: 0 },
        { id: 'gruesa', label: 'Gruesa', extra: 0 },
        { id: 'rellena', label: 'Orilla rellena de queso', extra: 30 },
      ]},
      { id: 'extras', titulo: 'Ingredientes extra', obligatoria: false, tipo: 'checkbox', opciones: [
        { id: 'pepperoni', label: 'Pepperoni', extra: 25 },
        { id: 'champi', label: 'Champiñones', extra: 20 },
        { id: 'jamon', label: 'Jamón', extra: 20 },
      ]},
    ],
  },
  {
    id: 402, restaurantId: 4, nombre: 'Pizza BBQ Pollo', categoria: 'Pizzas',
    descripcion: 'Salsa BBQ, pechuga de pollo, cebolla morada y cilantro.', precio: 185,
    imagen: null, disponible: true,
  },
  {
    id: 403, restaurantId: 4, nombre: 'Pasta Carbonara', categoria: 'Pastas',
    descripcion: 'Fettuccine con salsa de crema, tocino y queso parmesano.', precio: 145,
    imagen: null, disponible: true,
  },

  // ---- La Parrilla Sierra (id: 5) ----
  {
    id: 501, restaurantId: 5, nombre: 'T-Bone 400g', categoria: 'Carnes',
    descripcion: 'Corte T-Bone a las brasas, acompañado de papas y ensalada.',
    precio: 380, imagen: 'https://images.unsplash.com/photo-1505826759037-406b40feb4cd?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&w=300&h=300',
    disponible: true,
    opciones: [
      { id: 'coccion', titulo: 'Término de cocción', obligatoria: true, tipo: 'radio', opciones: [
        { id: 'rojo', label: 'Rojo (45°C)', extra: 0 },
        { id: 'medio', label: 'Término medio (60°C)', extra: 0 },
        { id: 'bien', label: 'Bien cocido (75°C)', extra: 0 },
      ]},
    ],
  },
  {
    id: 502, restaurantId: 5, nombre: 'Costillas BBQ', categoria: 'Carnes',
    descripcion: 'Rack de costillas bañadas en salsa BBQ ahumada, con elote.', precio: 320,
    imagen: null, disponible: true,
  },

  // ---- Rolls & More (id: 6) ----
  {
    id: 601, restaurantId: 6, nombre: 'Roll Volcán', categoria: 'Rolls Especiales',
    descripcion: 'Roll frito con camarón, cubierto de atún picante y masago.',
    precio: 175, imagen: 'https://images.unsplash.com/photo-1611143669185-af224c5e3252?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&w=300&h=300',
    disponible: true,
    opciones: [
      { id: 'picante', titulo: 'Nivel de picante', obligatoria: true, tipo: 'radio', opciones: [
        { id: 'sin', label: 'Sin picante', extra: 0 },
        { id: 'medio', label: 'Medio', extra: 0 },
        { id: 'extra', label: 'Extra picante 🌶️🌶️', extra: 0 },
      ]},
      { id: 'extra_sal', titulo: 'Salsa extra', obligatoria: false, tipo: 'checkbox', opciones: [
        { id: 'eel', label: 'Salsa de anguila', extra: 15 },
        { id: 'trufa', label: 'Aceite de trufa', extra: 25 },
      ]},
    ],
  },
  {
    id: 602, restaurantId: 6, nombre: 'Edamame', categoria: 'Entradas',
    descripcion: 'Vainas de soya con sal de mar y limón.', precio: 55,
    imagen: null, disponible: true,
  },
]

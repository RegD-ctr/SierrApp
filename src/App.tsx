import { useState, useRef, useEffect } from 'react'
import logoImg from '@/imports/logo.jpeg'
import Login from '@/pages/Login'
import type { Role } from '@/pages/Login'
import { restoreSession, api, setAccessToken, getAccessToken, getImageUrl, type CurrentUser } from '@/lib/api'
import { connectSocket, disconnectSocket, getSocket } from '@/lib/socket'
import Explorar from '@/pages/Explorar'
import Pedidos from '@/pages/Pedidos'
import Perfil from '@/pages/Perfil'
import LocalPanel from '@/pages/LocalPanel'
import RepartidorPanel from '@/pages/RepartidorPanel'
import AdminPanel from '@/pages/AdminPanel'
import CartDrawer from '@/components/CartDrawer'
import RestaurantPage from '@/components/RestaurantPage'
import type { CartItem, Restaurant } from '@/data'
import { getCategoryEmoji } from '@/data'
import Checkout from '@/pages/Checkout'
import OrderConfirmation from '@/pages/OrderConfirmation'
import PaymentMethods from '@/pages/PaymentMethods'
import Addresses, { type AddressItem } from '@/pages/Addresses'
import Favorites from '@/pages/Favorites'
import Promotions from '@/pages/Promotions'
import Notifications from '@/pages/Notifications'
import Support from '@/pages/Support'
import OrderTracking from '@/pages/OrderTracking'
import type { Order } from '@/pages/OrderTracking'
import RateOrder from '@/pages/RateOrder'

type View = 'inicio' | 'explorar' | 'pedidos' | 'perfil' | 'checkout' | 'order-confirmation' | 'payment-methods' | 'addresses' | 'favorites' | 'promotions' | 'notifications' | 'support' | 'order-tracking' | 'rate-order'

const categories = [
  { icon: '🍔', label: 'Comida' }, { icon: '🛒', label: 'Super' }, { icon: '💊', label: 'Farmacia' },
  { icon: '🍕', label: 'Pizza' }, { icon: '🍣', label: 'Sushi' }, { icon: '🥩', label: 'Carnes' },
  { icon: '🍰', label: 'Postres' }, { icon: '☕', label: 'Café' }, { icon: '🌮', label: 'Tacos' }, { icon: '🐔', label: 'Pollo' },
]

const navItems: { icon: string; label: string; view: View }[] = [
  { icon: '🏠', label: 'Inicio', view: 'inicio' },
  { icon: '🔍', label: 'Explorar', view: 'explorar' },
  { icon: '📦', label: 'Pedidos', view: 'pedidos' },
  { icon: '👤', label: 'Perfil', view: 'perfil' },
]

/**
 * Componente principal de la aplicación Sierra App.
 * Maneja el estado global de la sesión (rol), la vista activa,
 * la navegación y el carrito de compras.
 */
export default function App() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [isRestoringSession, setIsRestoringSession] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    let isMounted = true
    restoreSession()
      .then(user => {
        if (isMounted && user) {
          setCurrentUser(user)
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsRestoringSession(false)
        }
      })
    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (currentUser) {
      const token = getAccessToken()
      if (token) {
        const s = connectSocket(token)
        s.on('disconnect', (reason) => {
          if (currentUser) {
            console.warn('Socket desconectado:', reason)
          }
        })
      }
      api.get<{ count: number }>('/api/notifications/unread-count')
        .then(res => setUnreadCount(res.count))
        .catch(() => {})
    } else {
      setUnreadCount(0)
    }
  }, [currentUser])

  useEffect(() => {
    const socket = getSocket()
    if (!socket) return
    const handleNewNotif = () => {
      setUnreadCount(prev => prev + 1)
    }
    socket.on('notification:new', handleNewNotif)
    return () => {
      socket.off('notification:new', handleNewNotif)
    }
  }, [currentUser])

  const handleLogout = async () => {
    disconnectSocket()
    try {
      await api.post('/api/auth/logout')
    } catch {
      // Ignorar si la sesión ya expiró
    }
    setAccessToken(null)
    setCurrentUser(null)
  }

  const role: Role | null = currentUser ? (currentUser.rol.toLowerCase() as Role) : null
  const [viewHistory, setViewHistory] = useState<View[]>(['inicio'])
  const view = viewHistory[viewHistory.length - 1]

  /**
   * Navega a una nueva vista agregándola al historial de navegación.
   * Evita duplicar la vista actual si se presiona repetidamente.
   * Limita el historial a un máximo de 20 elementos.
   * 
   * @param {View} next - La vista de destino.
   */
  function navigateTo(next: View) {
    setViewHistory(prev => {
      if (prev[prev.length - 1] === next) return prev
      const updated = [...prev, next]
      return updated.length > 20 ? updated.slice(-20) : updated
    })
  }

  /**
   * Regresa a la vista anterior en el historial de navegación.
   */
  function goBack() {
    setViewHistory(prev => {
      if (prev.length <= 1) return prev
      return prev.slice(0, -1)
    })
  }
  const [activeCategory, setActiveCategory] = useState('Comida')
  const [searchValue, setSearchValue] = useState('')
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null)
  const [cartOpen, setCartOpen] = useState(false)
  const [cartItems, setCartItems] = useState<CartItem[]>([])

  const [savedAddresses, setSavedAddresses] = useState<AddressItem[]>([])
  const [deliveryAddressId, setDeliveryAddressId] = useState<string>('')
  const [addressSelectMode, setAddressSelectMode] = useState(false)

  useEffect(() => {
    if (currentUser?.rol === 'USUARIO') {
      api.get<any[]>('/api/users/me/addresses')
        .then(data => {
          const mapped: AddressItem[] = data.map(a => ({
            id: a.id,
            name: a.etiqueta,
            street: `${a.calle} #${a.numero}`,
            col: a.colonia,
            default: a.predeterminada,
            etiqueta: a.etiqueta,
            calle: a.calle,
            numero: a.numero,
            colonia: a.colonia,
            cp: a.cp,
            ciudad: a.ciudad,
            estado: a.estado,
            referencias: a.referencias || '',
          }))
          setSavedAddresses(mapped)
          setDeliveryAddressId(prev => {
            if (prev && mapped.some(m => m.id === prev)) return prev
            const def = mapped.find(m => m.default) || mapped[0]
            return def ? def.id : ''
          })
        })
        .catch(err => {
          console.error('Error al cargar direcciones:', err)
        })
    } else {
      setSavedAddresses([])
      setDeliveryAddressId('')
    }
  }, [currentUser])

  const [toast, setToast] = useState<string | null>(null)
  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  // Pedidos y seguimiento en tiempo real
  const [activeOrder, setActiveOrder] = useState<Order | null>(null)
  const [confirmedOrder, setConfirmedOrder] = useState<any>(null)
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null)

  const activeAddress = savedAddresses.find(a => a.id === deliveryAddressId) || savedAddresses[0]
  const cartCount = cartItems.reduce((s, i) => s + i.cantidad, 0)

  /**
   * Agrega un nuevo artículo al carrito de compras.
   * Si el artículo ya existe, incrementa su cantidad.
   * 
   * @param {CartItem} item - El artículo a agregar al carrito.
   */
  const addToCart = (item: CartItem) => {
    setCartItems(items => {
      const existing = items.find(i => i.cartId === item.cartId)
      if (existing) return items.map(i => i.cartId === item.cartId ? { ...i, cantidad: i.cantidad + item.cantidad } : i)
      return [...items, item]
    })
  }

  /**
   * Actualiza la cantidad de un artículo en el carrito.
   * Si la cantidad baja a 0 o menos, el artículo es eliminado automáticamente.
   * 
   * @param {string} cartId - Identificador único del artículo en el carrito.
   * @param {number} delta - Variación en la cantidad (ej. 1 o -1).
   */
  const updateQty = (cartId: string, delta: number) => {
    setCartItems(items =>
      items.map(i => i.cartId === cartId ? { ...i, cantidad: Math.max(0, i.cantidad + delta) } : i).filter(i => i.cantidad > 0)
    )
  }

  /**
   * Elimina un artículo específico del carrito utilizando su identificador.
   * 
   * @param {string} cartId - Identificador único del artículo.
   */
  const removeItem = (cartId: string) => setCartItems(items => items.filter(i => i.cartId !== cartId))

  if (isRestoringSession) {
    return (
      <div className="min-h-screen bg-[#1a1b1e] flex flex-col items-center justify-center text-white">
        <img src={logoImg} alt="Sierra App" className="w-16 h-16 rounded-2xl mb-4 animate-pulse object-cover" />
        <div className="w-6 h-6 border-2 border-[#5bc827] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs text-[#9a9da3] tracking-widest uppercase">Cargando sesión...</p>
      </div>
    )
  }

  if (!currentUser || !role) return <Login onLogin={(user) => setCurrentUser(user)} />
  if (role === 'local') return <LocalPanel onLogout={handleLogout} />
  if (role === 'repartidor') return <RepartidorPanel onLogout={handleLogout} />
  if (role === 'admin') return <AdminPanel onLogout={handleLogout} />

  if (view === 'checkout') return (
    <Checkout
      items={cartItems}
      savedAddresses={savedAddresses}
      deliveryAddressId={deliveryAddressId}
      onChangeAddress={() => { setAddressSelectMode(true); navigateTo('addresses') }}
      onConfirm={(order) => {
        setConfirmedOrder(order)
        setActiveOrderId(order.id)
        setCartItems([])
        setCartOpen(false)
        setSelectedRestaurant(null)
        navigateTo('order-confirmation')
      }}
      onBack={goBack}
    />
  )
  if (view === 'order-confirmation') return (
    <OrderConfirmation
      order={confirmedOrder}
      onTrack={() => {
        setSelectedRestaurant(null)
        if (confirmedOrder?.id) {
          setActiveOrderId(confirmedOrder.id)
          navigateTo('order-tracking')
        } else {
          navigateTo('pedidos')
        }
      }}
      onHome={() => {
        setSelectedRestaurant(null)
        navigateTo('inicio')
      }}
    />
  )
  if (view === 'payment-methods') return <PaymentMethods onBack={goBack} />
  if (view === 'addresses') return (
    <Addresses 
      onBack={goBack}
      addresses={savedAddresses}
      onAddressesChange={(updated) => {
        setSavedAddresses(updated)
        setDeliveryAddressId(prev => {
          if (prev && updated.some(m => m.id === prev)) return prev
          const def = updated.find(m => m.default) || updated[0]
          return def ? def.id : ''
        })
      }}
      selectable={addressSelectMode}
      selectedId={deliveryAddressId}
      onSelect={(id) => { setDeliveryAddressId(id); setAddressSelectMode(false); navigateTo('checkout') }}
    />
  )
  if (view === 'favorites') return (
    <Favorites
      onBack={goBack}
      onSelectRestaurant={(r) => { setSelectedRestaurant(r); navigateTo('inicio') }}
    />
  )
  if (view === 'promotions') return <Promotions onBack={goBack} onSelectRestaurant={(r) => { setSelectedRestaurant(r); navigateTo('inicio') }} />
  if (view === 'notifications') return <Notifications onBack={goBack} />
  if (view === 'support') return <Support onBack={goBack} />

  if (view === 'order-tracking') {
    return (
      <OrderTracking
        orderId={activeOrderId || undefined}
        order={activeOrder}
        onBack={goBack}
        onSupport={() => navigateTo('support')}
        onDeliveryComplete={(delivered) => {
          if (delivered) {
            setConfirmedOrder(delivered)
            setActiveOrderId(delivered.id)
          }
          navigateTo('rate-order')
        }}
      />
    )
  }

  if (view === 'rate-order') {
    return (
      <RateOrder
        orderId={activeOrderId || confirmedOrder?.id}
        restaurantName={confirmedOrder?.restaurant?.nombre || confirmedOrder?.restaurant?.name || 'el restaurante'}
        driverName={confirmedOrder?.repartidor?.nombre || 'tu repartidor'}
        onSubmit={(_ratings) => {
          showToast('¡Gracias por tu calificación! ⭐')
        }}
        onSkip={() => navigateTo('pedidos')}
      />
    )
  }

  return (
    <div className="min-h-screen bg-[#1a1b1e] text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#1a1b1e]/95 backdrop-blur-sm border-b border-[#35373b]">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => { setSelectedRestaurant(null); navigateTo('inicio') }} className="flex items-center gap-2 shrink-0">
            <img src={logoImg} alt="Sierra App" className="w-9 h-9 rounded-lg object-cover" />
            <span className="font-display text-xl font-bold tracking-wide text-[#5bc827] hidden sm:block" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>SIERRA APP</span>
          </button>

          {!selectedRestaurant && (
            <button onClick={() => { setAddressSelectMode(false); navigateTo('addresses') }} className="flex items-center gap-1 text-xs text-[#9a9da3] hover:text-[#5bc827] transition-colors truncate max-w-[160px] sm:max-w-xs">
              <svg className="w-3.5 h-3.5 shrink-0 text-[#5bc827]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
              <span className="truncate">{activeAddress ? `${activeAddress.street}, ${activeAddress.col}` : 'Seleccionar dirección'}</span>
              <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
            </button>
          )}

          <div className="flex-1 relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9a9da3]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input type="text" placeholder="Busca restaurantes o platillos..."
              value={searchValue} onChange={e => { setSearchValue(e.target.value); navigateTo('explorar'); setSelectedRestaurant(null) }}
              className="w-full bg-[#232427] border border-[#35373b] rounded-full py-2 pl-9 pr-4 text-sm text-white placeholder-[#9a9da3] focus:outline-none focus:border-[#5bc827] transition-colors" />
          </div>

          <button onClick={() => { setUnreadCount(0); navigateTo('notifications') }} className="relative shrink-0 text-[#9a9da3] hover:text-white transition-colors mr-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#5bc827] text-[#1a1b1e] text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <button onClick={() => setCartOpen(true)} className="relative shrink-0 bg-[#5bc827] hover:bg-[#7ed944] text-[#1a1b1e] rounded-full p-2 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-white text-[#1a1b1e] text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{cartCount}</span>
            )}
          </button>
        </div>
      </header>

      {/* Restaurant detail page */}
      {selectedRestaurant ? (
        <RestaurantPage
          restaurant={selectedRestaurant}
          onBack={() => setSelectedRestaurant(null)}
          onAddToCart={(item) => { addToCart(item); setCartOpen(true) }}
        />
      ) : (
        <main className="max-w-5xl mx-auto">
          {view === 'inicio' && (
            <HomeView
              activeCategory={activeCategory}
              setActiveCategory={setActiveCategory}
              onSelectRestaurant={setSelectedRestaurant}
              onGoToPromotions={() => navigateTo('promotions')}
              onGoToExplore={() => navigateTo('explorar')}
            />
          )}
          {view === 'explorar' && (
            <Explorar onSelectRestaurant={setSelectedRestaurant} />
          )}
          {view === 'pedidos' && (
            <Pedidos
              onOpenTracking={(orderId) => {
                if (typeof orderId === 'string') {
                  setActiveOrderId(orderId)
                } else if (orderId && orderId.id) {
                  setActiveOrderId(orderId.id)
                }
                navigateTo('order-tracking')
              }}
              onRateOrder={(orderId) => {
                setActiveOrderId(orderId)
                navigateTo('rate-order')
              }}
            />
          )}
          {view === 'perfil' && <Perfil role={role} user={currentUser} onLogout={handleLogout} onNavigate={(v: any) => { if (v === 'addresses') setAddressSelectMode(false); navigateTo(v); }} />}
        </main>
      )}

      {/* Bottom Nav */}
      {!selectedRestaurant && (
        <nav className="fixed bottom-0 left-0 right-0 bg-[#1a1b1e]/95 backdrop-blur-sm border-t border-[#35373b] flex justify-around py-2 z-50">
          {navItems.map(item => (
            <button key={item.view} onClick={() => navigateTo(item.view)}
              className={`flex flex-col items-center gap-0.5 px-4 py-1 transition-colors ${view === item.view ? 'text-[#5bc827]' : 'text-[#9a9da3] hover:text-[#c4c6ca]'}`}>
              <span className="text-xl">{item.icon}</span>
              <span className="text-[10px] font-medium">{item.label}</span>
              {view === item.view && <span className="w-1 h-1 rounded-full bg-[#5bc827] mt-0.5" />}
            </button>
          ))}
        </nav>
      )}

      {/* Toast notification */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#5bc827] text-[#1a1b1e] font-bold text-xs px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 border border-white/20 animate-bounce">
          <span>⭐</span> {toast}
        </div>
      )}

      {/* Cart */}
      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cartItems}
        onUpdateQty={updateQty}
        onRemove={removeItem}
        onCheckout={() => { setCartOpen(false); navigateTo('checkout') }}
        onExplore={() => { setCartOpen(false); navigateTo('explorar') }}
      />
    </div>
  )
}

/**
 * Componente de la vista de inicio (Home).
 * Muestra el hero (banner), promociones, categorías y lista de restaurantes cercanos.
 * 
 * @param {Object} props - Propiedades para manejar categorías, selección de restaurantes y navegación.
 */
function HomeView({
  activeCategory, setActiveCategory, onSelectRestaurant, onGoToPromotions, onGoToExplore,
}: {
  activeCategory: string
  setActiveCategory: (c: string) => void
  onSelectRestaurant: (r: Restaurant) => void
  onGoToPromotions: () => void
  onGoToExplore: () => void
}) {
  const restaurantsRef = useRef<HTMLDivElement>(null)
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadRestaurants = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await api.get<Restaurant[]>('/api/restaurants')
      setRestaurants(data)
    } catch (err: any) {
      setError(err.message || 'Error al cargar los restaurantes.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRestaurants()
  }, [])

  const filteredRestaurants = restaurants.filter(r => {
    if (activeCategory === 'Comida') return true
    const cat = (r.categoria || r.category || '').toLowerCase()
    return cat.includes(activeCategory.toLowerCase())
  })

  return (
    <div className="px-4 pb-24">
      {/* Hero */}
      <section className="mt-5 rounded-2xl overflow-hidden relative bg-[#232427] border border-[#35373b]">
        <div className="absolute inset-0">
          {/* TODO: reemplazar con imagen propia subida vía backend (GET /api/uploads o similar) cuando exista ese módulo */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#232427] via-[#1a1b1e] to-[#0d0e10] opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1a1b1e] via-[#1a1b1e]/70 to-transparent" />
        </div>
        <div className="relative px-6 py-8 sm:py-12 flex items-center justify-between">
          <div>
            <p className="text-[#5bc827] text-sm font-semibold uppercase tracking-widest mb-1">Todo lo que necesitas</p>
            <h1 className="text-4xl sm:text-6xl font-bold text-white leading-none mb-3 uppercase tracking-wide" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
              A un<br /><span className="text-[#5bc827]">toque.</span>
            </h1>
            <p className="text-[#c4c6ca] text-sm mb-5 max-w-xs">Restaurantes, súper y farmacia. Entrega rápida en tu zona.</p>
            <button onClick={() => restaurantsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="bg-[#5bc827] hover:bg-[#7ed944] text-[#1a1b1e] font-bold text-sm px-6 py-2.5 rounded-full transition-all hover:scale-105 active:scale-95 cursor-pointer">
              Pedir ahora
            </button>
          </div>
        </div>
      </section>

      {/* Promos */}
      <section className="mt-6">
        <button 
          onClick={onGoToPromotions}
          className="w-full rounded-xl bg-gradient-to-br from-[#5bc827] to-[#3d8c18] border border-[#35373b] p-4 flex items-center gap-3 hover:scale-[1.01] transition-transform text-left cursor-pointer"
        >
          <span className="text-3xl">🎉</span>
          <div>
            <p className="font-bold text-sm leading-tight text-[#1a1b1e]">Ver promociones</p>
            <p className="text-[#1a1b1e]/70 text-xs mt-0.5">Descuentos activos en restaurantes seleccionados</p>
          </div>
        </button>
      </section>

      {/* Categories */}
      <section className="mt-7">
        <h2 className="text-2xl font-bold text-white mb-4 uppercase tracking-wide" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>¿Qué se te antoja?</h2>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map(cat => (
            <button key={cat.label} onClick={() => setActiveCategory(cat.label)}
              className={`flex-shrink-0 flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl border transition-all cursor-pointer ${activeCategory === cat.label ? 'bg-[#5bc827] border-[#5bc827] text-[#1a1b1e]' : 'bg-[#232427] border-[#35373b] text-[#c4c6ca] hover:border-[#5bc827] hover:text-white'}`}>
              <span className="text-xl">{cat.icon}</span>
              <span className="text-[11px] font-semibold whitespace-nowrap">{cat.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Restaurants */}
      <section ref={restaurantsRef} className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white uppercase tracking-wide" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Restaurantes cerca</h2>
          <button onClick={onGoToExplore} className="text-[#5bc827] text-sm font-semibold hover:text-[#7ed944] transition-colors cursor-pointer">Ver todos →</button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(n => (
              <div key={n} className="animate-pulse bg-[#232427] border border-[#35373b] rounded-2xl overflow-hidden h-64">
                <div className="h-40 bg-[#1a1b1e]" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-[#1a1b1e] rounded w-2/3" />
                  <div className="h-3 bg-[#1a1b1e] rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 text-center bg-[#232427] border border-[#35373b] rounded-2xl p-6">
            <span className="text-4xl mb-3">⚠️</span>
            <p className="text-white font-semibold">{error}</p>
            <button
              onClick={loadRestaurants}
              className="mt-4 px-5 py-2 bg-[#5bc827] text-[#1a1b1e] font-bold text-xs rounded-full hover:bg-[#7ed944] transition-all cursor-pointer"
            >
              Reintentar
            </button>
          </div>
        ) : restaurants.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center bg-[#232427] border border-[#35373b] rounded-2xl p-6">
            <span className="text-5xl mb-3">🍽️</span>
            <p className="text-white font-semibold">No hay restaurantes disponibles en este momento</p>
            <p className="text-[#9a9da3] text-sm mt-1">Vuelve a consultar más tarde</p>
          </div>
        ) : filteredRestaurants.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center bg-[#232427] border border-[#35373b] rounded-2xl p-6">
            <span className="text-4xl mb-3">🔍</span>
            <p className="text-white font-semibold">Sin resultados en {activeCategory}</p>
            <button
              onClick={() => setActiveCategory('Comida')}
              className="mt-3 text-xs font-semibold text-[#5bc827] hover:underline cursor-pointer"
            >
              Ver todos los restaurantes
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRestaurants.map(r => (
              <RestaurantCard key={r.id} r={r} onClick={() => onSelectRestaurant(r)} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

/**
 * Componente que representa la tarjeta de un restaurante.
 * Muestra la imagen, información básica (tiempo, costo de envío) y permite marcar como favorito.
 * 
 * @param {Object} props - Propiedades: r (información del restaurante) y onClick (acción al presionar la tarjeta).
 */
function RestaurantCard({ r, onClick }: { r: Restaurant; onClick: () => void }) {
  const [liked, setLiked] = useState(false)
  const nombre = r.nombre || r.name || 'Restaurante'
  const categoria = r.categoria || r.category || ''
  const tiempoEntrega = r.tiempoEntrega || r.time || '—'
  const deliveryFee = r.deliveryFee ?? 0
  const deliveryFeeTexto = r.deliveryFeeTexto || r.delivery || (deliveryFee === 0 ? 'Envío gratis' : `Envío $${deliveryFee}`)

  return (
    <div onClick={onClick} className="bg-[#232427] border border-[#35373b] rounded-2xl overflow-hidden group cursor-pointer hover:border-[#5bc827]/50 transition-all hover:shadow-lg hover:shadow-[#5bc827]/10">
      <div className="relative h-40 overflow-hidden bg-gradient-to-br from-[#232427] via-[#1a1b1e] to-[#0d0e10] flex items-center justify-center">
        {r.coverImg ? (
          <img
            src={getImageUrl(r.coverImg)}
            alt={nombre}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.display = 'none'
            }}
          />
        ) : (
          <span className="text-5xl">{getCategoryEmoji(categoria)}</span>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1b1e]/60 to-transparent" />
        {r.badge && (
          <span className="absolute top-2 left-2 bg-[#5bc827] text-[#1a1b1e] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">{r.badge}</span>
        )}
        {r.promo && (
          <span className="absolute bottom-2 left-2 bg-[#1a1b1e]/80 text-[#5bc827] text-[10px] font-semibold px-2 py-0.5 rounded-full border border-[#5bc827]/40">🏷 {r.promo}</span>
        )}
        {!r.isOpen && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="bg-[#1a1b1e]/90 text-red-400 text-xs font-bold px-3 py-1 rounded-full border border-red-900">Cerrado</span>
          </div>
        )}
        <button onClick={e => { e.stopPropagation(); setLiked(l => !l) }}
          className="absolute top-2 right-2 bg-[#1a1b1e]/60 rounded-full p-1.5 hover:bg-[#1a1b1e]/80 transition-colors cursor-pointer">
          <svg className={`w-3.5 h-3.5 ${liked ? 'text-[#5bc827] fill-[#5bc827]' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </div>
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-sm text-white leading-tight">{nombre}</h3>
          <div className="flex items-center gap-0.5 shrink-0">
            <span className="text-[#5bc827] text-xs">★</span>
            <span className="text-xs font-semibold text-white">{r.rating}</span>
          </div>
        </div>
        <p className="text-[#9a9da3] text-xs mb-2">{categoria}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] text-[#9a9da3]">
            <span>⏱ {tiempoEntrega}</span>
            <span className="text-[#35373b]">·</span>
            <span className={deliveryFee === 0 ? 'text-[#5bc827] font-semibold' : ''}>{deliveryFeeTexto}</span>
          </div>
          <span className="text-[#5bc827] text-xs font-semibold group-hover:underline">Ver menú →</span>
        </div>
      </div>
    </div>
  )
}

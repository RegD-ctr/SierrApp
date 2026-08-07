import { useState } from 'react'
import logoImg from '@/imports/logo.jpeg'
import Login from '@/pages/Login'
import type { Role } from '@/pages/Login'
import Explorar from '@/pages/Explorar'
import Pedidos from '@/pages/Pedidos'
import Perfil from '@/pages/Perfil'
import LocalPanel from '@/pages/LocalPanel'
import RepartidorPanel from '@/pages/RepartidorPanel'
import CartDrawer from '@/components/CartDrawer'
import RestaurantPage from '@/components/RestaurantPage'
import type { CartItem, Restaurant } from '@/data'
import { restaurants as allRestaurants } from '@/data'
import Checkout from '@/pages/Checkout'
import OrderConfirmation from '@/pages/OrderConfirmation'
import PaymentMethods from '@/pages/PaymentMethods'
import Addresses from '@/pages/Addresses'
import Favorites from '@/pages/Favorites'
import Promotions from '@/pages/Promotions'
import Notifications from '@/pages/Notifications'
import Support from '@/pages/Support'
import Onboarding from '@/pages/Onboarding'

type View = 'inicio' | 'explorar' | 'pedidos' | 'perfil' | 'checkout' | 'order-confirmation' | 'payment-methods' | 'addresses' | 'favorites' | 'promotions' | 'notifications' | 'support'

const promos = [
  { title: '¡Primer pedido GRATIS!', sub: 'Usa el código: SIERRA1', bg: 'from-[#5bc827] to-[#3d8c18]', text: 'text-[#1a1b1e]', emoji: '🎉' },
  { title: 'Envío gratis los martes', sub: 'En restaurantes seleccionados', bg: 'from-[#1a3320] to-[#1a1b1e]', text: 'text-[#5bc827]', emoji: '🛵' },
  { title: '2x1 en combos hoy', sub: 'Solo hasta las 11pm', bg: 'from-[#232427] to-[#1a3320]', text: 'text-white', emoji: '🍔' },
]

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

export default function App() {
  const [role, setRole] = useState<Role | null>(null)
  const [showOnboarding, setShowOnboarding] = useState(true)
  const [view, setView] = useState<View>('inicio')
  const [activeCategory, setActiveCategory] = useState('Comida')
  const [searchValue, setSearchValue] = useState('')
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null)
  const [cartOpen, setCartOpen] = useState(false)
  const [cartItems, setCartItems] = useState<CartItem[]>([])

  const cartCount = cartItems.reduce((s, i) => s + i.cantidad, 0)

  const addToCart = (item: CartItem) => {
    setCartItems(items => {
      const existing = items.find(i => i.cartId === item.cartId)
      if (existing) return items.map(i => i.cartId === item.cartId ? { ...i, cantidad: i.cantidad + item.cantidad } : i)
      return [...items, item]
    })
  }

  const updateQty = (cartId: string, delta: number) => {
    setCartItems(items =>
      items.map(i => i.cartId === cartId ? { ...i, cantidad: Math.max(0, i.cantidad + delta) } : i).filter(i => i.cantidad > 0)
    )
  }

  const removeItem = (cartId: string) => setCartItems(items => items.filter(i => i.cartId !== cartId))

  if (showOnboarding) return <Onboarding onComplete={() => setShowOnboarding(false)} />
  if (!role) return <Login onLogin={(r) => setRole(r)} />
  if (role === 'local') return <LocalPanel onLogout={() => setRole(null)} />
  if (role === 'repartidor') return <RepartidorPanel onLogout={() => setRole(null)} />

  if (view === 'checkout') return <Checkout items={cartItems} onConfirm={() => { setCartItems([]); setCartOpen(false); setView('order-confirmation') }} onBack={() => setView('inicio')} />
  if (view === 'order-confirmation') return <OrderConfirmation onTrack={() => setView('pedidos')} onHome={() => setView('inicio')} />
  if (view === 'payment-methods') return <PaymentMethods onBack={() => setView('perfil')} />
  if (view === 'addresses') return <Addresses onBack={() => setView('perfil')} />
  if (view === 'favorites') return <Favorites onBack={() => setView('perfil')} />
  if (view === 'promotions') return <Promotions onBack={() => setView('perfil')} />
  if (view === 'notifications') return <Notifications onBack={() => setView('inicio')} />
  if (view === 'support') return <Support onBack={() => setView('perfil')} />

  return (
    <div className="min-h-screen bg-[#1a1b1e] text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#1a1b1e]/95 backdrop-blur-sm border-b border-[#35373b]">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => { setSelectedRestaurant(null); setView('inicio') }} className="flex items-center gap-2 shrink-0">
            <img src={logoImg} alt="Sierra App" className="w-9 h-9 rounded-lg object-cover" />
            <span className="font-display text-xl font-bold tracking-wide text-[#5bc827] hidden sm:block" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>SIERRA APP</span>
          </button>

          {!selectedRestaurant && (
            <button className="flex items-center gap-1 text-xs text-[#9a9da3] hover:text-[#5bc827] transition-colors truncate max-w-[160px] sm:max-w-xs">
              <svg className="w-3.5 h-3.5 shrink-0 text-[#5bc827]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
              <span className="truncate">Calle Pino #24, Sierra Norte</span>
              <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
            </button>
          )}

          <div className="flex-1 relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9a9da3]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input type="text" placeholder="Busca restaurantes o platillos..."
              value={searchValue} onChange={e => { setSearchValue(e.target.value); setView('explorar'); setSelectedRestaurant(null) }}
              className="w-full bg-[#232427] border border-[#35373b] rounded-full py-2 pl-9 pr-4 text-sm text-white placeholder-[#9a9da3] focus:outline-none focus:border-[#5bc827] transition-colors" />
          </div>

          <button onClick={() => setView('notifications')} className="relative shrink-0 text-[#9a9da3] hover:text-white transition-colors mr-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
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
            />
          )}
          {view === 'explorar' && <Explorar onSelectRestaurant={setSelectedRestaurant} />}
          {view === 'pedidos' && <Pedidos />}
          {view === 'perfil' && <Perfil role={role} onLogout={() => setRole(null)} onNavigate={(v: any) => setView(v)} />}
        </main>
      )}

      {/* Bottom Nav */}
      {!selectedRestaurant && (
        <nav className="fixed bottom-0 left-0 right-0 bg-[#1a1b1e]/95 backdrop-blur-sm border-t border-[#35373b] flex justify-around py-2 z-50">
          {navItems.map(item => (
            <button key={item.view} onClick={() => setView(item.view)}
              className={`flex flex-col items-center gap-0.5 px-4 py-1 transition-colors ${view === item.view ? 'text-[#5bc827]' : 'text-[#9a9da3] hover:text-[#c4c6ca]'}`}>
              <span className="text-xl">{item.icon}</span>
              <span className="text-[10px] font-medium">{item.label}</span>
              {view === item.view && <span className="w-1 h-1 rounded-full bg-[#5bc827] mt-0.5" />}
            </button>
          ))}
        </nav>
      )}

      {/* Cart */}
      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cartItems}
        onUpdateQty={updateQty}
        onRemove={removeItem}
        onCheckout={() => { setCartOpen(false); setView('checkout') }}
        onExplore={() => { setCartOpen(false); setView('explorar') }}
      />
    </div>
  )
}

function HomeView({
  activeCategory, setActiveCategory, onSelectRestaurant,
}: {
  activeCategory: string
  setActiveCategory: (c: string) => void
  onSelectRestaurant: (r: Restaurant) => void
}) {
  return (
    <div className="px-4 pb-24">
      {/* Hero */}
      <section className="mt-5 rounded-2xl overflow-hidden relative bg-[#232427] border border-[#35373b]">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1505826759037-406b40feb4cd?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&w=1200&h=320&auto=format" alt="Comida" className="w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1a1b1e] via-[#1a1b1e]/70 to-transparent" />
        </div>
        <div className="relative px-6 py-8 sm:py-12 flex items-center justify-between">
          <div>
            <p className="text-[#5bc827] text-sm font-semibold uppercase tracking-widest mb-1">Todo lo que necesitas</p>
            <h1 className="text-4xl sm:text-6xl font-bold text-white leading-none mb-3 uppercase tracking-wide" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
              A un<br /><span className="text-[#5bc827]">toque.</span>
            </h1>
            <p className="text-[#c4c6ca] text-sm mb-5 max-w-xs">Restaurantes, súper y farmacia. Entrega rápida en tu zona.</p>
            <button onClick={() => onSelectRestaurant(allRestaurants[0])}
              className="bg-[#5bc827] hover:bg-[#7ed944] text-[#1a1b1e] font-bold text-sm px-6 py-2.5 rounded-full transition-all hover:scale-105 active:scale-95">
              Pedir ahora
            </button>
          </div>
          <div className="hidden sm:flex flex-col gap-3 text-right">
            {[{ n: '15 min', l: 'Entrega rápida' }, { n: '+200', l: 'Restaurantes' }, { n: '24/7', l: 'Disponible' }].map(s => (
              <div key={s.n}>
                <div className="text-2xl font-bold text-[#5bc827]" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>{s.n}</div>
                <div className="text-xs text-[#9a9da3]">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Promos */}
      <section className="mt-6">
        <div className="flex gap-3 overflow-x-auto pb-1">
          {promos.map((p, i) => (
            <div key={i} className={`flex-shrink-0 rounded-xl bg-gradient-to-br ${p.bg} border border-[#35373b] p-4 min-w-[200px] flex items-center gap-3 cursor-pointer hover:scale-[1.02] transition-transform`}>
              <span className="text-3xl">{p.emoji}</span>
              <div>
                <p className={`font-bold text-sm leading-tight ${p.text}`}>{p.title}</p>
                <p className="text-[#9a9da3] text-xs mt-0.5">{p.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="mt-7">
        <h2 className="text-2xl font-bold text-white mb-4 uppercase tracking-wide" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>¿Qué se te antoja?</h2>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map(cat => (
            <button key={cat.label} onClick={() => setActiveCategory(cat.label)}
              className={`flex-shrink-0 flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl border transition-all ${activeCategory === cat.label ? 'bg-[#5bc827] border-[#5bc827] text-[#1a1b1e]' : 'bg-[#232427] border-[#35373b] text-[#c4c6ca] hover:border-[#5bc827] hover:text-white'}`}>
              <span className="text-xl">{cat.icon}</span>
              <span className="text-[11px] font-semibold whitespace-nowrap">{cat.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Restaurants */}
      <section className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white uppercase tracking-wide" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Restaurantes cerca</h2>
          <button className="text-[#5bc827] text-sm font-semibold hover:text-[#7ed944] transition-colors">Ver todos →</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {allRestaurants.map(r => (
            <RestaurantCard key={r.id} r={r} onClick={() => onSelectRestaurant(r)} />
          ))}
        </div>
      </section>
    </div>
  )
}

function RestaurantCard({ r, onClick }: { r: Restaurant; onClick: () => void }) {
  const [liked, setLiked] = useState(false)

  return (
    <div onClick={onClick} className="bg-[#232427] border border-[#35373b] rounded-2xl overflow-hidden group cursor-pointer hover:border-[#5bc827]/50 transition-all hover:shadow-lg hover:shadow-[#5bc827]/10">
      <div className="relative h-40 overflow-hidden bg-[#1a3320]">
        <img src={r.coverImg} alt={r.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1b1e]/60 to-transparent" />
        {r.badge && (
          <span className="absolute top-2 left-2 bg-[#5bc827] text-[#1a1b1e] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">{r.badge}</span>
        )}
        {r.promo && (
          <span className="absolute bottom-2 left-2 bg-[#1a1b1e]/80 text-[#5bc827] text-[10px] font-semibold px-2 py-0.5 rounded-full border border-[#5bc827]/40">🏷 {r.promo}</span>
        )}
        {!r.isOpen && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-[#1a1b1e]/80 text-[#9a9da3] text-xs font-bold px-3 py-1 rounded-full border border-[#35373b]">Cerrado</span>
          </div>
        )}
        <button onClick={e => { e.stopPropagation(); setLiked(l => !l) }}
          className="absolute top-2 right-2 bg-[#1a1b1e]/60 rounded-full p-1.5 hover:bg-[#1a1b1e]/80 transition-colors">
          <svg className={`w-3.5 h-3.5 ${liked ? 'text-[#5bc827] fill-[#5bc827]' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </div>
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-sm text-white leading-tight">{r.name}</h3>
          <div className="flex items-center gap-0.5 shrink-0">
            <span className="text-[#5bc827] text-xs">★</span>
            <span className="text-xs font-semibold text-white">{r.rating}</span>
          </div>
        </div>
        <p className="text-[#9a9da3] text-xs mb-2">{r.category}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] text-[#9a9da3]">
            <span>⏱ {r.time}</span>
            <span className="text-[#35373b]">·</span>
            <span className={r.deliveryFee === 0 ? 'text-[#5bc827] font-semibold' : ''}>{r.delivery}</span>
          </div>
          <span className="text-[#5bc827] text-xs font-semibold group-hover:underline">Ver menú →</span>
        </div>
      </div>
    </div>
  )
}

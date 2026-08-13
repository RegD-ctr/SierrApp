import { useState } from 'react'
import type { Restaurant, CartItem } from '@/data'
import { platillos as allPlatillos } from '@/data'
import CustomizeModal from './CustomizeModal'
import type { Platillo } from '@/data'

interface Props {
  restaurant: Restaurant
  onBack: () => void
  onAddToCart: (item: CartItem) => void
}

/**
 * Componente que muestra la página detallada de un restaurante.
 * Lista la información del local, sus categorías y los platillos disponibles para ordenar.
 * 
 * @param {Props} props - Propiedades que incluyen la información del restaurante y callbacks.
 */
export default function RestaurantPage({ restaurant, onBack, onAddToCart }: Props) {
  const [customizing, setCustomizing] = useState<Platillo | null>(null)

  const myPlatillos = allPlatillos.filter(p => p.restaurantId === restaurant.id)
  const categories = [...new Set(myPlatillos.map(p => p.categoria))]

  const handleAgregar = (p: Platillo) => {
    if (!p.disponible) return
    if (p.opciones && p.opciones.length > 0) {
      setCustomizing(p)
    } else {
      onAddToCart({
        cartId: `${p.id}-${Date.now()}`,
        platillo: p,
        restaurant,
        cantidad: 1,
        selecciones: {},
        extrasTotal: 0,
        notas: '',
      })
    }
  }

  return (
    <div className="min-h-screen bg-[#1a1b1e] pb-24">
      {/* Cover */}
      <div className="relative h-52 bg-[#232427]">
        <img src={restaurant.coverImg} alt={restaurant.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1b1e] via-[#1a1b1e]/30 to-transparent" />

        {/* Back button */}
        <button
          onClick={onBack}
          className="absolute top-4 left-4 bg-[#1a1b1e]/70 hover:bg-[#1a1b1e] backdrop-blur-sm border border-[#35373b] rounded-full p-2 text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      <div className="px-4 max-w-5xl mx-auto">
        {/* Restaurant info */}
        <div className="bg-[#232427] border border-[#35373b] rounded-2xl p-4 -mt-6 relative z-10 mb-5">
          <div className="flex items-start gap-3">
            <div className="w-14 h-14 rounded-xl bg-[#1a1b1e] border border-[#35373b] flex items-center justify-center text-2xl shrink-0">
              {restaurant.category.includes('Sushi') ? '🍣' :
               restaurant.category.includes('Burger') || restaurant.category.includes('Hamb') ? '🍔' :
               restaurant.category.includes('Pizza') || restaurant.category.includes('Italian') ? '🍕' :
               restaurant.category.includes('Carne') ? '🥩' :
               restaurant.category.includes('Mexic') ? '🌮' : '🍽️'}
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between gap-2">
                <h1 className="text-white font-bold text-lg leading-tight">{restaurant.name}</h1>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                  restaurant.isOpen ? 'bg-[#5bc827]/20 text-[#5bc827] border border-[#5bc827]/30' : 'bg-red-900/30 text-red-400 border border-red-800/40'
                }`}>
                  {restaurant.isOpen ? '● Abierto' : '● Cerrado'}
                </span>
              </div>
              <p className="text-[#9a9da3] text-xs mt-0.5">{restaurant.category}</p>
              <p className="text-[#9a9da3] text-xs mt-0.5">📍 {restaurant.address}</p>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map(n => (
                    <span key={n} className={`text-xs ${n <= Math.round(restaurant.rating) ? 'text-[#5bc827]' : 'text-[#35373b]'}`}>★</span>
                  ))}
                  <span className="text-white text-xs font-bold ml-1">{restaurant.rating}</span>
                  <span className="text-[#9a9da3] text-xs">({restaurant.reviews})</span>
                </div>
                <span className="text-[#35373b]">·</span>
                <span className="text-[#9a9da3] text-xs">⏱ {restaurant.time}</span>
                <span className="text-[#35373b]">·</span>
                <span className={`text-xs font-semibold ${restaurant.deliveryFee === 0 ? 'text-[#5bc827]' : 'text-[#9a9da3]'}`}>
                  {restaurant.deliveryFee === 0 ? 'Envío gratis' : `Envío $${restaurant.deliveryFee}`}
                </span>
              </div>
            </div>
          </div>
          {restaurant.promo && (
            <div className="mt-3 bg-[#5bc827]/10 border border-[#5bc827]/30 rounded-xl px-3 py-2 flex items-center gap-2">
              <span className="text-base">🏷</span>
              <p className="text-[#5bc827] text-xs font-semibold">{restaurant.promo}</p>
            </div>
          )}
        </div>

        {/* Menu */}
        {!restaurant.isOpen ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <span className="text-5xl mb-3">🔒</span>
            <p className="text-white font-semibold">Restaurante cerrado</p>
            <p className="text-[#9a9da3] text-sm mt-1">Vuelve en su horario de atención</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <span className="text-5xl mb-3">🍽️</span>
            <p className="text-white font-semibold">Sin platillos aún</p>
          </div>
        ) : (
          categories.map(cat => {
            const items = myPlatillos.filter(p => p.categoria === cat)
            return (
              <div key={cat} className="mb-7">
                <h2
                  className="text-xl font-bold text-white uppercase mb-3 border-b border-[#35373b] pb-2"
                  style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
                >
                  {cat}
                </h2>
                <div className="space-y-3">
                  {items.map(p => (
                    <PlatilloRow key={p.id} p={p} onAgregar={() => handleAgregar(p)} />
                  ))}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Customize modal */}
      {customizing && (
        <CustomizeModal
          platillo={customizing}
          restaurant={restaurant}
          onClose={() => setCustomizing(null)}
          onAdd={(item) => { onAddToCart(item); setCustomizing(null) }}
        />
      )}
    </div>
  )
}

function PlatilloRow({ p, onAgregar }: { p: Platillo; onAgregar: () => void }) {
  return (
    <div className={`flex gap-3 bg-[#232427] border rounded-2xl p-3 transition-all ${p.disponible ? 'border-[#35373b] hover:border-[#5bc827]/30' : 'border-[#35373b] opacity-60'}`}>
      <div className="relative shrink-0">
        {p.imagen ? (
          <img src={p.imagen} alt={p.nombre} className="w-20 h-20 rounded-xl object-cover" />
        ) : (
          <div className="w-20 h-20 rounded-xl bg-[#1a3320] flex items-center justify-center text-2xl opacity-40">🍽️</div>
        )}
        {!p.disponible && (
          <div className="absolute inset-0 rounded-xl bg-black/60 flex items-center justify-center">
            <span className="text-[9px] font-bold text-red-400 bg-red-900/80 px-1 rounded leading-none py-0.5">AGOTADO</span>
          </div>
        )}
      </div>
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-white font-semibold text-sm leading-tight">{p.nombre}</h3>
          <p className="text-[#9a9da3] text-xs mt-0.5 line-clamp-2">{p.descripcion}</p>
          {p.opciones && p.opciones.length > 0 && (
            <p className="text-[#5bc827] text-[10px] mt-0.5">✦ Personalizable</p>
          )}
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-[#5bc827] font-bold text-base">${p.precio}</span>
          <button
            onClick={onAgregar}
            disabled={!p.disponible}
            className={`rounded-full w-8 h-8 flex items-center justify-center text-xl font-bold transition-all leading-none ${
              p.disponible
                ? 'bg-[#5bc827] hover:bg-[#7ed944] text-[#1a1b1e] hover:scale-110 active:scale-95'
                : 'bg-[#35373b] text-[#9a9da3] cursor-not-allowed'
            }`}
          >
            +
          </button>
        </div>
      </div>
    </div>
  )
}

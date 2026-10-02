import { useState, useEffect } from 'react'
import type { Restaurant } from '@/data'
import { getCategoryEmoji } from '@/data'
import { api, getImageUrl } from '@/lib/api'

const allCategories = [
  { icon: '🍔', label: 'Hamburguesas' },
  { icon: '🍕', label: 'Pizza' },
  { icon: '🌮', label: 'Tacos' },
  { icon: '🍣', label: 'Sushi' },
  { icon: '🥩', label: 'Carnes' },
  { icon: '🐔', label: 'Pollo' },
  { icon: '🍰', label: 'Postres' },
  { icon: '☕', label: 'Café' },
  { icon: '🥗', label: 'Ensaladas' },
  { icon: '🌯', label: 'Wraps' },
  { icon: '🍜', label: 'Ramen' },
  { icon: '🛒', label: 'Súper' },
  { icon: '💊', label: 'Farmacia' },
  { icon: '🥤', label: 'Bebidas' },
  { icon: '🍦', label: 'Helados' },
  { icon: '🥪', label: 'Sandwiches' },
]

const filters = ['Más populares', 'Más rápidos', 'Mejor precio', 'Mejor rating']

export default function Explorar({ onSelectRestaurant }: { onSelectRestaurant?: (r: Restaurant) => void }) {
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('Más populares')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set())
  const [togglingFavId, setTogglingFavId] = useState<string | null>(null)

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

  const loadFavorites = async () => {
    try {
      const favs = await api.get<any[]>('/api/users/me/favorites')
      if (Array.isArray(favs)) {
        setFavoriteIds(new Set(favs.map(f => f.id)))
      }
    } catch {
      // Ignorar si no está autenticado o falla
    }
  }

  useEffect(() => {
    loadRestaurants()
    loadFavorites()
  }, [])

  const handleToggleFavorite = async (restaurantId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (togglingFavId) return
    setTogglingFavId(restaurantId)
    try {
      const res = await api.patch<{ restaurantId: string; isFavorite: boolean }>(
        `/api/users/me/favorites/${restaurantId}/toggle`
      )
      setFavoriteIds(prev => {
        const next = new Set(prev)
        if (res.isFavorite) {
          next.add(restaurantId)
        } else {
          next.delete(restaurantId)
        }
        return next
      })
    } catch (err) {
      console.error('Error al actualizar favorito:', err)
    } finally {
      setTogglingFavId(null)
    }
  }

  const filtered = restaurants
    .filter(r => {
      const name = (r.nombre || r.name || '').toLowerCase()
      const cat = (r.categoria || r.category || '').toLowerCase()
      const q = search.toLowerCase().trim()
      const matchSearch = !q || name.includes(q) || cat.includes(q)
      const matchCat = !activeCategory || cat.includes(activeCategory.toLowerCase())
      return matchSearch && matchCat
    })
    .sort((a, b) => {
      if (activeFilter === 'Mejor rating') return b.rating - a.rating
      if (activeFilter === 'Mejor precio') return (a.deliveryFee ?? 0) - (b.deliveryFee ?? 0)
      if (activeFilter === 'Más populares') return (b.reviews ?? 0) - (a.reviews ?? 0)
      return 0
    })

  return (
    <div className="min-h-screen bg-[#1a1b1e] pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#1a1b1e]/95 backdrop-blur-sm border-b border-[#35373b] px-4 py-3">
        <h1
          className="text-2xl font-bold text-white uppercase mb-3"
          style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
        >
          Explorar
        </h1>
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9a9da3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Restaurantes, comida, categorías..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#232427] border border-[#35373b] focus:border-[#5bc827] rounded-full py-2.5 pl-9 pr-4 text-sm text-white placeholder-[#9a9da3] outline-none transition-colors"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9a9da3] hover:text-white">
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="px-4 pt-5">
        {/* Categories grid */}
        <h2 className="text-sm font-semibold text-[#c4c6ca] uppercase tracking-widest mb-3">Categorías</h2>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 mb-6">
          {allCategories.map(cat => (
            <button
              key={cat.label}
              onClick={() => setActiveCategory(activeCategory === cat.label ? null : cat.label)}
              className={`flex flex-col items-center gap-1 py-3 rounded-xl border transition-all ${
                activeCategory === cat.label
                  ? 'bg-[#5bc827] border-[#5bc827] text-[#1a1b1e]'
                  : 'bg-[#232427] border-[#35373b] text-[#c4c6ca] hover:border-[#5bc827]/50'
              }`}
            >
              <span className="text-xl">{cat.icon}</span>
              <span className="text-[9px] font-semibold leading-tight text-center">{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-5">
          {filters.map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`flex-shrink-0 text-xs font-semibold px-4 py-1.5 rounded-full border transition-colors ${
                activeFilter === f
                  ? 'bg-[#5bc827]/20 border-[#5bc827] text-[#5bc827]'
                  : 'bg-[#232427] border-[#35373b] text-[#9a9da3] hover:border-[#5bc827]/50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Results */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-[#9a9da3] text-xs">
            {filtered.length} resultados{activeCategory ? ` en ${activeCategory}` : ''}
          </span>
          {activeCategory && (
            <button onClick={() => setActiveCategory(null)} className="text-[#5bc827] text-xs font-semibold">
              Limpiar filtro ✕
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-3 py-2">
            {[1, 2, 3].map(n => (
              <div key={n} className="animate-pulse flex gap-3 bg-[#232427] border border-[#35373b] rounded-2xl p-2.5">
                <div className="w-24 h-24 bg-[#1a1b1e] rounded-xl shrink-0" />
                <div className="flex-1 py-2 space-y-2">
                  <div className="h-4 bg-[#1a1b1e] rounded w-3/4" />
                  <div className="h-3 bg-[#1a1b1e] rounded w-1/2" />
                  <div className="h-3 bg-[#1a1b1e] rounded w-1/4 mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
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
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="text-5xl mb-3">🍽️</span>
            <p className="text-white font-semibold">No hay restaurantes disponibles en este momento</p>
            <p className="text-[#9a9da3] text-sm mt-1">Vuelve a consultar más tarde</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="text-5xl mb-3">🔍</span>
            <p className="text-white font-semibold">Sin resultados</p>
            <p className="text-[#9a9da3] text-sm mt-1">Intenta con otra búsqueda o categoría</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(r => {
              const restId = String(r.id)
              const isFav = favoriteIds.has(restId)
              const isToggling = togglingFavId === restId
              return (
                <div
                  key={r.id}
                  onClick={() => onSelectRestaurant && onSelectRestaurant(r)}
                  className="flex gap-3 bg-[#232427] border border-[#35373b] rounded-2xl overflow-hidden hover:border-[#5bc827]/40 transition-all cursor-pointer group relative"
                >
                  <div className="w-24 h-24 shrink-0 relative overflow-hidden bg-gradient-to-br from-[#232427] via-[#1a1b1e] to-[#0d0e10] flex items-center justify-center">
                    {r.coverImg ? (
                      <img
                        src={getImageUrl(r.coverImg)}
                        alt={r.nombre || r.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = 'none'
                        }}
                      />
                    ) : (
                      <span className="text-3xl">{getCategoryEmoji(r.categoria || r.category || '')}</span>
                    )}
                    {!r.isOpen && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="bg-[#1a1b1e]/90 text-red-400 text-[9px] font-bold px-1.5 py-0.5 rounded border border-red-900">
                          Cerrado
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col justify-center py-2 pr-10 flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm text-white">{r.nombre || r.name}</h3>
                      <div className="flex items-center gap-0.5">
                        <span className="text-[#5bc827] text-xs">★</span>
                        <span className="text-xs text-white font-semibold">{r.rating}</span>
                      </div>
                    </div>
                    <p className="text-[#9a9da3] text-xs mt-0.5">{r.categoria || r.category}</p>
                    <div className="flex items-center gap-2 mt-2 text-[10px] text-[#9a9da3]">
                      <span>⏱ {r.tiempoEntrega || r.time || '—'}</span>
                      <span className="text-[#35373b]">·</span>
                      <span className={r.deliveryFee === 0 ? 'text-[#5bc827] font-semibold' : ''}>
                        {r.deliveryFeeTexto || r.delivery || (r.deliveryFee === 0 ? 'Envío gratis' : `Envío $${r.deliveryFee}`)}
                      </span>
                    </div>
                  </div>

                  {/* Botón de favorito */}
                  <button
                    type="button"
                    onClick={(e) => handleToggleFavorite(restId, e)}
                    disabled={isToggling}
                    title={isFav ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                    className="absolute top-2 right-2 bg-[#1a1b1e]/70 hover:bg-[#1a1b1e] rounded-full p-1.5 transition-colors cursor-pointer z-10 disabled:opacity-50"
                  >
                    <svg
                      className={`w-4 h-4 transition-colors ${isFav ? 'text-[#5bc827] fill-[#5bc827]' : 'text-white'}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}


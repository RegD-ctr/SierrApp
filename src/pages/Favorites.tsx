import { useState, useEffect } from 'react'
import type { Restaurant } from '@/data'
import { getCategoryEmoji } from '@/data'
import { api, getImageUrl } from '@/lib/api'

interface Props {
  onBack: () => void
  onSelectRestaurant?: (r: Restaurant | any) => void
  onToggleFavorite?: (restaurantId: string) => void
}

export default function Favorites({ onBack, onSelectRestaurant, onToggleFavorite }: Props) {
  const [favorites, setFavorites] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const loadFavorites = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await api.get<any[]>('/api/users/me/favorites')
      if (Array.isArray(data)) {
        setFavorites(data)
      }
    } catch (err: any) {
      console.error('Error cargando favoritos:', err)
      setError(err?.message || 'Error al cargar favoritos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFavorites()
  }, [])

  const handleToggle = async (restaurantId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (togglingId) return
    setTogglingId(restaurantId)
    try {
      const res = await api.patch<{ restaurantId: string; isFavorite: boolean }>(
        `/api/users/me/favorites/${restaurantId}/toggle`
      )
      if (!res.isFavorite) {
        setFavorites(prev => prev.filter(r => r.id !== restaurantId))
        if (onToggleFavorite) onToggleFavorite(restaurantId)
      }
    } catch (err) {
      console.error('Error al actualizar favorito:', err)
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#1a1b1e] text-white flex flex-col">
      <header className="sticky top-0 z-40 bg-[#1a1b1e]/95 backdrop-blur-sm border-b border-[#35373b] px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="text-[#9a9da3] hover:text-white transition-colors cursor-pointer">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold uppercase tracking-wide" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
          Favoritos
        </h1>
      </header>

      <div className="p-4 max-w-5xl mx-auto w-full flex-1">
        {loading && favorites.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(n => (
              <div key={n} className="animate-pulse bg-[#232427] border border-[#35373b] rounded-2xl overflow-hidden h-56">
                <div className="h-40 bg-[#1a1b1e]" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-[#1a1b1e] rounded w-2/3" />
                  <div className="h-3 bg-[#1a1b1e] rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-4xl mb-3">⚠️</span>
            <p className="text-white font-semibold">{error}</p>
            <button
              onClick={loadFavorites}
              className="mt-4 px-5 py-2 bg-[#5bc827] text-[#1a1b1e] font-bold text-xs rounded-full hover:bg-[#7ed944] transition-all cursor-pointer"
            >
              Reintentar
            </button>
          </div>
        ) : favorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-5xl mb-4">❤️</span>
            <p className="text-white font-semibold text-lg">No tienes favoritos aún</p>
            <p className="text-[#9a9da3] text-sm mt-1">Guarda los restaurantes que más te gusten</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {favorites.map(r => {
              const nombre = r.nombre || r.name || 'Restaurante'
              const categoria = r.categoria || r.category || ''
              const tiempoEntrega = r.tiempoEntrega || r.time || '—'
              const rating = r.rating ?? 5
              const isToggling = togglingId === r.id

              return (
                <div
                  key={r.id}
                  onClick={() => onSelectRestaurant && onSelectRestaurant(r)}
                  className="bg-[#232427] border border-[#35373b] rounded-2xl overflow-hidden group cursor-pointer hover:border-[#5bc827]/50 transition-all hover:shadow-lg hover:shadow-[#5bc827]/10"
                >
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
                    
                    {/* Botón de toggle de favoritos */}
                    <button
                      onClick={(e) => handleToggle(r.id, e)}
                      disabled={isToggling}
                      title="Quitar de favoritos"
                      className="absolute top-2 right-2 bg-[#1a1b1e]/70 hover:bg-[#1a1b1e] rounded-full p-2 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <svg className="w-4 h-4 text-[#5bc827] fill-[#5bc827]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </button>
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-sm text-white mb-1 leading-tight">{nombre}</h3>
                    <div className="flex items-center gap-2 text-[10px] text-[#9a9da3]">
                      <span className="text-[#5bc827]">★ {rating}</span>
                      <span className="text-[#35373b]">·</span>
                      <span>⏱ {tiempoEntrega}</span>
                      {categoria && (
                        <>
                          <span className="text-[#35373b]">·</span>
                          <span>{categoria}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

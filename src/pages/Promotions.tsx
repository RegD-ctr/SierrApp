import { useState, useEffect } from 'react'
import type { Restaurant } from '@/data'
import { getCategoryEmoji } from '@/data'
import { api, getImageUrl } from '@/lib/api'

export interface PublicPromotion {
  id: string
  restaurantId: string
  titulo: string
  descripcion?: string | null
  descuentoPorcentaje?: number | null
  codigo?: string | null
  vigenciaInicio?: string | null
  vigenciaFin?: string | null
  activo: boolean
  createdAt: string
  restaurant: {
    id: string
    nombre: string
    coverImg?: string | null
    categoria: string
  }
}

interface Props {
  onBack: () => void
  onSelectRestaurant: (r: Restaurant) => void
}

/**
 * Componente que muestra el listado de promociones activas en la plataforma.
 * Consume GET /api/promotions y permite navegar directamente al restaurante seleccionado.
 * 
 * @param {Props} props - Propiedades con función para volver (onBack) y para seleccionar restaurante (onSelectRestaurant).
 */
export default function Promotions({ onBack, onSelectRestaurant }: Props) {
  const [promociones, setPromociones] = useState<PublicPromotion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [navigatingId, setNavigatingId] = useState<string | null>(null)

  const loadPromotions = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await api.get<PublicPromotion[]>('/api/promotions')
      setPromociones(data)
    } catch (err: any) {
      setError(err?.message || 'Error al cargar las promociones.')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectPromo = async (promo: PublicPromotion) => {
    if (navigatingId) return
    setNavigatingId(promo.id)
    try {
      const full = await api.get<Restaurant>(`/api/restaurants/${promo.restaurantId}`)
      onSelectRestaurant(full)
    } catch {
      onSelectRestaurant(promo.restaurant as unknown as Restaurant)
    } finally {
      setNavigatingId(null)
    }
  }

  useEffect(() => {
    loadPromotions()
  }, [])

  return (
    <div className="min-h-screen bg-[#1a1b1e] text-white flex flex-col">
      <header className="sticky top-0 z-40 bg-[#1a1b1e]/95 backdrop-blur-sm border-b border-[#35373b] px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="text-[#9a9da3] hover:text-white transition-colors cursor-pointer">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold uppercase tracking-wide" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
          Promociones Activas
        </h1>
      </header>

      <div className="p-4 space-y-4 max-w-lg mx-auto w-full pb-24 flex-1">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(n => (
              <div key={n} className="animate-pulse bg-[#232427] border border-[#35373b] rounded-2xl overflow-hidden h-28 flex">
                <div className="w-28 h-28 bg-[#1a1b1e] shrink-0" />
                <div className="p-3.5 flex-1 space-y-2">
                  <div className="h-4 bg-[#1a1b1e] rounded w-2/3" />
                  <div className="h-3 bg-[#1a1b1e] rounded w-1/3" />
                  <div className="h-5 bg-[#1a1b1e] rounded w-1/2 mt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-[#232427] border border-[#35373b] rounded-2xl p-6">
            <span className="text-4xl mb-3">⚠️</span>
            <p className="text-white font-semibold">{error}</p>
            <button
              onClick={loadPromotions}
              className="mt-4 px-5 py-2 bg-[#5bc827] text-[#1a1b1e] font-bold text-xs rounded-full hover:bg-[#7ed944] transition-all cursor-pointer"
            >
              Reintentar
            </button>
          </div>
        ) : promociones.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-5xl mb-3">🎉</span>
            <p className="text-white font-semibold text-lg">No hay promociones activas por ahora</p>
            <p className="text-[#9a9da3] text-sm mt-1 max-w-xs">
              Vuelve a consultar más tarde para conocer nuevos descuentos y ofertas especiales.
            </p>
          </div>
        ) : (
          promociones.map(promo => {
            const r = promo.restaurant
            return (
              <div
                key={promo.id}
                onClick={() => handleSelectPromo(promo)}
                className={`bg-[#232427] border border-[#35373b] hover:border-[#5bc827]/50 rounded-2xl overflow-hidden flex cursor-pointer transition-all hover:scale-[1.01] group ${
                  navigatingId === promo.id ? 'opacity-60 pointer-events-none' : ''
                }`}
              >
                <div className="relative w-28 h-28 shrink-0 overflow-hidden bg-gradient-to-br from-[#232427] via-[#1a1b1e] to-[#0d0e10] flex items-center justify-center">
                  {r.coverImg ? (
                    <img
                      src={getImageUrl(r.coverImg)}
                      alt={r.nombre}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={e => {
                        (e.currentTarget as HTMLElement).style.display = 'none'
                      }}
                    />
                  ) : (
                    <span className="text-3xl">{getCategoryEmoji(r.categoria || '')}</span>
                  )}
                  {promo.descuentoPorcentaje != null && promo.descuentoPorcentaje > 0 && (
                    <span className="absolute top-1.5 left-1.5 bg-[#5bc827] text-[#1a1b1e] text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide">
                      -{promo.descuentoPorcentaje}%
                    </span>
                  )}
                </div>
                <div className="p-3.5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <h3 className="font-bold text-sm text-white group-hover:text-[#5bc827] transition-colors">{r.nombre}</h3>
                      <span className="text-[#9a9da3] text-[10px] shrink-0">{r.categoria}</span>
                    </div>
                    <p className="text-white text-xs font-semibold leading-snug">{promo.titulo}</p>
                    {promo.descripcion && (
                      <p className="text-[#9a9da3] text-[11px] mt-0.5 line-clamp-1">{promo.descripcion}</p>
                    )}
                    {promo.codigo && (
                      <div className="inline-flex items-center gap-1.5 bg-[#5bc827]/15 border border-[#5bc827]/40 rounded-lg px-2 py-0.5 mt-1.5">
                        <span className="text-xs">🏷️</span>
                        <span className="text-[11px] font-mono font-bold text-[#5bc827]">{promo.codigo}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#35373b]/50 text-[11px] text-[#9a9da3]">
                    <span>Ver menú disponible</span>
                    <span className="text-[#5bc827] font-semibold group-hover:underline">Ir al local →</span>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

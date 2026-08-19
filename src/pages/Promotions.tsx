import { restaurants } from '@/data'
import type { Restaurant } from '@/data'

interface Props {
  onBack: () => void
  onSelectRestaurant: (r: Restaurant) => void
}

/**
 * Componente que muestra el listado de promociones activas.
 * Filtra los restaurantes con ofertas o descuentos en data.ts y permite navegar directamente a su menú.
 * 
 * @param {Props} props - Propiedades con función para volver (onBack) y para seleccionar restaurante (onSelectRestaurant).
 */
export default function Promotions({ onBack, onSelectRestaurant }: Props) {
  const promosActivas = restaurants.filter(r => r.promo !== null)

  return (
    <div className="min-h-screen bg-[#1a1b1e] text-white flex flex-col">
      <header className="sticky top-0 z-40 bg-[#1a1b1e]/95 backdrop-blur-sm border-b border-[#35373b] px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="text-[#9a9da3] hover:text-white transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-xl font-bold uppercase tracking-wide" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Promociones Activas</h1>
      </header>

      <div className="p-4 space-y-4 max-w-lg mx-auto w-full pb-24">
        {promosActivas.map(r => (
          <div 
            key={r.id} 
            onClick={() => onSelectRestaurant(r)}
            className="bg-[#232427] border border-[#35373b] hover:border-[#5bc827]/50 rounded-2xl overflow-hidden flex cursor-pointer transition-all hover:scale-[1.01] group"
          >
            <div className="relative w-28 h-28 shrink-0 overflow-hidden bg-[#1a3320]">
              <img src={r.coverImg} alt={r.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              {r.badge && (
                <span className="absolute top-1.5 left-1.5 bg-[#5bc827] text-[#1a1b1e] text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide">
                  {r.badge}
                </span>
              )}
            </div>
            <div className="p-3.5 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <h3 className="font-bold text-sm text-white">{r.name}</h3>
                  <span className="text-[#9a9da3] text-xs">{r.category}</span>
                </div>
                <div className="inline-flex items-center gap-1.5 bg-[#5bc827]/15 border border-[#5bc827]/40 rounded-lg px-2.5 py-1 mt-1">
                  <span className="text-sm">🏷️</span>
                  <span className="text-xs font-bold text-[#5bc827]">{r.promo}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#35373b]/50 text-[11px] text-[#9a9da3]">
                <span>⏱ {r.time} · {r.delivery}</span>
                <span className="text-[#5bc827] font-semibold group-hover:underline">Ir al local →</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

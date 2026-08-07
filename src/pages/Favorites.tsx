import { restaurants } from '@/data'
import { useState } from 'react'

export default function Favorites({ onBack }: { onBack: () => void }) {
  const [liked, setLiked] = useState<Record<number, boolean>>({ 1: true, 3: true, 4: true })
  
  const favs = restaurants.filter(r => liked[r.id])

  return (
    <div className="min-h-screen bg-[#1a1b1e] text-white flex flex-col">
      <header className="sticky top-0 z-40 bg-[#1a1b1e]/95 backdrop-blur-sm border-b border-[#35373b] px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="text-[#9a9da3] hover:text-white transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-xl font-bold uppercase tracking-wide" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Favoritos</h1>
      </header>

      <div className="p-4 max-w-5xl mx-auto w-full">
        {favs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-5xl mb-4">❤️</span>
            <p className="text-white font-semibold text-lg">No tienes favoritos aún</p>
            <p className="text-[#9a9da3] text-sm mt-1">Guarda los restaurantes que más te gusten</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {favs.map(r => (
              <div key={r.id} className="bg-[#232427] border border-[#35373b] rounded-2xl overflow-hidden group cursor-pointer hover:border-[#5bc827]/50 transition-all hover:shadow-lg hover:shadow-[#5bc827]/10">
                <div className="relative h-40 overflow-hidden bg-[#1a3320]">
                  <img src={r.coverImg} alt={r.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1a1b1e]/60 to-transparent" />
                  <button onClick={(e) => { e.stopPropagation(); setLiked(prev => ({ ...prev, [r.id]: false })) }}
                    className="absolute top-2 right-2 bg-[#1a1b1e]/60 rounded-full p-1.5 hover:bg-[#1a1b1e]/80 transition-colors">
                    <svg className="w-3.5 h-3.5 text-[#5bc827] fill-[#5bc827]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-sm text-white mb-1">{r.name}</h3>
                  <div className="flex items-center gap-2 text-[10px] text-[#9a9da3]">
                    <span className="text-[#5bc827]">★ {r.rating}</span>
                    <span className="text-[#35373b]">·</span>
                    <span>⏱ {r.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

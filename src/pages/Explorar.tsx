import { useState } from 'react'
import { restaurants as allRestaurants } from '@/data'

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

const allRestaurants = [
  { id: 1, name: 'El Rincón del Sabor', cat: 'Tacos', rating: 4.8, time: '25-35 min', price: '$$', img: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&w=400&h=200' },
  { id: 2, name: 'Sierra Burger Co.', cat: 'Hamburguesas', rating: 4.6, time: '20-30 min', price: '$$', img: 'https://images.unsplash.com/photo-1512152272829-e3139592d56f?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&w=400&h=200' },
  { id: 3, name: 'Sakura Sushi', cat: 'Sushi', rating: 4.9, time: '30-45 min', price: '$$$', img: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&w=400&h=200' },
  { id: 4, name: 'Pizzería Napoli', cat: 'Pizza', rating: 4.7, time: '25-40 min', price: '$$', img: 'https://images.unsplash.com/photo-1566843972142-a7fcb70de55a?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&w=400&h=200' },
  { id: 5, name: 'La Parrilla Sierra', cat: 'Carnes', rating: 4.5, time: '35-50 min', price: '$$$', img: 'https://images.unsplash.com/photo-1505826759037-406b40feb4cd?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&w=400&h=200' },
  { id: 6, name: 'Rolls & More', cat: 'Sushi', rating: 4.7, time: '30-40 min', price: '$$', img: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&w=400&h=200' },
  { id: 7, name: 'Café Montaña', cat: 'Café', rating: 4.4, time: '15-20 min', price: '$', img: 'https://images.unsplash.com/photo-1611143669185-af224c5e3252?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&w=400&h=200' },
  { id: 8, name: 'Pollo Sierra', cat: 'Pollo', rating: 4.3, time: '20-30 min', price: '$', img: 'https://images.unsplash.com/photo-1610614819513-58e34989848b?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&w=400&h=200' },
]

const filters = ['Más populares', 'Más rápidos', 'Mejor precio', 'Mejor rating']

export default function Explorar({ onSelectRestaurant }: { onSelectRestaurant?: (r: import('@/data').Restaurant) => void }) {
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('Más populares')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const filtered = allRestaurants.filter(r => {
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase()) || r.cat.toLowerCase().includes(search.toLowerCase())
    const matchCat = !activeCategory || r.cat === activeCategory
    return matchSearch && matchCat
  })

  return (
    <div className="min-h-screen bg-[#0d1a0f] pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#0d1a0f]/95 backdrop-blur-sm border-b border-[#2a4830] px-4 py-3">
        <h1
          className="text-2xl font-bold text-white uppercase mb-3"
          style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
        >
          Explorar
        </h1>
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7aaa70]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Restaurantes, comida, categorías..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#142a17] border border-[#2a4830] focus:border-[#5bc827] rounded-full py-2.5 pl-9 pr-4 text-sm text-white placeholder-[#7aaa70] outline-none transition-colors"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7aaa70] hover:text-white">
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="px-4 pt-5">
        {/* Categories grid */}
        <h2 className="text-sm font-semibold text-[#a8d89a] uppercase tracking-widest mb-3">Categorías</h2>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 mb-6">
          {allCategories.map(cat => (
            <button
              key={cat.label}
              onClick={() => setActiveCategory(activeCategory === cat.label ? null : cat.label)}
              className={`flex flex-col items-center gap-1 py-3 rounded-xl border transition-all ${
                activeCategory === cat.label
                  ? 'bg-[#5bc827] border-[#5bc827] text-[#0d1a0f]'
                  : 'bg-[#142a17] border-[#2a4830] text-[#a8d89a] hover:border-[#5bc827]/50'
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
                  : 'bg-[#142a17] border-[#2a4830] text-[#7aaa70] hover:border-[#5bc827]/50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Results */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-[#7aaa70] text-xs">
            {filtered.length} resultados{activeCategory ? ` en ${activeCategory}` : ''}
          </span>
          {activeCategory && (
            <button onClick={() => setActiveCategory(null)} className="text-[#5bc827] text-xs font-semibold">
              Limpiar filtro ✕
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="text-5xl mb-3">🔍</span>
            <p className="text-white font-semibold">Sin resultados</p>
            <p className="text-[#7aaa70] text-sm mt-1">Intenta con otra búsqueda o categoría</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(r => (
              <div
                key={r.id}
                onClick={() => {
                  const full = (allRestaurants as import('@/data').Restaurant[]).find(x => x.name === r.name)
                  if (full && onSelectRestaurant) onSelectRestaurant(full)
                }}
                className="flex gap-3 bg-[#142a17] border border-[#2a4830] rounded-2xl overflow-hidden hover:border-[#5bc827]/40 transition-all cursor-pointer"
              >
                <img src={r.img} alt={r.name} className="w-24 h-24 object-cover shrink-0" />
                <div className="flex flex-col justify-center py-2 pr-3 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm text-white">{r.name}</h3>
                    <div className="flex items-center gap-0.5">
                      <span className="text-[#5bc827] text-xs">★</span>
                      <span className="text-xs text-white font-semibold">{r.rating}</span>
                    </div>
                  </div>
                  <p className="text-[#7aaa70] text-xs mt-0.5">{r.cat}</p>
                  <div className="flex items-center gap-2 mt-2 text-[10px] text-[#7aaa70]">
                    <span>⏱ {r.time}</span>
                    <span className="text-[#2a4830]">·</span>
                    <span>{r.price}</span>
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

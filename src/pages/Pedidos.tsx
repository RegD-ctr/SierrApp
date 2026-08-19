import { useState } from 'react'

type Tab = 'activo' | 'historial'

const activeOrder = {
  id: '#SRR-4821',
  restaurant: 'Sierra Burger Co.',
  items: ['Burger Clásica x1', 'Papas grandes x1', 'Refresco x1'],
  total: '$185',
  status: 3,
  statuses: [
    { label: 'Pedido recibido', icon: '✅', time: '8:42 pm' },
    { label: 'Preparando', icon: '👨‍🍳', time: '8:45 pm' },
    { label: 'En camino', icon: '🛵', time: '8:58 pm' },
    { label: 'Entregado', icon: '🏠', time: null },
  ],
  driver: { name: 'Carlos M.', rating: 4.9, eta: '8 min' },
}

const history = [
  {
    id: '#SRR-4810',
    restaurant: 'El Rincón del Sabor',
    items: ['Orden de tacos x3', 'Agua de jamaica x1'],
    total: '$120',
    date: 'Hoy, 2:15 pm',
    status: 'Entregado',
    rating: null,
    img: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&w=80&h=80',
  },
  {
    id: '#SRR-4798',
    restaurant: 'Sakura Sushi',
    items: ['Roll Spicy Tuna x2', 'Miso soup x1'],
    total: '$340',
    date: 'Ayer, 8:30 pm',
    status: 'Entregado',
    rating: 5,
    img: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&w=80&h=80',
  },
  {
    id: '#SRR-4775',
    restaurant: 'Pizzería Napoli',
    items: ['Pizza Margherita x1'],
    total: '$210',
    date: '3 ago, 7:00 pm',
    status: 'Cancelado',
    rating: null,
    img: 'https://images.unsplash.com/photo-1566843972142-a7fcb70de55a?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&w=80&h=80',
  },
  {
    id: '#SRR-4760',
    restaurant: 'Sierra Burger Co.',
    items: ['Combo Doble x2'],
    total: '$290',
    date: '1 ago, 1:20 pm',
    status: 'Entregado',
    rating: 4,
    img: 'https://images.unsplash.com/photo-1512152272829-e3139592d56f?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&w=80&h=80',
  },
]

interface Props {
  initialTab?: 'activo' | 'historial'
}

/**
 * Componente que muestra los pedidos del usuario.
 * Permite visualizar el pedido activo actualmente y el historial de pedidos pasados.
 */
export default function Pedidos({ initialTab = 'activo' }: Props) {
  const [tab, setTab] = useState<Tab>(initialTab)
  const [ratings, setRatings] = useState<Record<string, number>>({})

  return (
    <div className="min-h-screen bg-[#1a1b1e] pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#1a1b1e]/95 backdrop-blur-sm border-b border-[#35373b] px-4 py-3">
        <h1
          className="text-2xl font-bold text-white uppercase mb-3"
          style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
        >
          Mis Pedidos
        </h1>
        <div className="flex bg-[#232427] rounded-full p-1 w-fit gap-1">
          {(['activo', 'historial'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-1.5 rounded-full text-xs font-bold capitalize transition-all ${
                tab === t
                  ? 'bg-[#5bc827] text-[#1a1b1e]'
                  : 'text-[#9a9da3] hover:text-white'
              }`}
            >
              {t === 'activo' ? 'En curso' : 'Historial'}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-5">
        {/* Active Order */}
        {tab === 'activo' && (
          <div>
            {/* Live pulse banner */}
            <div className="flex items-center gap-2 mb-4">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#5bc827] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#5bc827]"></span>
              </span>
              <span className="text-[#5bc827] text-xs font-semibold">1 pedido activo</span>
            </div>

            <div className="bg-[#232427] border border-[#5bc827]/30 rounded-2xl overflow-hidden">
              {/* Order header */}
              <div className="px-4 pt-4 pb-3 border-b border-[#35373b]">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-white text-sm">{activeOrder.restaurant}</span>
                  <span className="text-[#9a9da3] text-xs">{activeOrder.id}</span>
                </div>
                <p className="text-[#9a9da3] text-xs">{activeOrder.items.join(' · ')}</p>
                <p className="text-[#5bc827] font-bold text-sm mt-1">{activeOrder.total}</p>
              </div>

              {/* Status tracker */}
              <div className="px-4 py-4">
                <div className="relative">
                  {/* Line */}
                  <div className="absolute left-4 top-5 bottom-5 w-0.5 bg-[#35373b]" />
                  <div
                    className="absolute left-4 top-5 w-0.5 bg-[#5bc827] transition-all duration-700"
                    style={{ height: `${((activeOrder.status - 1) / (activeOrder.statuses.length - 1)) * 100}%` }}
                  />
                  <div className="space-y-5">
                    {activeOrder.statuses.map((s, i) => {
                      const done = i < activeOrder.status
                      const current = i === activeOrder.status - 1
                      return (
                        <div key={i} className="flex items-center gap-3 relative">
                          <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 transition-all ${
                            done
                              ? 'bg-[#5bc827] border-[#5bc827]'
                              : current
                              ? 'bg-[#232427] border-[#5bc827] animate-pulse'
                              : 'bg-[#232427] border-[#35373b]'
                          }`}>
                            {s.icon}
                          </div>
                          <div className="flex-1">
                            <p className={`text-sm font-semibold ${done ? 'text-white' : 'text-[#9a9da3]'}`}>{s.label}</p>
                            {s.time && <p className="text-[#9a9da3] text-xs">{s.time}</p>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Driver */}
              <div className="mx-4 mb-4 p-3 bg-[#1a1b1e] rounded-xl flex items-center justify-between border border-[#35373b]">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 bg-[#5bc827] rounded-full flex items-center justify-center text-[#1a1b1e] font-bold text-sm">
                    {activeOrder.driver.name[0]}
                  </div>
                  <div>
                    <p className="text-white text-xs font-semibold">{activeOrder.driver.name}</p>
                    <p className="text-[#9a9da3] text-[10px]">★ {activeOrder.driver.rating} · Tu repartidor</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="bg-[#232427] border border-[#35373b] rounded-full px-3 py-1.5 text-[10px] text-[#c4c6ca] hover:border-[#5bc827] transition-colors">
                    📞 Llamar
                  </button>
                  <div className="bg-[#5bc827]/20 text-[#5bc827] border border-[#5bc827]/30 rounded-full px-3 py-1.5 text-[10px] font-bold">
                    ETA {activeOrder.driver.eta}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* History */}
        {tab === 'historial' && (
          <div className="space-y-3">
            {history.map(order => (
              <div key={order.id} className="bg-[#232427] border border-[#35373b] rounded-2xl overflow-hidden">
                <div className="flex gap-3 p-3">
                  <img src={order.img} alt={order.restaurant} className="w-14 h-14 rounded-xl object-cover shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm text-white">{order.restaurant}</h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        order.status === 'Entregado'
                          ? 'bg-[#5bc827]/20 text-[#5bc827]'
                          : 'bg-red-900/30 text-red-400'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-[#9a9da3] text-xs mt-0.5 truncate">{order.items.join(', ')}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-[#9a9da3]">{order.date}</span>
                      <span className="text-[#5bc827] text-xs font-bold">{order.total}</span>
                    </div>
                  </div>
                </div>

                {order.status === 'Entregado' && (
                  <div className="border-t border-[#35373b] px-3 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map(n => (
                        <button
                          key={n}
                          onClick={() => setRatings(r => ({ ...r, [order.id]: n }))}
                          className={`text-base transition-transform hover:scale-125 ${
                            n <= (ratings[order.id] ?? order.rating ?? 0) ? 'text-[#5bc827]' : 'text-[#35373b]'
                          }`}
                        >
                          ★
                        </button>
                      ))}
                      <span className="text-[#9a9da3] text-[10px] ml-1">
                        {ratings[order.id] ? 'Gracias!' : 'Calificar'}
                      </span>
                    </div>
                    <button className="text-[#5bc827] text-xs font-semibold hover:text-[#7ed944] transition-colors">
                      Repetir pedido →
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

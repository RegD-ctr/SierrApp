import { useState, useEffect } from 'react'

export interface Order {
  id: string
  restaurant: string
  items: string[]
  total: string
  status: number
  statuses: { label: string; icon: string; time: string | null }[]
  driver: { name: string; rating: number; eta: string }
}

interface Props {
  order: Order
  onBack: () => void
  onSupport: () => void
  onDeliveryComplete: () => void
}

/**
 * Componente para el seguimiento detallado de un pedido activo (estilo Rappi).
 * Incluye un mapa animado simulado, tracker vertical de estatus, tarjeta con calificación del repartidor,
 * botón de simulación para cambiar estado a entregado y acceso a soporte.
 * 
 * @param {Props} props - Datos del pedido y callbacks de navegación.
 */
export default function OrderTracking({ order, onBack, onSupport, onDeliveryComplete }: Props) {
  // Cálculo de progreso para animar el repartidor en el mapa (0% a 100%)
  const progressRatio = Math.min(1, (order.status - 1) / Math.max(1, order.statuses.length - 1))
  const driverLeft = 15 + progressRatio * 65 // de 15% a 80%
  const driverTop = 70 - progressRatio * 45  // de 70% a 25%

  const starsCount = Math.round(order.driver.rating)

  return (
    <div className="min-h-screen bg-[#1a1b1e] text-white flex flex-col">
      {/* Header estilo estándar de Sierra App */}
      <header className="sticky top-0 z-40 bg-[#1a1b1e]/95 backdrop-blur-sm border-b border-[#35373b] px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="text-[#9a9da3] hover:text-white transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-xl font-bold uppercase tracking-wide leading-none" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
            Seguimiento del pedido
          </h1>
          <span className="text-xs text-[#5bc827] font-semibold">{order.id} · {order.restaurant}</span>
        </div>
      </header>

      <div className="flex-1 p-4 max-w-lg mx-auto w-full space-y-5 pb-24">
        {/* Mapa de estado animado (Estilo Rappi) */}
        <section className="bg-[#232427] border border-[#35373b] rounded-2xl h-56 relative overflow-hidden shadow-xl">
          {/* Fondo de mapa simulado en SVG cuadrícula */}
          <div className="absolute inset-0 bg-[#1e2023] opacity-80">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#2e3136" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
              {/* Calles principales simuladas */}
              <path d="M -10 150 Q 150 140 300 80 T 500 40" fill="none" stroke="#383c42" strokeWidth="12" />
              <path d="M 120 -10 Q 140 100 280 220" fill="none" stroke="#383c42" strokeWidth="8" />
              <path d="M -10 150 Q 150 140 300 80 T 500 40" fill="none" stroke="#5bc827" strokeWidth="3" strokeDasharray="6,6" opacity="0.8" />
            </svg>
          </div>

          {/* Badge del estado actual */}
          <div className="absolute top-3 left-3 bg-[#1a1b1e]/90 border border-[#35373b] backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 z-10">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#5bc827] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#5bc827]"></span>
            </span>
            <span className="text-xs font-bold text-white">
              {order.status === 4 ? '¡Pedido entregado!' : `ETA: ${order.driver.eta}`}
            </span>
          </div>

          {/* Pin de entrega (Fijo) */}
          <div className="absolute right-[15%] top-[25%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10">
            <div className="bg-[#1a1b1e] text-[#5bc827] text-[10px] font-bold px-2 py-0.5 rounded border border-[#5bc827]/40 mb-1 shadow-lg">
              Tu ubicación
            </div>
            <div className="text-3xl animate-bounce">📍</div>
          </div>

          {/* Repartidor en movimiento (Animación progresiva) */}
          <div 
            className="absolute z-20 flex flex-col items-center -translate-x-1/2 -translate-y-1/2 transition-all duration-1000 ease-in-out"
            style={{ left: `${driverLeft}%`, top: `${driverTop}%` }}
          >
            <div className="bg-[#5bc827] text-[#1a1b1e] text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-lg whitespace-nowrap mb-1">
              {order.driver.name} 🛵
            </div>
            <div className="w-10 h-10 bg-[#5bc827] rounded-full border-2 border-[#1a1b1e] flex items-center justify-center text-xl shadow-2xl">
              🛵
            </div>
          </div>
        </section>

        {/* Resumen del pedido en curso */}
        <section className="bg-[#232427] border border-[#35373b] rounded-2xl p-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Detalles de la orden</h2>
            <span className="text-[#5bc827] font-bold text-sm">{order.total}</span>
          </div>
          <p className="text-[#9a9da3] text-xs">{order.items.join(' · ')}</p>
        </section>

        {/* Proceso del pedido (Tracker vertical réplica de Pedidos.tsx) */}
        <section className="bg-[#232427] border border-[#35373b] rounded-2xl p-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Estado del envío</h2>
          <div className="relative">
            {/* Line */}
            <div className="absolute left-4 top-5 bottom-5 w-0.5 bg-[#35373b]" />
            <div
              className="absolute left-4 top-5 w-0.5 bg-[#5bc827] transition-all duration-700"
              style={{ height: `${((order.status - 1) / Math.max(1, order.statuses.length - 1)) * 100}%` }}
            />
            <div className="space-y-5">
              {order.statuses.map((s, i) => {
                const done = i < order.status
                const current = i === order.status - 1
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
        </section>

        {/* Tarjeta del Repartidor */}
        <section className="p-4 bg-[#232427] rounded-2xl border border-[#35373b] space-y-3">
          <h2 className="text-xs font-bold text-[#9a9da3] uppercase tracking-wider">Tu Repartidor</h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-[#5bc827] rounded-full flex items-center justify-center text-[#1a1b1e] font-extrabold text-base">
                {order.driver.name[0]}
              </div>
              <div>
                <p className="text-white text-sm font-bold">{order.driver.name}</p>
                {/* Estrellas visuales */}
                <div className="flex items-center gap-1 mt-0.5">
                  <div className="flex text-[#5bc827] text-xs">
                    {[1, 2, 3, 4, 5].map(star => (
                      <span key={star} className={star <= starsCount ? 'text-[#5bc827]' : 'text-[#35373b]'}>★</span>
                    ))}
                  </div>
                  <span className="text-white text-xs font-semibold ml-1">{order.driver.rating}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => alert(`Llamando a ${order.driver.name}...`)}
                className="bg-[#1a1b1e] border border-[#35373b] hover:border-[#5bc827] rounded-full px-3.5 py-1.5 text-xs text-[#c4c6ca] transition-colors"
              >
                📞 Llamar
              </button>
              <div className="bg-[#5bc827]/20 text-[#5bc827] border border-[#5bc827]/30 rounded-full px-3 py-1.5 text-xs font-bold">
                ETA {order.driver.eta}
              </div>
            </div>
          </div>
        </section>

        {/* Botón de simulación para pruebas de desarrollo */}
        {/* Nota: En backend real, este botón se reemplaza por actualización de WS/Polling */}
        {order.status === 3 && (
          <section className="bg-[#5bc827]/10 border border-[#5bc827]/40 rounded-2xl p-3 text-center space-y-2">
            <p className="text-xs text-[#5bc827] font-semibold">⚡ Modo Simulación de Pruebas</p>
            <button
              onClick={onDeliveryComplete}
              className="w-full py-2.5 bg-[#5bc827] hover:bg-[#7ed944] text-[#1a1b1e] font-bold text-xs rounded-xl transition-all shadow-md active:scale-98"
            >
              Simular: Marcar como entregado
            </button>
          </section>
        )}

        {/* Botón de Ayuda / Soporte */}
        <section>
          <button 
            onClick={onSupport} 
            className="w-full py-3.5 rounded-xl border border-[#35373b] hover:bg-[#232427] text-white font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            💬 ¿Necesitas ayuda con tu pedido?
          </button>
        </section>
      </div>
    </div>
  )
}

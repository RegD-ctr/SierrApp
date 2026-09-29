import { useState, useEffect, useCallback, useRef } from 'react'
import { api } from '@/lib/api'

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
  orderId?: string
  order?: any
  onBack: () => void
  onSupport: () => void
  onDeliveryComplete: (order?: any) => void
}

const STEP_DEFINITIONS = [
  { label: 'Confirmado', icon: '✓' },
  { label: 'En preparación', icon: '🍳' },
  { label: 'En camino', icon: '🛵' },
  { label: 'Entregado', icon: '🏠' },
]

function getStepNumber(estado: string): number {
  switch (estado) {
    case 'PENDIENTE':
      return 1
    case 'ACEPTADO':
    case 'LISTO':
      return 2
    case 'REPARTIDOR_ASIGNADO':
    case 'RECOGIDO':
    case 'EN_CAMINO':
      return 3
    case 'ENTREGADO':
      return 4
    default:
      return 1
  }
}

function findTimeForStep(stepIndex: number, history: Array<{ estado: string; timestamp: string }> = []): string | null {
  const matches = history.filter(h => {
    if (stepIndex === 0) return h.estado === 'PENDIENTE'
    if (stepIndex === 1) return h.estado === 'ACEPTADO' || h.estado === 'LISTO'
    if (stepIndex === 2) return h.estado === 'REPARTIDOR_ASIGNADO' || h.estado === 'RECOGIDO' || h.estado === 'EN_CAMINO'
    if (stepIndex === 3) return h.estado === 'ENTREGADO'
    return false
  })
  if (matches.length === 0) return null
  const lastMatch = matches[matches.length - 1]
  const d = new Date(lastMatch.timestamp)
  return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
}

/**
 * Componente para el seguimiento detallado de un pedido activo en tiempo real.
 * Consume GET /api/orders/:id con polling cada 6 segundos.
 * Mapea los estados del backend a las fases visuales y navega automáticamente a la
 * calificación al completarse la entrega (ENTREGADO).
 */
export default function OrderTracking({ orderId, order: propOrder, onBack, onSupport, onDeliveryComplete }: Props) {
  const targetId = orderId || propOrder?.id

  const [orderDetail, setOrderDetail] = useState<any>(propOrder || null)
  const [loading, setLoading] = useState(!propOrder)
  const [error, setError] = useState<string | null>(null)
  const deliveryHandledRef = useRef(false)

  const fetchOrderDetail = useCallback(async () => {
    if (!targetId) return null
    try {
      const data = await api.get<any>(`/api/orders/${targetId}`)
      setOrderDetail(data)
      if (data.estado === 'ENTREGADO' && !deliveryHandledRef.current) {
        deliveryHandledRef.current = true
        setTimeout(() => {
          onDeliveryComplete(data)
        }, 1500)
      }
      return data
    } catch (err: any) {
      console.error('Error al actualizar seguimiento del pedido:', err)
      setError(err?.message || 'No se pudo cargar el pedido')
      return null
    } finally {
      setLoading(false)
    }
  }, [targetId, onDeliveryComplete])

  useEffect(() => {
    deliveryHandledRef.current = false
    fetchOrderDetail()

    const interval = setInterval(async () => {
      const current = await fetchOrderDetail()
      if (current && ['ENTREGADO', 'CANCELADO', 'RECHAZADO'].includes(current.estado)) {
        clearInterval(interval)
      }
    }, 6000)

    return () => clearInterval(interval)
  }, [fetchOrderDetail])

  if (loading && !orderDetail) {
    return (
      <div className="min-h-screen bg-[#1a1b1e] text-white flex flex-col items-center justify-center p-6">
        <div className="w-8 h-8 border-2 border-[#5bc827] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs uppercase tracking-wider text-[#9a9da3]">Cargando seguimiento...</p>
      </div>
    )
  }

  if (error && !orderDetail) {
    return (
      <div className="min-h-screen bg-[#1a1b1e] text-white flex flex-col items-center justify-center p-6 text-center">
        <p className="text-red-400 text-sm mb-4">{error}</p>
        <button
          onClick={onBack}
          className="bg-[#232427] border border-[#35373b] hover:border-white px-5 py-2 rounded-xl text-xs font-bold"
        >
          Volver
        </button>
      </div>
    )
  }

  const estado = orderDetail?.estado || 'PENDIENTE'
  const currentStep = getStepNumber(estado)
  const isFinalState = ['ENTREGADO', 'CANCELADO', 'RECHAZADO'].includes(estado)

  // Driver details
  const driverName = orderDetail?.repartidor?.nombre || 'Repartidor asignado'
  const driverRating = orderDetail?.repartidor?.driverProfile?.ratingPromedio ?? 5.0
  const driverEta = estado === 'ENTREGADO' ? 'Entregado' : estado === 'EN_CAMINO' ? '5-10 min' : '20-30 min'
  const starsCount = Math.round(driverRating)

  // Items
  const itemsText = (orderDetail?.items || [])
    .map((i: any) => `${i.cantidad}x ${i.nombreSnapshot || i.dish?.nombre || 'Platillo'}`)
    .join(' · ')

  // Progress for map
  const progressRatio = Math.min(1, (currentStep - 1) / Math.max(1, STEP_DEFINITIONS.length - 1))
  const driverLeft = 15 + progressRatio * 65
  const driverTop = 70 - progressRatio * 45

  return (
    <div className="min-h-screen bg-[#1a1b1e] text-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#1a1b1e]/95 backdrop-blur-sm border-b border-[#35373b] px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="text-[#9a9da3] hover:text-white transition-colors cursor-pointer">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-xl font-bold uppercase tracking-wide leading-none" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
            Seguimiento del pedido
          </h1>
          <span className="text-xs text-[#5bc827] font-semibold">
            #{orderDetail?.id?.slice(0, 8).toUpperCase()} · {orderDetail?.restaurant?.nombre || 'Restaurante'}
          </span>
        </div>
      </header>

      <div className="flex-1 p-4 max-w-lg mx-auto w-full space-y-5 pb-24">
        {/* Status notice if cancelled/rejected */}
        {(estado === 'CANCELADO' || estado === 'RECHAZADO') && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-2xl text-xs font-semibold text-center">
            Este pedido ha sido {estado === 'CANCELADO' ? 'cancelado' : 'rechazado'}.
          </div>
        )}

        {/* Animated Map */}
        <section className="bg-[#232427] border border-[#35373b] rounded-2xl h-56 relative overflow-hidden shadow-xl">
          <div className="absolute inset-0 bg-[#1e2023] opacity-80">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#2e3136" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
              <path d="M -10 150 Q 150 140 300 80 T 500 40" fill="none" stroke="#383c42" strokeWidth="12" />
              <path d="M 120 -10 Q 140 100 280 220" fill="none" stroke="#383c42" strokeWidth="8" />
              <path d="M -10 150 Q 150 140 300 80 T 500 40" fill="none" stroke="#5bc827" strokeWidth="3" strokeDasharray="6,6" opacity="0.8" />
            </svg>
          </div>

          {/* Current State Badge */}
          <div className="absolute top-3 left-3 bg-[#1a1b1e]/90 border border-[#35373b] backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 z-10">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#5bc827] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#5bc827]"></span>
            </span>
            <span className="text-xs font-bold text-white">
              {estado === 'ENTREGADO' ? '¡Pedido entregado!' : `ETA: ${driverEta}`}
            </span>
          </div>

          {/* Destination Pin */}
          <div className="absolute right-[15%] top-[25%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10">
            <div className="bg-[#1a1b1e] text-[#5bc827] text-[10px] font-bold px-2 py-0.5 rounded border border-[#5bc827]/40 mb-1 shadow-lg">
              Tu ubicación
            </div>
            <div className="text-3xl animate-bounce">📍</div>
          </div>

          {/* Moving Driver Marker */}
          <div
            className="absolute z-20 flex flex-col items-center -translate-x-1/2 -translate-y-1/2 transition-all duration-1000 ease-in-out"
            style={{ left: `${driverLeft}%`, top: `${driverTop}%` }}
          >
            <div className="bg-[#5bc827] text-[#1a1b1e] text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-lg whitespace-nowrap mb-1">
              {driverName} 🛵
            </div>
            <div className="w-10 h-10 bg-[#5bc827] rounded-full border-2 border-[#1a1b1e] flex items-center justify-center text-xl shadow-2xl">
              🛵
            </div>
          </div>
        </section>

        {/* Details card */}
        <section className="bg-[#232427] border border-[#35373b] rounded-2xl p-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Detalles de la orden</h2>
            <span className="text-[#5bc827] font-bold text-sm">${orderDetail?.total?.toFixed(0)}</span>
          </div>
          <p className="text-[#9a9da3] text-xs">{itemsText || 'Sin detalles'}</p>
        </section>

        {/* Vertical Tracker */}
        <section className="bg-[#232427] border border-[#35373b] rounded-2xl p-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Estado del envío</h2>
          <div className="relative">
            <div className="absolute left-4 top-5 bottom-5 w-0.5 bg-[#35373b]" />
            <div
              className="absolute left-4 top-5 w-0.5 bg-[#5bc827] transition-all duration-700"
              style={{ height: `${((currentStep - 1) / Math.max(1, STEP_DEFINITIONS.length - 1)) * 100}%` }}
            />
            <div className="space-y-5">
              {STEP_DEFINITIONS.map((s, i) => {
                const done = i < currentStep
                const current = i === currentStep - 1
                const time = findTimeForStep(i, orderDetail?.statusHistory)

                return (
                  <div key={i} className="flex items-center gap-3 relative">
                    <div
                      className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 transition-all ${
                        done
                          ? 'bg-[#5bc827] border-[#5bc827] text-[#1a1b1e] font-bold'
                          : current
                          ? 'bg-[#232427] border-[#5bc827] text-[#5bc827] animate-pulse'
                          : 'bg-[#232427] border-[#35373b] text-[#9a9da3]'
                      }`}
                    >
                      {s.icon}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-semibold ${done ? 'text-white' : 'text-[#9a9da3]'}`}>{s.label}</p>
                      {time && <p className="text-[#9a9da3] text-xs">{time}</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Driver Card */}
        <section className="p-4 bg-[#232427] rounded-2xl border border-[#35373b] space-y-3">
          <h2 className="text-xs font-bold text-[#9a9da3] uppercase tracking-wider">Tu Repartidor</h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-[#5bc827] rounded-full flex items-center justify-center text-[#1a1b1e] font-extrabold text-base">
                {driverName[0]}
              </div>
              <div>
                <p className="text-white text-sm font-bold">{driverName}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <div className="flex text-[#5bc827] text-xs">
                    {[1, 2, 3, 4, 5].map(star => (
                      <span key={star} className={star <= starsCount ? 'text-[#5bc827]' : 'text-[#35373b]'}>
                        ★
                      </span>
                    ))}
                  </div>
                  <span className="text-white text-xs font-semibold ml-1">{driverRating}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => alert(`Llamando a ${driverName}...`)}
                className="bg-[#1a1b1e] border border-[#35373b] hover:border-[#5bc827] rounded-full px-3.5 py-1.5 text-xs text-[#c4c6ca] transition-colors cursor-pointer"
              >
                📞 Llamar
              </button>
              <div className="bg-[#5bc827]/20 text-[#5bc827] border border-[#5bc827]/30 rounded-full px-3 py-1.5 text-xs font-bold">
                ETA {driverEta}
              </div>
            </div>
          </div>
        </section>

        {/* Ayuda / Soporte */}
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

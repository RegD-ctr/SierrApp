import { useState, useEffect, useCallback } from 'react'
import { api, getImageUrl } from '@/lib/api'
import { getSocket } from '@/lib/socket'

type Tab = 'activo' | 'historial'

export interface RealOrder {
  id: string
  estado: string
  subtotal: number
  envio: number
  total: number
  metodoPago: string
  createdAt: string
  restaurant: {
    id?: string
    nombre: string
    coverImg?: string
  }
  repartidor?: {
    id: string
    nombre: string
    driverProfile?: { ratingPromedio?: number }
  } | null
  items: Array<{
    id: string
    nombreSnapshot: string
    precioUnitarioSnapshot: number
    cantidad: number
    extrasTotal: number
  }>
  ratingRestaurant?: number | null
  ratingRepartidor?: number | null
  comentario?: string | null
}

interface Props {
  initialTab?: 'activo' | 'historial'
  activeOrder?: any
  onOpenTracking?: (orderOrId: any) => void
  onRateOrder?: (orderId: string) => void
}

const TRACKER_STEPS = [
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

function formatStatusBadge(estado: string): { label: string; className: string } {
  switch (estado) {
    case 'ENTREGADO':
      return { label: 'Entregado', className: 'bg-[#5bc827]/20 text-[#5bc827]' }
    case 'CANCELADO':
      return { label: 'Cancelado', className: 'bg-red-900/30 text-red-400' }
    case 'RECHAZADO':
      return { label: 'Rechazado', className: 'bg-orange-900/30 text-orange-400' }
    case 'PENDIENTE':
      return { label: 'Pendiente', className: 'bg-yellow-500/20 text-yellow-400' }
    case 'ACEPTADO':
    case 'LISTO':
      return { label: 'En preparación', className: 'bg-blue-500/20 text-blue-400' }
    case 'REPARTIDOR_ASIGNADO':
    case 'RECOGIDO':
    case 'EN_CAMINO':
      return { label: 'En camino', className: 'bg-purple-500/20 text-purple-400' }
    default:
      return { label: estado, className: 'bg-[#35373b] text-[#c4c6ca]' }
  }
}

/**
 * Componente que muestra los pedidos reales del usuario desde el backend.
 * Permite visualizar pedidos activos (En curso) con tracker en vivo y cancelación,
 * y el historial de pedidos pasados con calificación real.
 */
export default function Pedidos({ initialTab = 'activo', onOpenTracking, onRateOrder }: Props) {
  const [tab, setTab] = useState<Tab>(initialTab)
  const [activeOrders, setActiveOrders] = useState<RealOrder[]>([])
  const [historyOrders, setHistoryOrders] = useState<RealOrder[]>([])
  const [loadingActive, setLoadingActive] = useState(true)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [ratings, setRatings] = useState<Record<string, number>>({})

  const fetchActive = useCallback(async () => {
    try {
      setLoadingActive(true)
      const data = await api.get<RealOrder[]>('/api/orders/me/active')
      setActiveOrders(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Error al cargar pedidos activos:', err)
      setActiveOrders([])
    } finally {
      setLoadingActive(false)
    }
  }, [])

  const fetchHistory = useCallback(async () => {
    try {
      setLoadingHistory(true)
      const data = await api.get<RealOrder[]>('/api/orders/me')
      setHistoryOrders(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Error al cargar historial de pedidos:', err)
      setHistoryOrders([])
    } finally {
      setLoadingHistory(false)
    }
  }, [])

  useEffect(() => {
    if (tab === 'activo') {
      fetchActive()
    } else {
      fetchHistory()
    }
  }, [tab, fetchActive, fetchHistory])

  useEffect(() => {
    const socket = getSocket()
    if (!socket) return

    const handleOrderEvent = () => {
      fetchActive()
      fetchHistory()
    }

    socket.on('order:updated', handleOrderEvent)
    socket.on('order:new', handleOrderEvent)
    return () => {
      socket.off('order:updated', handleOrderEvent)
      socket.off('order:new', handleOrderEvent)
    }
  }, [fetchActive, fetchHistory])

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm('¿Estás seguro de que deseas cancelar este pedido?')) return
    setCancellingId(orderId)
    try {
      await api.patch(`/api/orders/${orderId}/cancel`)
      await fetchActive()
    } catch (err: any) {
      alert(err?.message || 'No se pudo cancelar el pedido.')
    } finally {
      setCancellingId(null)
    }
  }

  const handleQuickRate = async (orderId: string, rating: number) => {
    setRatings(r => ({ ...r, [orderId]: rating }))
    try {
      await api.patch(`/api/orders/${orderId}/rate`, { ratingRestaurant: rating })
      await fetchHistory()
    } catch (err: any) {
      alert(err?.message || 'Error al calificar')
    }
  }

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
        {/* Active Tab */}
        {tab === 'activo' && (
          <div>
            {loadingActive ? (
              <div className="flex flex-col items-center justify-center py-20 text-[#9a9da3]">
                <div className="w-8 h-8 border-2 border-[#5bc827] border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-xs uppercase tracking-wider">Cargando pedidos activos...</p>
              </div>
            ) : activeOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <span className="text-5xl mb-3">🛵</span>
                <p className="text-white font-semibold">No tienes pedidos activos</p>
                <p className="text-[#9a9da3] text-sm mt-1">Tus nuevos pedidos aparecerán aquí</p>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#5bc827] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#5bc827]"></span>
                  </span>
                  <span className="text-[#5bc827] text-xs font-semibold">
                    {activeOrders.length} pedido{activeOrders.length !== 1 ? 's' : ''} activo{activeOrders.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {activeOrders.map(activeOrder => {
                  const step = getStepNumber(activeOrder.estado)
                  const itemsSummary = (activeOrder.items || [])
                    .map(i => `${i.cantidad}x ${i.nombreSnapshot}`)
                    .join(' · ')
                  const isCancelable = activeOrder.estado === 'PENDIENTE'

                  return (
                    <div
                      key={activeOrder.id}
                      onClick={() => onOpenTracking && onOpenTracking(activeOrder.id)}
                      className="bg-[#232427] border border-[#5bc827]/40 hover:border-[#5bc827] rounded-2xl overflow-hidden cursor-pointer transition-all hover:scale-[1.005] group shadow-lg"
                    >
                      {/* Order header */}
                      <div className="px-4 pt-4 pb-3 border-b border-[#35373b]">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-white text-base">
                            {activeOrder.restaurant?.nombre || 'Restaurante'}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-[#9a9da3] text-xs font-mono">
                              #{activeOrder.id.slice(0, 8).toUpperCase()}
                            </span>
                            <span className="text-[#5bc827] text-xs font-bold bg-[#5bc827]/10 border border-[#5bc827]/30 px-2 py-0.5 rounded-md group-hover:bg-[#5bc827] group-hover:text-[#1a1b1e] transition-all flex items-center gap-1">
                              Ver seguimiento <span className="text-sm font-extrabold">›</span>
                            </span>
                          </div>
                        </div>
                        <p className="text-[#9a9da3] text-xs truncate">{itemsSummary}</p>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-[#5bc827] font-bold text-sm">${activeOrder.total?.toFixed(0)}</p>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${formatStatusBadge(activeOrder.estado).className}`}>
                            {formatStatusBadge(activeOrder.estado).label}
                          </span>
                        </div>
                      </div>

                      {/* Status tracker */}
                      <div className="px-4 py-4">
                        <div className="relative">
                          <div className="absolute left-4 top-5 bottom-5 w-0.5 bg-[#35373b]" />
                          <div
                            className="absolute left-4 top-5 w-0.5 bg-[#5bc827] transition-all duration-700"
                            style={{ height: `${((step - 1) / (TRACKER_STEPS.length - 1)) * 100}%` }}
                          />
                          <div className="space-y-4">
                            {TRACKER_STEPS.map((s, i) => {
                              const done = i < step
                              const current = i === step - 1
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
                                    <p className={`text-xs font-semibold ${done ? 'text-white' : current ? 'text-[#5bc827]' : 'text-[#9a9da3]'}`}>
                                      {s.label}
                                    </p>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Repartidor info if assigned */}
                      {activeOrder.repartidor && (
                        <div className="mx-4 mb-3 p-3 bg-[#1a1b1e] rounded-xl flex items-center justify-between border border-[#35373b]">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-[#5bc827] rounded-full flex items-center justify-center text-[#1a1b1e] font-bold text-xs">
                              {activeOrder.repartidor.nombre?.[0] || 'R'}
                            </div>
                            <div>
                              <p className="text-white text-xs font-semibold">{activeOrder.repartidor.nombre}</p>
                              <p className="text-[#9a9da3] text-[10px]">
                                ★ {activeOrder.repartidor.driverProfile?.ratingPromedio ?? '5.0'} · Repartidor
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Cancel button if PENDIENTE */}
                      {isCancelable && (
                        <div className="px-4 pb-4 pt-1 flex justify-end">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleCancelOrder(activeOrder.id)
                            }}
                            disabled={cancellingId === activeOrder.id}
                            className="text-xs text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-500/60 bg-red-500/10 px-3 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {cancellingId === activeOrder.id ? 'Cancelando...' : 'Cancelar pedido'}
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {tab === 'historial' && (
          <div className="space-y-3">
            {loadingHistory ? (
              <div className="flex flex-col items-center justify-center py-20 text-[#9a9da3]">
                <div className="w-8 h-8 border-2 border-[#5bc827] border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-xs uppercase tracking-wider">Cargando historial...</p>
              </div>
            ) : historyOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <span className="text-5xl mb-3">📦</span>
                <p className="text-white font-semibold">No tienes pedidos anteriores</p>
                <p className="text-[#9a9da3] text-sm mt-1">Aquí verás tu historial de compras</p>
              </div>
            ) : (
              historyOrders.map(order => {
                const badge = formatStatusBadge(order.estado)
                const itemsSummary = (order.items || [])
                  .map(i => `${i.cantidad}x ${i.nombreSnapshot}`)
                  .join(', ')
                const dateFormatted = new Date(order.createdAt).toLocaleDateString('es-MX', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })
                const currentRating = ratings[order.id] ?? order.ratingRestaurant ?? 0

                return (
                  <div key={order.id} className="bg-[#232427] border border-[#35373b] rounded-2xl overflow-hidden">
                    <div className="flex gap-3 p-3">
                      {order.restaurant?.coverImg ? (
                        <img
                          src={getImageUrl(order.restaurant.coverImg)}
                          alt={order.restaurant.nombre}
                          className="w-14 h-14 rounded-xl object-cover shrink-0"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = 'none'
                          }}
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-[#1a3320] flex items-center justify-center text-xl shrink-0">
                          🍽️
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-sm text-white truncate">
                            {order.restaurant?.nombre || 'Restaurante'}
                          </h3>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.className}`}>
                            {badge.label}
                          </span>
                        </div>
                        <p className="text-[#9a9da3] text-xs mt-0.5 truncate">{itemsSummary || 'Sin detalles'}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[10px] text-[#9a9da3]">{dateFormatted}</span>
                          <span className="text-[#5bc827] text-xs font-bold">${order.total?.toFixed(0)}</span>
                        </div>
                      </div>
                    </div>

                    {order.estado === 'ENTREGADO' && (
                      <div className="border-t border-[#35373b] px-3 py-2 flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map(n => (
                            <button
                              key={n}
                              type="button"
                              onClick={() => {
                                if (!order.ratingRestaurant) {
                                  handleQuickRate(order.id, n)
                                }
                              }}
                              className={`text-base transition-transform hover:scale-125 ${
                                n <= currentRating ? 'text-[#5bc827]' : 'text-[#35373b]'
                              } ${order.ratingRestaurant ? 'cursor-default' : 'cursor-pointer'}`}
                            >
                              ★
                            </button>
                          ))}
                          <span className="text-[#9a9da3] text-[10px] ml-1">
                            {order.ratingRestaurant || ratings[order.id] ? 'Calificado' : 'Calificar'}
                          </span>
                        </div>
                        {!order.ratingRestaurant && !ratings[order.id] && onRateOrder && (
                          <button
                            onClick={() => onRateOrder(order.id)}
                            className="text-[#5bc827] text-xs font-semibold hover:text-[#7ed944] transition-colors cursor-pointer"
                          >
                            Calificar pedido →
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>
    </div>
  )
}

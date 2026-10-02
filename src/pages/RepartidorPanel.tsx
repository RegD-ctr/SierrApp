import { useState, useEffect } from 'react'
import logoImg from '@/imports/logo.jpeg'
import EarningsRepartidor from '@/pages/EarningsRepartidor'
import { api } from '@/lib/api'
import { getSocket } from '@/lib/socket'

type RepView = 'mapa' | 'ordenes' | 'activa' | 'historial' | 'perfil' | 'ganancias'
type OrderStatus = 'nueva' | 'dirigete' | 'esperando' | 'recibido' | 'en_camino' | 'entregado'

interface Order {
  id: string
  displayId?: string
  local: string
  localDir: string
  cliente: string
  clienteDir: string
  clienteTel?: string
  productos: { nombre: string; cantidad: number }[]
  total: string
  hora: string
  notas: string
  status: OrderStatus
  rawStatus?: string
  comision?: number
  updatedAt?: string
}

const statusConfig: Record<OrderStatus, { label: string; icon: string; color: string; bg: string }> = {
  nueva:      { label: 'Nueva orden',         icon: '🔔', color: 'text-yellow-400',  bg: 'bg-yellow-900/30 border-yellow-800/50' },
  dirigete:   { label: 'Dirígete al local',   icon: '🗺️',  color: 'text-blue-400',   bg: 'bg-blue-900/30 border-blue-800/50' },
  esperando:  { label: 'Esperando producto',  icon: '⏳',  color: 'text-orange-400', bg: 'bg-orange-900/30 border-orange-800/50' },
  recibido:   { label: 'Producto recibido',   icon: '📦',  color: 'text-purple-400', bg: 'bg-purple-900/30 border-purple-800/50' },
  en_camino:  { label: 'En camino',           icon: '🛵',  color: 'text-[#5bc827]',  bg: 'bg-[#5bc827]/10 border-[#5bc827]/30' },
  entregado:  { label: 'Entregado',           icon: '✅',  color: 'text-[#5bc827]',  bg: 'bg-[#5bc827]/20 border-[#5bc827]/50' },
}

const stateFlow: OrderStatus[] = ['nueva', 'dirigete', 'esperando', 'recibido', 'en_camino', 'entregado']

interface Props { onLogout: () => void }

function mapBackendOrder(b: any): Order {
  const shortId = `#${b.id.slice(0, 8)}`
  const clienteDir = [b.direccionCalle, b.direccionNumero, b.direccionColonia].filter(Boolean).join(', ')
  const hora = new Date(b.createdAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })

  let status: OrderStatus = 'nueva'
  if (b.estado === 'LISTO') status = 'nueva'
  else if (b.estado === 'REPARTIDOR_ASIGNADO') status = 'dirigete'
  else if (b.estado === 'RECOGIDO') status = 'recibido'
  else if (b.estado === 'EN_CAMINO') status = 'en_camino'
  else if (b.estado === 'ENTREGADO') status = 'entregado'

  return {
    id: b.id,
    displayId: shortId,
    local: b.restaurant?.nombre || 'Restaurante',
    localDir: b.restaurant?.direccion || '—',
    cliente: b.user?.nombre || 'Cliente',
    clienteDir: clienteDir || '—',
    clienteTel: b.user?.telefono || undefined,
    productos: (b.items || []).map((i: any) => ({
      nombre: i.nombreSnapshot || i.nombre || 'Producto',
      cantidad: i.cantidad || 1,
    })),
    total: `$${Number(b.total || 0).toFixed(2)}`,
    hora,
    notas: b.instrucciones || '',
    status,
    rawStatus: b.estado,
    comision: b.comisionRepartidorFija ?? 20,
    updatedAt: b.updatedAt,
  }
}

/**
 * Componente principal del panel del repartidor conectado al backend real.
 * Permite visualizar pedidos disponibles, reclamar uno, gestionar el flujo de entrega
 * y consultar historial de pedidos y ganancias.
 */
export default function RepartidorPanel({ onLogout }: Props) {
  const [view, setView] = useState<RepView>('mapa')
  const [orders, setOrders] = useState<Order[]>([])
  const [activeOrder, setActiveOrder] = useState<Order | null>(null)
  const [showConfirm, setShowConfirm] = useState<'recibido' | 'entregado' | null>(null)
  const [completedOrders, setCompletedOrders] = useState<Order[]>([])
  const [isOnline, setIsOnline] = useState(true)
  const [claimingId, setClaimingId] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [driverProfile, setDriverProfile] = useState<any>(null)
  const [socketConnected, setSocketConnected] = useState(() => getSocket()?.connected ?? false)

  const activeOrderId = activeOrder?.id ?? null

  const fetchActiveDelivery = async () => {
    try {
      const data = await api.get<any>('/api/orders/me/active-delivery')
      if (data) {
        const formatted = mapBackendOrder(data)
        setActiveOrder(formatted)
        return formatted
      } else {
        setActiveOrder(null)
        return null
      }
    } catch (err) {
      console.error('Error cargando entrega activa:', err)
      return null
    }
  }

  const fetchAvailableOrders = async () => {
    try {
      const data = await api.get<any[]>('/api/orders/available')
      if (Array.isArray(data)) {
        setOrders(data.map(mapBackendOrder))
      }
    } catch (err) {
      console.error('Error cargando órdenes disponibles:', err)
    }
  }

  const fetchDeliveries = async () => {
    try {
      const data = await api.get<any[]>('/api/orders/me/deliveries')
      if (Array.isArray(data)) {
        setCompletedOrders(data.map(mapBackendOrder))
      }
    } catch (err) {
      console.error('Error cargando entregas completadas:', err)
    }
  }

  const fetchProfile = async () => {
    try {
      const data = await api.get<any>('/api/auth/me')
      if (data) {
        setDriverProfile(data)
      }
    } catch (err) {
      console.error('Error cargando perfil del repartidor:', err)
    }
  }

  // Carga inicial al montar el componente
  useEffect(() => {
    let isMounted = true
    const init = async () => {
      const active = await fetchActiveDelivery()
      if (isMounted) {
        if (active) {
          // Si ya tiene una entrega activa, posicionar directamente en la vista activa
          setView('activa')
        }
        await fetchAvailableOrders()
        await fetchDeliveries()
        await fetchProfile()
      }
    }
    init()
    return () => {
      isMounted = false
    }
  }, [])

  // Auto-polling periódico cada 8 segundos
  useEffect(() => {
    if (!isOnline) return
    const interval = setInterval(async () => {
      await fetchActiveDelivery()
      if (!activeOrderId) {
        await fetchAvailableOrders()
      }
    }, 8000)

    return () => clearInterval(interval)
  }, [isOnline, activeOrderId])

  // Escuchar estado de conexión de WebSockets
  useEffect(() => {
    const socket = getSocket()
    if (!socket) return

    const onConnect = () => setSocketConnected(true)
    const onDisconnect = () => setSocketConnected(false)

    if (socket.connected) setSocketConnected(true)
    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
    }
  }, [])

  // Escuchar eventos de pedidos en tiempo real
  useEffect(() => {
    const socket = getSocket()
    if (!socket) return

    const handleOrderAvailable = () => {
      if (!activeOrderId) {
        fetchAvailableOrders()
      }
    }

    const handleOrderClaimed = (payload: { orderId: string }) => {
      if (payload?.orderId) {
        setOrders(prev => prev.filter(o => o.id !== payload.orderId))
      }
    }

    socket.on('order:available', handleOrderAvailable)
    socket.on('order:claimed', handleOrderClaimed)

    return () => {
      socket.off('order:available', handleOrderAvailable)
      socket.off('order:claimed', handleOrderClaimed)
    }
  }, [activeOrderId])

  // Reclamar pedido disponible
  const handleClaimOrder = async (orderId: string) => {
    setClaimingId(orderId)
    setErrorMessage(null)
    try {
      const claimed = await api.patch<any>(`/api/orders/${orderId}/claim`)
      const formatted = mapBackendOrder(claimed)
      setActiveOrder(formatted)
      setView('activa')
      await fetchAvailableOrders()
    } catch (err: any) {
      if (err.status === 409) {
        setErrorMessage('Este pedido ya no está disponible (otro repartidor lo tomó primero).')
        await fetchAvailableOrders()
      } else {
        setErrorMessage(err.message || 'Error al tomar el pedido.')
      }
    } finally {
      setClaimingId(null)
    }
  }

  // Acción: Producto recibido
  const handlePickedUp = async () => {
    if (!activeOrder) return
    setActionLoading(true)
    setErrorMessage(null)
    try {
      const updated = await api.patch<any>(`/api/orders/${activeOrder.id}/picked-up`)
      setActiveOrder(mapBackendOrder(updated))
      setShowConfirm(null)
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al confirmar producto recibido.')
    } finally {
      setActionLoading(false)
    }
  }

  // Acción: Iniciar camino hacia el cliente
  const handleStartDelivery = async () => {
    if (!activeOrder) return
    setActionLoading(true)
    setErrorMessage(null)
    try {
      const updated = await api.patch<any>(`/api/orders/${activeOrder.id}/start-delivery`)
      setActiveOrder(mapBackendOrder(updated))
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al iniciar entrega.')
    } finally {
      setActionLoading(false)
    }
  }

  // Acción: Entregado
  const handleDeliver = async () => {
    if (!activeOrder) return
    setActionLoading(true)
    setErrorMessage(null)
    try {
      const updated = await api.patch<any>(`/api/orders/${activeOrder.id}/deliver`)
      const formatted = mapBackendOrder(updated)
      setCompletedOrders(prev => [formatted, ...prev])
      setActiveOrder(null)
      setShowConfirm(null)
      setView('ordenes')
      await fetchAvailableOrders()
      await fetchDeliveries()
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al confirmar entrega.')
    } finally {
      setActionLoading(false)
    }
  }

  const navItems: { icon: string; label: string; view: RepView }[] = [
    { icon: '🗺️', label: 'Mapa', view: 'mapa' },
    { icon: '📋', label: 'Órdenes', view: 'ordenes' },
    { icon: '🛵', label: 'Activa', view: 'activa' },
    { icon: '📜', label: 'Historial', view: 'historial' },
    { icon: '👤', label: 'Perfil', view: 'perfil' },
  ]

  if (view === 'ganancias') {
    return <EarningsRepartidor onBack={() => setView('perfil')} />
  }

  return (
    <div className="min-h-screen bg-[#1a1b1e] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#1a1b1e]/95 backdrop-blur-sm border-b border-[#35373b]">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logoImg} alt="Sierra App" className="w-9 h-9 rounded-lg object-cover" />
            <div>
              <p className="text-[#5bc827] text-xs font-bold tracking-widest uppercase" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Sierra App</p>
              <p className="text-[#9a9da3] text-[10px]">
                Panel de Repartidor {driverProfile?.driverProfile?.matricula ? `· ${driverProfile.driverProfile.matricula}` : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
                socketConnected
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-400'
              }`}
              title={socketConnected ? 'Conectado al servidor en tiempo real' : 'Desconectado del tiempo real'}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${socketConnected ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'}`} />
              {socketConnected ? 'En vivo' : 'Reconectando...'}
            </span>
            <button
              onClick={() => setIsOnline(v => !v)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold transition-all ${
                isOnline ? 'border-[#5bc827]/50 text-[#5bc827] bg-[#5bc827]/10' : 'border-[#35373b] text-[#9a9da3]'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-[#5bc827] animate-pulse' : 'bg-[#9a9da3]'}`} />
              {isOnline ? 'En línea' : 'Desconectado'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto pb-28">

        {/* Notificación de error global */}
        {errorMessage && (
          <div className="mx-4 mt-4 bg-red-900/30 border border-red-800/50 rounded-xl p-3 text-red-300 text-xs flex justify-between items-center">
            <span>⚠️ {errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="text-white hover:text-red-200 text-sm font-bold px-2">✕</button>
          </div>
        )}

        {/* MAPA */}
        {view === 'mapa' && (
          <div>
            {/* Map */}
            <div className="relative h-[55vh] bg-[#0a1a0c] overflow-hidden">
              <div className="absolute inset-0" style={{
                backgroundImage: 'linear-gradient(rgba(42,72,48,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(42,72,48,0.4) 1px, transparent 1px)',
                backgroundSize: '40px 40px',
              }} />
              <div className="absolute left-[30%] top-0 bottom-0 w-[3px] bg-[#1a3320] opacity-60" />
              <div className="absolute left-[60%] top-0 bottom-0 w-[2px] bg-[#1a3320] opacity-40" />
              <div className="absolute top-[35%] left-0 right-0 h-[3px] bg-[#1a3320] opacity-60" />
              <div className="absolute top-[65%] left-0 right-0 h-[2px] bg-[#1a3320] opacity-40" />
              
              {/* Route line & Markers */}
              {(activeOrder || orders.length > 0) && (
                <>
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path d="M 20 75 Q 30 60 30 35 Q 30 20 55 20 Q 70 20 75 30" stroke="#5bc827" strokeWidth="0.8" fill="none" strokeDasharray="3,2" />
                  </svg>
                  <div className="absolute" style={{ left: '28%', top: '33%', transform: 'translate(-50%,-100%)' }}>
                    <div className="flex flex-col items-center">
                      <div className="bg-[#232427] border-2 border-[#5bc827] rounded-xl px-2 py-1 text-[10px] font-bold text-[#5bc827] whitespace-nowrap mb-1">
                        🏪 {(activeOrder || orders[0]).local}
                      </div>
                      <div className="w-2 h-2 rounded-full bg-[#5bc827]" />
                    </div>
                  </div>
                  <div className="absolute" style={{ left: '74%', top: '28%', transform: 'translate(-50%,-100%)' }}>
                    <div className="flex flex-col items-center">
                      <div className="bg-[#232427] border-2 border-[#7ed944] rounded-xl px-2 py-1 text-[10px] font-bold text-[#7ed944] whitespace-nowrap mb-1">
                        🏠 {(activeOrder || orders[0]).cliente}
                      </div>
                      <div className="w-2 h-2 rounded-full bg-[#7ed944]" />
                    </div>
                  </div>
                </>
              )}

              {/* Repartidor dot */}
              <div className="absolute" style={{ left: '20%', top: '73%', transform: 'translate(-50%,-50%)' }}>
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-[#5bc827]/30 animate-ping scale-150" />
                  <div className="relative w-8 h-8 bg-[#5bc827] rounded-full flex items-center justify-center border-2 border-white shadow-lg text-sm z-10">
                    🛵
                  </div>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#1a1b1e] to-transparent" />
            </div>

            {/* Info below map */}
            <div className="px-4 -mt-4 relative z-10">
              {isOnline ? (
                activeOrder ? (
                  <div className="space-y-3">
                    <p className="text-[#5bc827] text-xs font-semibold uppercase tracking-widest mb-2">
                      Entrega Activa
                    </p>
                    <div
                      onClick={() => setView('activa')}
                      className="bg-[#232427] border border-[#5bc827]/50 rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-all hover:scale-[1.01]"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[#5bc827] text-xs font-bold">{activeOrder.displayId || `#${activeOrder.id.slice(0, 8)}`}</span>
                          <StatusBadge status={activeOrder.status} />
                        </div>
                        <p className="text-white text-sm font-semibold mt-0.5">{activeOrder.local}</p>
                        <p className="text-[#9a9da3] text-xs">{activeOrder.hora} · {activeOrder.total}</p>
                      </div>
                      <span className="text-xs font-bold text-[#5bc827] bg-[#5bc827]/10 border border-[#5bc827]/30 px-3 py-1.5 rounded-full">
                        Ver orden ›
                      </span>
                    </div>
                  </div>
                ) : orders.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-[#5bc827] text-xs font-semibold uppercase tracking-widest mb-2">
                      {orders.length} orden{orders.length > 1 ? 'es' : ''} disponible{orders.length > 1 ? 's' : ''}
                    </p>
                    {orders.slice(0, 3).map(o => (
                      <div
                        key={o.id}
                        onClick={() => setView('ordenes')}
                        className="bg-[#232427] border border-[#35373b] hover:border-[#5bc827]/50 rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-all"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[#5bc827] text-xs font-bold">{o.displayId || `#${o.id.slice(0, 8)}`}</span>
                            <StatusBadge status={o.status} />
                          </div>
                          <p className="text-white text-sm font-semibold mt-0.5">{o.local}</p>
                          <p className="text-[#9a9da3] text-xs">{o.hora} · {o.total}</p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleClaimOrder(o.id)
                          }}
                          disabled={claimingId === o.id}
                          className="bg-[#5bc827] text-[#1a1b1e] font-bold text-xs px-3 py-1.5 rounded-xl hover:bg-[#7ed944]"
                        >
                          {claimingId === o.id ? 'Tomando...' : 'Tomar'}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-[#5bc827] animate-pulse" />
                      <span className="text-[#5bc827] text-sm font-semibold">Buscando nuevas órdenes...</span>
                    </div>
                    <p className="text-[#9a9da3] text-xs">Mantente en línea para recibir pedidos</p>
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center py-8 text-center">
                  <span className="text-4xl mb-3">😴</span>
                  <p className="text-white font-semibold">Estás desconectado</p>
                  <p className="text-[#9a9da3] text-sm mt-1">Conéctate para recibir órdenes</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ÓRDENES DISPONIBLES */}
        {view === 'ordenes' && (
          <div className="px-4 pt-5">
            <div className="flex items-center justify-between mb-5">
              <h1 className="text-3xl font-bold text-white uppercase" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                Órdenes Disponibles
              </h1>
              <button
                onClick={() => { fetchAvailableOrders(); fetchActiveDelivery(); }}
                className="text-xs text-[#5bc827] hover:underline bg-[#232427] border border-[#35373b] px-3 py-1.5 rounded-full transition-colors"
              >
                🔄 Actualizar
              </button>
            </div>

            {/* Restricción: Si ya tiene una entrega activa, no puede tomar otras */}
            {activeOrder ? (
              <div className="bg-[#232427] border border-[#5bc827]/40 rounded-2xl p-6 text-center">
                <span className="text-5xl block mb-3">🛵</span>
                <h3 className="text-white font-bold text-xl mb-1 uppercase" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                  Tienes una entrega en curso
                </h3>
                <p className="text-[#9a9da3] text-sm mb-4">
                  Orden activa: <strong className="text-[#5bc827]">{activeOrder.displayId || `#${activeOrder.id.slice(0, 8)}`}</strong> ({activeOrder.local} → {activeOrder.cliente}).
                  <br />Debes completar tu entrega actual antes de poder tomar nuevos pedidos.
                </p>
                <button
                  onClick={() => setView('activa')}
                  className="bg-[#5bc827] text-[#1a1b1e] font-bold px-6 py-3 rounded-xl text-sm hover:bg-[#7ed944] transition-all hover:scale-[1.02]"
                >
                  Ir a entrega activa 🛵
                </button>
              </div>
            ) : orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <span className="text-5xl mb-3">📭</span>
                <p className="text-white font-semibold">No hay órdenes disponibles en este momento</p>
                <p className="text-[#9a9da3] text-sm mt-1">Los pedidos listos para recoger aparecerán aquí en tiempo real.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map(o => (
                  <div
                    key={o.id}
                    className="bg-[#232427] border border-[#35373b] hover:border-[#5bc827]/50 rounded-2xl p-4 transition-all"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className="text-[#5bc827] text-sm font-bold">{o.displayId || `#${o.id.slice(0, 8)}`}</span>
                        <p className="text-white font-semibold text-sm mt-0.5">{o.local}</p>
                        <p className="text-[#9a9da3] text-xs">📍 {o.localDir}</p>
                      </div>
                      <StatusBadge status={o.status} />
                    </div>

                    <div className="bg-[#1a1b1e] rounded-xl p-2.5 my-2 text-xs border border-[#35373b]/50">
                      <p className="text-[#9a9da3] text-[10px] uppercase font-semibold">Entregar a:</p>
                      <p className="text-white font-medium">{o.cliente} {o.clienteTel ? `· 📞 ${o.clienteTel}` : ''}</p>
                      <p className="text-[#9a9da3] text-xs">📍 {o.clienteDir}</p>
                    </div>

                    <div className="border-t border-[#35373b] pt-2 mt-2 flex items-center justify-between">
                      <div>
                        <p className="text-[#9a9da3] text-xs">{o.productos.map(p => `${p.nombre} x${p.cantidad}`).join(', ')}</p>
                        <p className="text-[10px] text-[#9a9da3] mt-0.5">⏱ {o.hora}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[#5bc827] font-bold text-base">{o.total}</p>
                        <p className="text-[10px] text-[#5bc827] font-medium">+${o.comision?.toFixed(2) || '20.00'} comisión</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleClaimOrder(o.id)}
                      disabled={claimingId === o.id}
                      className="mt-3 w-full py-2.5 rounded-xl bg-[#5bc827] hover:bg-[#7ed944] text-[#1a1b1e] font-bold text-sm transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {claimingId === o.id ? 'Tomando pedido...' : 'Tomar pedido 🛵'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ORDEN ACTIVA */}
        {view === 'activa' && (
          <div className="px-4 pt-5">
            {!activeOrder ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <span className="text-5xl mb-3">🛵</span>
                <p className="text-white font-semibold">Sin orden activa</p>
                <p className="text-[#9a9da3] text-sm mt-1 mb-4">Selecciona una orden de "Órdenes" disponibles</p>
                <button onClick={() => setView('ordenes')} className="bg-[#5bc827] text-[#1a1b1e] font-bold px-5 py-2 rounded-full text-sm hover:bg-[#7ed944] transition-colors">
                  Ver órdenes disponibles
                </button>
              </div>
            ) : (
              <OrderDetail
                order={activeOrder}
                isLoading={actionLoading}
                onAdvanceToRecibido={() => setShowConfirm('recibido')}
                onAdvanceToEnCamino={handleStartDelivery}
                onAdvanceToEntregado={() => setShowConfirm('entregado')}
              />
            )}
          </div>
        )}

        {/* HISTORIAL */}
        {view === 'historial' && (
          <div className="px-4 pt-5">
            <h1 className="text-3xl font-bold text-white uppercase mb-2" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Historial</h1>
            <div className="flex items-center justify-between mb-5">
              <p className="text-[#9a9da3] text-sm">{completedOrders.length} entregas realizadas</p>
              <div className="bg-[#232427] border border-[#35373b] rounded-xl px-3 py-1.5 text-xs text-[#5bc827] font-bold">
                Hoy: ${completedOrders
                  .filter(o => {
                    if (!o.updatedAt) return false
                    const d = new Date(o.updatedAt)
                    const n = new Date()
                    return d.getDate() === n.getDate() && d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear()
                  })
                  .reduce((acc, o) => acc + (o.comision || 20), 0)
                  .toFixed(2)}
              </div>
            </div>
            {completedOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <span className="text-5xl mb-3">📜</span>
                <p className="text-white font-semibold">Sin entregas aún</p>
                <p className="text-[#9a9da3] text-xs mt-1">Tus pedidos entregados se listarán aquí</p>
              </div>
            ) : (
              <div className="space-y-3">
                {completedOrders.map((o, i) => (
                  <div key={`${o.id}-${i}`} className="bg-[#232427] border border-[#35373b] rounded-2xl p-4">
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <span className="text-[#5bc827] text-xs font-bold">{o.displayId || `#${o.id.slice(0, 8)}`}</span>
                        <p className="text-white text-sm font-semibold">{o.local}</p>
                      </div>
                      <StatusBadge status="entregado" />
                    </div>
                    <p className="text-[#9a9da3] text-xs">{o.productos.map(p => `${p.nombre} x${p.cantidad}`).join(', ')}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] text-[#9a9da3]">{o.hora}</span>
                      <span className="text-[#5bc827] font-bold text-sm">+{o.comision ? `$${o.comision.toFixed(2)}` : '$20.00'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PERFIL */}
        {view === 'perfil' && (
          <div className="px-4 pt-5">
            <h1 className="text-3xl font-bold text-white uppercase mb-5" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Mi Perfil</h1>
            
            <div className="bg-[#232427] border border-[#35373b] rounded-2xl p-5 flex items-center gap-4 mb-5">
              <div className="w-16 h-16 bg-[#5bc827]/20 border-2 border-[#5bc827] rounded-full flex items-center justify-center text-2xl font-bold text-[#5bc827]">
                {driverProfile?.driverProfile?.fotoUrl ? (
                  <img src={driverProfile.driverProfile.fotoUrl} alt="Perfil" className="w-full h-full rounded-full object-cover" />
                ) : (
                  '👤'
                )}
              </div>
              <div>
                <h2 className="text-white font-bold text-lg">{driverProfile?.nombre || 'Repartidor Sierra'}</h2>
                <p className="text-[#9a9da3] text-xs">{driverProfile?.email || '—'}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-[10px] text-[#5bc827] font-bold">
                    🛵 {driverProfile?.driverProfile?.matricula || 'REP-ACTIVO'}
                  </span>
                  <span className="text-[10px] text-yellow-400 font-semibold">
                    ★ {driverProfile?.driverProfile?.ratingPromedio ? driverProfile.driverProfile.ratingPromedio.toFixed(1) : '5.0'}
                  </span>
                  <span className="text-[10px] text-[#9a9da3]">{completedOrders.length} entregas</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 bg-[#232427] border border-[#35373b] rounded-2xl overflow-hidden mb-5">
              {[
                { v: `${completedOrders.length}`, l: 'Entregas' },
                { v: `$${completedOrders.reduce((sum, o) => sum + (o.comision || 20), 0).toFixed(2)}`, l: 'Ganancias' },
                { v: driverProfile?.driverProfile?.ratingPromedio ? `${driverProfile.driverProfile.ratingPromedio.toFixed(1)}` : '5.0', l: 'Rating' }
              ].map((s, i) => (
                <div key={s.l} className={`py-4 text-center ${i < 2 ? 'border-r border-[#35373b]' : ''}`}>
                  <p className="text-[#5bc827] font-bold text-xl" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>{s.v}</p>
                  <p className="text-[#9a9da3] text-[10px]">{s.l}</p>
                </div>
              ))}
            </div>

            {[
              { icon: '🏍️', label: 'Mi vehículo', sub: driverProfile?.driverProfile?.vehiculo || 'Motocicleta' },
              { icon: '💳', label: 'Datos de pago', sub: 'Cuenta registrada' },
              { icon: '💰', label: 'Mis ganancias', sub: 'Historial y retiros' },
              { icon: '🔔', label: 'Notificaciones', sub: 'Activadas' },
              { icon: '❓', label: 'Ayuda', sub: null },
            ].map(item => (
              <button
                key={item.label}
                onClick={() => item.label === 'Mis ganancias' && setView('ganancias')}
                className="w-full flex items-center gap-3 px-3 py-3.5 rounded-xl hover:bg-[#232427] transition-colors text-left"
              >
                <span className="text-xl w-7 text-center">{item.icon}</span>
                <div className="flex-1">
                  <p className="text-sm text-white font-medium">{item.label}</p>
                  {item.sub && <p className="text-[10px] text-[#9a9da3]">{item.sub}</p>}
                </div>
                <svg className="w-4 h-4 text-[#35373b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}

            <div className="mt-6">
              <button onClick={onLogout} className="w-full py-3 rounded-xl border border-red-800/50 text-red-400 text-sm font-semibold hover:bg-red-900/20 transition-colors">
                Cerrar sesión
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#1a1b1e]/95 backdrop-blur-sm border-t border-[#35373b] flex justify-around py-2 z-50">
        {navItems.map(item => (
          <button
            key={item.view}
            onClick={() => setView(item.view)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 transition-colors relative ${view === item.view ? 'text-[#5bc827]' : 'text-[#9a9da3]'}`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-[9px] font-medium">{item.label}</span>
            {view === item.view && <span className="w-1 h-1 rounded-full bg-[#5bc827] mt-0.5" />}
            {item.view === 'ordenes' && orders.length > 0 && !activeOrder && (
              <span className="absolute top-0 right-2 bg-[#5bc827] text-[#1a1b1e] text-[8px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">
                {orders.length}
              </span>
            )}
            {item.view === 'activa' && activeOrder && (
              <span className="absolute top-0 right-2 bg-[#5bc827] animate-pulse rounded-full w-2 h-2" />
            )}
          </button>
        ))}
      </nav>

      {/* Confirm: Producto recibido */}
      {showConfirm === 'recibido' && activeOrder && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-[#1a1b1e] border border-[#35373b] rounded-2xl w-full max-w-sm p-6 text-center">
            <span className="text-5xl block mb-3">📦</span>
            <h3 className="text-white font-bold text-xl mb-1 uppercase" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
              ¿Confirmás que recibiste el pedido?
            </h3>
            <p className="text-[#9a9da3] text-sm mb-5">
              Al confirmar, tu estado cambiará a <strong className="text-[#5bc827]">Producto recibido</strong> para luego iniciar tu camino hacia el cliente.
            </p>
            <div className="flex gap-3">
              <button
                disabled={actionLoading}
                onClick={() => setShowConfirm(null)}
                className="flex-1 py-3 rounded-xl border border-[#35373b] text-[#9a9da3] text-sm font-semibold hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                disabled={actionLoading}
                onClick={handlePickedUp}
                className="flex-1 py-3 rounded-xl bg-[#5bc827] text-[#1a1b1e] font-bold text-sm hover:bg-[#7ed944] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              >
                {actionLoading ? 'Guardando...' : 'Confirmar ✅'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm: Entrega */}
      {showConfirm === 'entregado' && activeOrder && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-[#1a1b1e] border border-[#35373b] rounded-2xl w-full max-w-sm p-6 text-center">
            <span className="text-5xl block mb-3">🏠</span>
            <h3 className="text-white font-bold text-xl mb-1 uppercase" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
              ¿Confirmar entrega?
            </h3>
            <p className="text-[#9a9da3] text-sm mb-2">
              Pedido: <strong className="text-white">{activeOrder.displayId || activeOrder.id}</strong>
            </p>
            <p className="text-[#9a9da3] text-sm mb-5">
              Cliente: <strong className="text-white">{activeOrder.cliente}</strong><br />
              <span className="text-xs">{activeOrder.clienteDir}</span>
            </p>
            <div className="flex gap-3">
              <button
                disabled={actionLoading}
                onClick={() => setShowConfirm(null)}
                className="flex-1 py-3 rounded-xl border border-[#35373b] text-[#9a9da3] text-sm font-semibold hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                disabled={actionLoading}
                onClick={handleDeliver}
                className="flex-1 py-3 rounded-xl bg-[#5bc827] text-[#1a1b1e] font-bold text-sm hover:bg-[#7ed944] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              >
                {actionLoading ? 'Entregando...' : 'Entregado ✅'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Componente que muestra una pequeña insignia con el estado actual de una orden.
 */
function StatusBadge({ status }: { status: OrderStatus }) {
  const cfg = statusConfig[status] || statusConfig.nueva
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color}`}>
      {cfg.icon} {cfg.label}
    </span>
  )
}

/**
 * Componente para mostrar los detalles de la orden que está activa para el repartidor.
 * Incluye un mapa e información del cliente y del restaurante, así como el botón
 * correspondiente al estado actual del pedido.
 */
function OrderDetail({
  order,
  isLoading,
  onAdvanceToRecibido,
  onAdvanceToEnCamino,
  onAdvanceToEntregado
}: {
  order: Order
  isLoading: boolean
  onAdvanceToRecibido: () => void
  onAdvanceToEnCamino: () => void
  onAdvanceToEntregado: () => void
}) {
  const isEnCamino = order.rawStatus === 'EN_CAMINO' || order.status === 'en_camino'
  const isRecibido = order.rawStatus === 'RECOGIDO' || order.status === 'recibido'
  const isAsignado = order.rawStatus === 'REPARTIDOR_ASIGNADO' || order.status === 'dirigete'

  // Flujo visual de progreso
  const flowSteps: { key: OrderStatus; label: string; icon: string }[] = [
    { key: 'dirigete', label: 'Local', icon: '🗺️' },
    { key: 'recibido', label: 'Recibido', icon: '📦' },
    { key: 'en_camino', label: 'En camino', icon: '🛵' },
    { key: 'entregado', label: 'Entregado', icon: '✅' },
  ]

  const currentStepIdx = isAsignado ? 0 : isRecibido ? 1 : isEnCamino ? 2 : 3

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-white uppercase" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
            Orden activa
          </h1>
          <p className="text-[#5bc827] text-sm font-bold">{order.displayId || `#${order.id.slice(0, 8)}`}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Flow progress */}
      <div className="flex items-center gap-1 mb-5 overflow-x-auto pb-1">
        {flowSteps.map((step, i) => {
          const isDone = i < currentStepIdx
          const isCurrent = i === currentStepIdx
          return (
            <div key={step.key} className="flex items-center gap-1">
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold transition-all whitespace-nowrap ${
                isDone ? 'bg-[#5bc827]/20 border-[#5bc827] text-[#5bc827]' :
                isCurrent ? 'bg-[#5bc827] text-[#1a1b1e] border-[#5bc827]' :
                'border-[#35373b] text-[#9a9da3]'
              }`}>
                <span>{step.icon}</span>
                <span>{step.label}</span>
              </div>
              {i < flowSteps.length - 1 && (
                <div className={`w-3 h-0.5 ${isDone ? 'bg-[#5bc827]' : 'bg-[#35373b]'}`} />
              )}
            </div>
          )
        })}
      </div>

      {/* Map mini */}
      <div className="relative h-44 rounded-2xl overflow-hidden bg-[#0a1a0c] mb-4 border border-[#35373b]">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(42,72,48,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(42,72,48,0.3) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }} />
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d={isEnCamino ? "M 30 75 Q 50 60 65 35 Q 70 25 80 20" : "M 20 75 Q 28 55 28 30 Q 28 18 50 18 Q 65 18 70 28"}
            stroke="#5bc827" strokeWidth="1" fill="none" strokeDasharray="4,2" />
        </svg>
        {!isEnCamino ? (
          <div className="absolute" style={{ left: '48%', top: '16%', transform: 'translate(-50%,-100%)' }}>
            <div className="flex flex-col items-center">
              <div className="bg-[#232427] border border-[#5bc827] rounded-lg px-2 py-0.5 text-[9px] font-bold text-[#5bc827] whitespace-nowrap mb-1">🏪 {order.local}</div>
              <div className="w-1.5 h-1.5 rounded-full bg-[#5bc827]" />
            </div>
          </div>
        ) : (
          <div className="absolute" style={{ left: '79%', top: '18%', transform: 'translate(-50%,-100%)' }}>
            <div className="flex flex-col items-center">
              <div className="bg-[#232427] border border-[#7ed944] rounded-lg px-2 py-0.5 text-[9px] font-bold text-[#7ed944] whitespace-nowrap mb-1">🏠 {order.cliente}</div>
              <div className="w-1.5 h-1.5 rounded-full bg-[#7ed944]" />
            </div>
          </div>
        )}
        <div className="absolute" style={{ left: '20%', top: '73%', transform: 'translate(-50%,-50%)' }}>
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-[#5bc827]/30 animate-ping" />
            <div className="relative w-6 h-6 bg-[#5bc827] rounded-full flex items-center justify-center border border-white text-xs z-10">🛵</div>
          </div>
        </div>
      </div>

      {/* Info card */}
      <div className="bg-[#232427] border border-[#35373b] rounded-2xl p-4 mb-4">
        {!isEnCamino ? (
          <>
            <p className="text-[#9a9da3] text-[10px] uppercase tracking-widest font-semibold mb-1">Recoge en restaurante</p>
            <h3 className="text-white font-bold text-base">{order.local}</h3>
            <p className="text-[#9a9da3] text-xs mt-0.5 mb-3">📍 {order.localDir}</p>
          </>
        ) : (
          <>
            <p className="text-[#9a9da3] text-[10px] uppercase tracking-widest font-semibold mb-1">Entregar al cliente</p>
            <h3 className="text-white font-bold text-base">{order.cliente} {order.clienteTel ? `(📞 ${order.clienteTel})` : ''}</h3>
            <p className="text-[#9a9da3] text-xs mt-0.5 mb-3">📍 {order.clienteDir}</p>
          </>
        )}
        <div className="border-t border-[#35373b] pt-3">
          <p className="text-[#c4c6ca] text-xs font-semibold mb-1">Productos:</p>
          {order.productos.map(p => (
            <div key={p.nombre} className="flex items-center justify-between text-xs py-0.5">
              <span className="text-white">{p.nombre}</span>
              <span className="text-[#9a9da3]">x{p.cantidad}</span>
            </div>
          ))}
          {order.notas && (
            <div className="mt-2 bg-yellow-900/20 border border-yellow-800/40 rounded-lg px-3 py-2">
              <p className="text-yellow-400 text-[10px] font-bold">⚠️ Instrucciones del cliente:</p>
              <p className="text-yellow-200 text-xs">{order.notas}</p>
            </div>
          )}
        </div>
      </div>

      {/* CTA Buttons según el estado */}
      {isAsignado ? (
        <button
          disabled={isLoading}
          onClick={onAdvanceToRecibido}
          className="w-full py-4 rounded-2xl bg-[#5bc827] hover:bg-[#7ed944] text-[#1a1b1e] font-bold text-base transition-all hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-[#5bc827]/20 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isLoading ? 'Confirmando...' : '📦 Confirmar producto recibido'}
        </button>
      ) : isRecibido ? (
        <button
          disabled={isLoading}
          onClick={onAdvanceToEnCamino}
          className="w-full py-4 rounded-2xl bg-[#5bc827] hover:bg-[#7ed944] text-[#1a1b1e] font-bold text-base transition-all hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-[#5bc827]/20 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isLoading ? 'Iniciando camino...' : '🛵 Iniciar camino hacia el cliente'}
        </button>
      ) : isEnCamino ? (
        <button
          disabled={isLoading}
          onClick={onAdvanceToEntregado}
          className="w-full py-4 rounded-2xl bg-[#5bc827] hover:bg-[#7ed944] text-[#1a1b1e] font-bold text-base transition-all hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-[#5bc827]/20 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isLoading ? 'Confirmando...' : '🏠 Confirmar entrega'}
        </button>
      ) : null}
    </div>
  )
}

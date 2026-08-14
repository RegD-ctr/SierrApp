import { useState } from 'react'
import logoImg from '@/imports/logo.jpeg'
import EarningsRepartidor from '@/pages/EarningsRepartidor'

type RepView = 'mapa' | 'ordenes' | 'activa' | 'historial' | 'perfil' | 'ganancias'
type OrderStatus = 'nueva' | 'dirigete' | 'esperando' | 'recibido' | 'en_camino' | 'entregado'

interface Order {
  id: string
  local: string
  localDir: string
  cliente: string
  clienteDir: string
  productos: { nombre: string; cantidad: number }[]
  total: string
  hora: string
  notas: string
  status: OrderStatus
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

const sampleOrders: Order[] = [
  {
    id: '#SRR-4821',
    local: 'Sierra Burger Co.',
    localDir: 'Av. Sierra #45, Col. Centro',
    cliente: 'Juan Sierra',
    clienteDir: 'Calle Pino #24, Sierra Norte',
    productos: [{ nombre: 'Burger Clásica', cantidad: 2 }, { nombre: 'Papas Fritas', cantidad: 2 }],
    total: '$350',
    hora: '8:42 pm',
    notas: 'Sin cebolla en las burgers. Dejar en puerta.',
    status: 'dirigete',
  },
  {
    id: '#SRR-4820',
    local: 'Pizzería Napoli',
    localDir: 'Calle Olivo #12, Col. Roma',
    cliente: 'María López',
    clienteDir: 'Blvd. Montaña #88, Fracc. Las Cumbres',
    productos: [{ nombre: 'Pizza Margherita', cantidad: 1 }, { nombre: 'Refresco 600ml', cantidad: 2 }],
    total: '$270',
    hora: '8:38 pm',
    notas: '',
    status: 'nueva',
  },
]

const historial: Order[] = [
  {
    id: '#SRR-4815', local: 'El Rincón del Sabor', localDir: 'Mercado Sierra', cliente: 'Carlos R.',
    clienteDir: 'Av. Pinos #9', productos: [{ nombre: 'Orden tacos', cantidad: 3 }], total: '$120',
    hora: 'Hoy 2:15 pm', notas: '', status: 'entregado',
  },
  {
    id: '#SRR-4808', local: 'Sakura Sushi', localDir: 'Zona Rosa', cliente: 'Ana G.',
    clienteDir: 'Calle Ciprés #33', productos: [{ nombre: 'Roll Spicy', cantidad: 2 }], total: '$280',
    hora: 'Ayer 9:00 pm', notas: '', status: 'entregado',
  },
]

interface Props { onLogout: () => void }

export default function RepartidorPanel({ onLogout }: Props) {
  const [view, setView] = useState<RepView>('mapa')
  const [orders, setOrders] = useState<Order[]>(sampleOrders)
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState<'recibido' | 'entregado' | null>(null)
  const [completedOrders, setCompletedOrders] = useState<Order[]>(historial)
  const [isOnline, setIsOnline] = useState(true)

  const activeOrder = activeOrderId ? orders.find(o => o.id === activeOrderId) ?? null : null

  const advanceStatus = (orderId: string) => {
    setOrders(os => os.map(o => {
      if (o.id !== orderId) return o
      const idx = stateFlow.indexOf(o.status)
      return { ...o, status: idx < stateFlow.length - 1 ? stateFlow[idx + 1] : o.status }
    }))
    setShowConfirm(null)
  }

  const confirmDelivery = (orderId: string) => {
    const finished = orders.find(o => o.id === orderId)
    if (finished) setCompletedOrders(c => [{ ...finished, status: 'entregado' }, ...c])
    setOrders(os => os.filter(o => o.id !== orderId))
    setActiveOrderId(null)
    setShowConfirm(null)
    setView('ordenes')
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
              <p className="text-[#9a9da3] text-[10px]">Panel de Repartidor</p>
            </div>
          </div>
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
      </header>

      <main className="max-w-5xl mx-auto pb-28">

        {/* MAPA */}
        {view === 'mapa' && (
          <div>
            {/* Map */}
            <div className="relative h-[55vh] bg-[#0a1a0c] overflow-hidden">
              {/* Grid lines simulating map */}
              <div className="absolute inset-0" style={{
                backgroundImage: 'linear-gradient(rgba(42,72,48,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(42,72,48,0.4) 1px, transparent 1px)',
                backgroundSize: '40px 40px',
              }} />
              {/* Road lines */}
              <div className="absolute left-[30%] top-0 bottom-0 w-[3px] bg-[#1a3320] opacity-60" />
              <div className="absolute left-[60%] top-0 bottom-0 w-[2px] bg-[#1a3320] opacity-40" />
              <div className="absolute top-[35%] left-0 right-0 h-[3px] bg-[#1a3320] opacity-60" />
              <div className="absolute top-[65%] left-0 right-0 h-[2px] bg-[#1a3320] opacity-40" />
              {/* Route line */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="M 20 75 Q 30 60 30 35 Q 30 20 55 20 Q 70 20 75 30" stroke="#5bc827" strokeWidth="0.8" fill="none" strokeDasharray="3,2" />
              </svg>
              {/* Markers */}
              <div className="absolute" style={{ left: '28%', top: '33%', transform: 'translate(-50%,-100%)' }}>
                <div className="flex flex-col items-center">
                  <div className="bg-[#232427] border-2 border-[#5bc827] rounded-xl px-2 py-1 text-[10px] font-bold text-[#5bc827] whitespace-nowrap mb-1">
                    🏪 Sierra Burger
                  </div>
                  <div className="w-2 h-2 rounded-full bg-[#5bc827]" />
                </div>
              </div>
              <div className="absolute" style={{ left: '74%', top: '28%', transform: 'translate(-50%,-100%)' }}>
                <div className="flex flex-col items-center">
                  <div className="bg-[#232427] border-2 border-[#7ed944] rounded-xl px-2 py-1 text-[10px] font-bold text-[#7ed944] whitespace-nowrap mb-1">
                    🏠 Juan Sierra
                  </div>
                  <div className="w-2 h-2 rounded-full bg-[#7ed944]" />
                </div>
              </div>
              {/* Repartidor dot */}
              <div className="absolute" style={{ left: '20%', top: '73%', transform: 'translate(-50%,-50%)' }}>
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-[#5bc827]/30 animate-ping scale-150" />
                  <div className="relative w-8 h-8 bg-[#5bc827] rounded-full flex items-center justify-center border-2 border-white shadow-lg text-sm z-10">
                    🛵
                  </div>
                </div>
              </div>
              {/* Map overlay bottom */}
              <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#1a1b1e] to-transparent" />
            </div>

            {/* Info below map */}
            <div className="px-4 -mt-4 relative z-10">
              {isOnline ? (
                orders.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-[#5bc827] text-xs font-semibold uppercase tracking-widest mb-2">
                      {orders.length} orden{orders.length > 1 ? 'es' : ''} asignada{orders.length > 1 ? 's' : ''}
                    </p>
                    {orders.map(o => (
                      <div
                        key={o.id}
                        onClick={() => { setActiveOrderId(o.id); setView('activa') }}
                        className="bg-[#232427] border border-[#35373b] hover:border-[#5bc827]/50 rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-all"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[#5bc827] text-xs font-bold">{o.id}</span>
                            <StatusBadge status={o.status} />
                          </div>
                          <p className="text-white text-sm font-semibold mt-0.5">{o.local}</p>
                          <p className="text-[#9a9da3] text-xs">{o.hora} · {o.total}</p>
                        </div>
                        <svg className="w-5 h-5 text-[#5bc827]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
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

        {/* MIS ÓRDENES */}
        {view === 'ordenes' && (
          <div className="px-4 pt-5">
            <h1 className="text-3xl font-bold text-white uppercase mb-5" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Mis Órdenes</h1>
            {orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <span className="text-5xl mb-3">📭</span>
                <p className="text-white font-semibold">No tienes órdenes asignadas</p>
                <p className="text-[#9a9da3] text-sm mt-1">Mantente en línea para recibir pedidos</p>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map(o => (
                  <div
                    key={o.id}
                    onClick={() => { setActiveOrderId(o.id); setView('activa') }}
                    className="bg-[#232427] border border-[#35373b] hover:border-[#5bc827]/50 rounded-2xl p-4 cursor-pointer transition-all"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className="text-[#5bc827] text-sm font-bold">{o.id}</span>
                        <p className="text-white font-semibold text-sm mt-0.5">{o.local}</p>
                        <p className="text-[#9a9da3] text-xs">📍 {o.localDir}</p>
                      </div>
                      <StatusBadge status={o.status} />
                    </div>
                    <div className="border-t border-[#35373b] pt-2 mt-2 flex items-center justify-between">
                      <div>
                        <p className="text-[#9a9da3] text-xs">{o.productos.map(p => `${p.nombre} x${p.cantidad}`).join(', ')}</p>
                        <p className="text-[10px] text-[#9a9da3] mt-0.5">⏱ {o.hora}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[#5bc827] font-bold text-sm">{o.total}</p>
                        <p className="text-[10px] text-[#9a9da3]">{o.productos.reduce((a, p) => a + p.cantidad, 0)} productos</p>
                      </div>
                    </div>
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
                <p className="text-[#9a9da3] text-sm mt-1 mb-4">Selecciona una orden de "Mis Órdenes"</p>
                <button onClick={() => setView('ordenes')} className="bg-[#5bc827] text-[#1a1b1e] font-bold px-5 py-2 rounded-full text-sm hover:bg-[#7ed944] transition-colors">
                  Ver órdenes
                </button>
              </div>
            ) : (
              <OrderDetail
                order={activeOrder}
                onAdvanceToRecibido={() => setShowConfirm('recibido')}
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
                Hoy: ${completedOrders.filter(o => o.hora.includes("Hoy")).reduce(()=> 0, 0) || 120}
              </div>
            </div>
            {completedOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <span className="text-5xl mb-3">📜</span>
                <p className="text-white font-semibold">Sin entregas aún</p>
              </div>
            ) : (
              <div className="space-y-3">
                {completedOrders.map((o, i) => (
                  <div key={`${o.id}-${i}`} className="bg-[#232427] border border-[#35373b] rounded-2xl p-4">
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <span className="text-[#5bc827] text-xs font-bold">{o.id}</span>
                        <p className="text-white text-sm font-semibold">{o.local}</p>
                      </div>
                      <StatusBadge status="entregado" />
                    </div>
                    <p className="text-[#9a9da3] text-xs">{o.productos.map(p => `${p.nombre} x${p.cantidad}`).join(', ')}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] text-[#9a9da3]">{o.hora}</span>
                      <span className="text-[#5bc827] font-bold text-sm">{o.total}</span>
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
              <div className="w-16 h-16 bg-[#5bc827]/20 border-2 border-[#5bc827] rounded-full flex items-center justify-center text-2xl font-bold text-[#5bc827]">CM</div>
              <div>
                <h2 className="text-white font-bold text-lg">Carlos Méndez</h2>
                <p className="text-[#9a9da3] text-xs">carlos.mendez@sierraapp.mx</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-[10px] text-[#5bc827] font-bold">🛵 Repartidor</span>
                  <span className="text-[10px] text-[#9a9da3]">★ 4.9</span>
                  <span className="text-[10px] text-[#9a9da3]">142 entregas</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 bg-[#232427] border border-[#35373b] rounded-2xl overflow-hidden mb-5">
              {[{ v: '142', l: 'Entregas' }, { v: '$8,240', l: 'Ganancias' }, { v: '4.9★', l: 'Rating' }].map((s, i) => (
                <div key={s.l} className={`py-4 text-center ${i < 2 ? 'border-r border-[#35373b]' : ''}`}>
                  <p className="text-[#5bc827] font-bold text-xl" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>{s.v}</p>
                  <p className="text-[#9a9da3] text-[10px]">{s.l}</p>
                </div>
              ))}
            </div>
            {[
              { icon: '🏍️', label: 'Mi vehículo', sub: 'Honda CB125 · ABC-1234' },
              { icon: '💳', label: 'Datos de pago', sub: 'Cuenta CLABE registrada' },
              { icon: '💰', label: 'Mis ganancias', sub: 'Historial y retiros' },
              { icon: '🔔', label: 'Notificaciones', sub: 'Activadas' },
              { icon: '❓', label: 'Ayuda', sub: null },
            ].map(item => (
              <button key={item.label} onClick={() => item.label === 'Mis ganancias' && setView('ganancias')} className="w-full flex items-center gap-3 px-3 py-3.5 rounded-xl hover:bg-[#232427] transition-colors text-left">
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
            {item.view === 'ordenes' && orders.length > 0 && (
              <span className="absolute top-0 right-2 bg-[#5bc827] text-[#1a1b1e] text-[8px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">
                {orders.length}
              </span>
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
              Al confirmar, tu estado cambiará a <strong className="text-[#5bc827]">En camino</strong> y la ruta se actualizará hacia el cliente.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(null)} className="flex-1 py-3 rounded-xl border border-[#35373b] text-[#9a9da3] text-sm font-semibold hover:text-white transition-colors">
                Cancelar
              </button>
              <button
                onClick={() => { advanceStatus(activeOrder.id); advanceStatus(activeOrder.id) }}
                className="flex-1 py-3 rounded-xl bg-[#5bc827] text-[#1a1b1e] font-bold text-sm hover:bg-[#7ed944] transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Confirmar ✅
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
              Pedido: <strong className="text-white">{activeOrder.id}</strong>
            </p>
            <p className="text-[#9a9da3] text-sm mb-5">
              Cliente: <strong className="text-white">{activeOrder.cliente}</strong><br />
              <span className="text-xs">{activeOrder.clienteDir}</span>
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(null)} className="flex-1 py-3 rounded-xl border border-[#35373b] text-[#9a9da3] text-sm font-semibold hover:text-white transition-colors">
                Cancelar
              </button>
              <button
                onClick={() => confirmDelivery(activeOrder.id)}
                className="flex-1 py-3 rounded-xl bg-[#5bc827] text-[#1a1b1e] font-bold text-sm hover:bg-[#7ed944] transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Entregado ✅
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const cfg = statusConfig[status]
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color}`}>
      {cfg.icon} {cfg.label}
    </span>
  )
}

function OrderDetail({ order, onAdvanceToRecibido, onAdvanceToEntregado }: {
  order: Order
  onAdvanceToRecibido: () => void
  onAdvanceToEntregado: () => void
}) {
  const isEnCamino = order.status === 'en_camino'
  const stateIdx = stateFlow.indexOf(order.status)

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-white uppercase" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
            Orden activa
          </h1>
          <p className="text-[#5bc827] text-sm font-bold">{order.id}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Flow progress */}
      <div className="flex items-center gap-1 mb-5 overflow-x-auto pb-1">
        {stateFlow.slice(0, -1).map((s, i) => {
          const done = i < stateIdx
          const cur = i === stateIdx
          const cfg = statusConfig[s]
          return (
            <div key={s} className="flex items-center gap-1">
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full border text-[9px] font-bold transition-all whitespace-nowrap ${
                done ? 'bg-[#5bc827]/20 border-[#5bc827] text-[#5bc827]' :
                cur ? `${cfg.bg} ${cfg.color}` :
                'border-[#35373b] text-[#35373b]'
              }`}>
                <span>{cfg.icon}</span>
              </div>
              {i < stateFlow.length - 2 && (
                <div className={`w-4 h-0.5 ${done ? 'bg-[#5bc827]' : 'bg-[#35373b]'}`} />
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
            <p className="text-[#9a9da3] text-[10px] uppercase tracking-widest font-semibold mb-1">Recoge en</p>
            <h3 className="text-white font-bold text-base">{order.local}</h3>
            <p className="text-[#9a9da3] text-xs mt-0.5 mb-3">📍 {order.localDir}</p>
          </>
        ) : (
          <>
            <p className="text-[#9a9da3] text-[10px] uppercase tracking-widest font-semibold mb-1">Entregar a</p>
            <h3 className="text-white font-bold text-base">{order.cliente}</h3>
            <p className="text-[#9a9da3] text-xs mt-0.5 mb-3">📍 {order.clienteDir}</p>
          </>
        )}
        <div className="border-t border-[#35373b] pt-3">
          <p className="text-[#c4c6ca] text-xs font-semibold mb-1">Productos:</p>
          {order.productos.map(p => (
            <div key={p.nombre} className="flex items-center justify-between text-xs">
              <span className="text-white">{p.nombre}</span>
              <span className="text-[#9a9da3]">x{p.cantidad}</span>
            </div>
          ))}
          {order.notas && (
            <div className="mt-2 bg-yellow-900/20 border border-yellow-800/40 rounded-lg px-3 py-2">
              <p className="text-yellow-400 text-[10px] font-bold">⚠️ Nota:</p>
              <p className="text-yellow-200 text-xs">{order.notas}</p>
            </div>
          )}
        </div>
      </div>

      {/* CTA */}
      {!isEnCamino && order.status !== 'entregado' ? (
        <button
          onClick={onAdvanceToRecibido}
          className="w-full py-4 rounded-2xl bg-[#5bc827] hover:bg-[#7ed944] text-[#1a1b1e] font-bold text-base transition-all hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-[#5bc827]/20"
        >
          📦 Confirmar producto recibido
        </button>
      ) : order.status === 'en_camino' ? (
        <button
          onClick={onAdvanceToEntregado}
          className="w-full py-4 rounded-2xl bg-[#5bc827] hover:bg-[#7ed944] text-[#1a1b1e] font-bold text-base transition-all hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-[#5bc827]/20"
        >
          🏠 Confirmar entrega
        </button>
      ) : null}
    </div>
  )
}

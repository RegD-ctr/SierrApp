import { useState, useRef } from 'react'
import logoImg from '@/imports/logo.jpeg'
import LocalOrderDetail from '@/components/LocalOrderDetail'

type Role = 'usuario' | 'local' | 'repartidor'
type Filter = 'todos' | 'disponibles' | 'agotados'
type LocalView = 'dashboard' | 'platillos' | 'pedidos' | 'perfil'

interface Platillo {
  id: number
  nombre: string
  descripcion: string
  categoria: string
  precio: string
  imagen: string | null
  disponible: boolean
}

const categorias = ['Entradas', 'Platos fuertes', 'Postres', 'Bebidas', 'Combos', 'Ensaladas', 'Tacos', 'Pizzas', 'Burgers', 'Otro']

const initialPlatillos: Platillo[] = [
  { id: 1, nombre: 'Burger Clásica', descripcion: 'Carne 200g, lechuga, tomate, queso cheddar, papas incluidas.', categoria: 'Burgers', precio: '120', imagen: 'https://images.unsplash.com/photo-1512152272829-e3139592d56f?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&w=200&h=200', disponible: true },
  { id: 2, nombre: 'Papas Fritas', descripcion: 'Papas crujientes con sal y ajo, porción grande.', categoria: 'Entradas', precio: '55', imagen: 'https://images.unsplash.com/photo-1517434324-1db605ff03c7?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&w=200&h=200', disponible: true },
  { id: 3, nombre: 'Refresco 600ml', descripcion: 'Variedad de sabores: cola, naranja, limón.', categoria: 'Bebidas', precio: '30', imagen: null, disponible: false },
]

interface Props {
  onLogout: () => void
}

type VentasTimeframe = 'hoy' | 'semana' | 'mes' | 'anio' | 'personalizado'

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]
const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

function generarVentasPorFecha(dia: number | null, mes: number, anio: number) {
  const isDiaPuntual = dia !== null
  const seed = (anio * 37) + ((mes + 1) * 101) + (dia !== null ? dia * 13 : 777)
  const factor = 0.7 + (((seed * 9301 + 49297) % 233280) / 233280) * 0.6

  const baseTotal = isDiaPuntual ? 1500 * factor : 35000 * factor
  const total = Math.round(baseTotal * 100) / 100
  const pedidos = Math.round(total / 210)
  const ticketPromedio = total / pedidos

  const pctEfectivo = 0.3 + (((seed * 12345 + 6789) % 100) / 100) * 0.15
  const efectivo = Math.round(total * pctEfectivo * 100) / 100
  const tarjeta = Math.round((total - efectivo) * 100) / 100

  const comisionPlataforma = Math.round(total * 0.15 * 100) / 100
  const netoRecibido = Math.round((total - comisionPlataforma) * 100) / 100

  return { total, pedidos, ticketPromedio, efectivo, tarjeta, comisionPlataforma, netoRecibido }
}

const DATA_VENTAS: Record<Exclude<VentasTimeframe, 'personalizado'>, {
  total: number
  pedidos: number
  ticketPromedio: number
  efectivo: number
  tarjeta: number
  comisionPlataforma: number
  netoRecibido: number
}> = {
  hoy: {
    total: 1240.00,
    pedidos: 6,
    ticketPromedio: 206.67,
    efectivo: 440.00,
    tarjeta: 800.00,
    comisionPlataforma: 186.00,
    netoRecibido: 1054.00,
  },
  semana: {
    total: 8950.00,
    pedidos: 42,
    ticketPromedio: 213.10,
    efectivo: 2950.00,
    tarjeta: 6000.00,
    comisionPlataforma: 1342.50,
    netoRecibido: 7607.50,
  },
  mes: {
    total: 36800.00,
    pedidos: 175,
    ticketPromedio: 210.28,
    efectivo: 11800.00,
    tarjeta: 25000.00,
    comisionPlataforma: 5520.00,
    netoRecibido: 31280.00,
  },
  anio: {
    total: 420000.00,
    pedidos: 2000,
    ticketPromedio: 210.00,
    efectivo: 135000.00,
    tarjeta: 285000.00,
    comisionPlataforma: 63000.00,
    netoRecibido: 357000.00,
  },
}

/**
 * Componente del panel de control para un Local (Restaurante).
 * Permite gestionar el dashboard, editar/crear platillos, y manejar órdenes entrantes.
 * 
 * @param {Props} props - Propiedades que incluyen la función onLogout.
 */
export default function LocalPanel({ onLogout }: Props) {
  const [view, setView] = useState<LocalView>('dashboard')
  const [platillos, setPlatillos] = useState<Platillo[]>(initialPlatillos)
  const [filter, setFilter] = useState<Filter>('todos')
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [confirmSoldOut, setConfirmSoldOut] = useState<number | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null)

  // Estado para estado abierto/cerrado del local y su modal de confirmación
  const [localAbierto, setLocalAbierto] = useState(true)
  const [showConfirmToggle, setShowConfirmToggle] = useState(false)

  // Estado para desplegable de resumen de ventas
  const [showVentasDetails, setShowVentasDetails] = useState(false)
  const [selectedVentasTimeframe, setSelectedVentasTimeframe] = useState<VentasTimeframe>('mes')
  const [fechaVentasSeleccionada, setFechaVentasSeleccionada] = useState<{ dia: number | null, mes: number, anio: number }>({ 
    dia: null, mes: new Date().getMonth(), anio: new Date().getFullYear() 
  })

  // Estado compartido para los pedidos activos
  const [activeOrders, setActiveOrders] = useState([
    { id: '#SRR-4821', cliente: 'Juan Sierra', items: ['Burger Clásica x2', 'Papas Fritas x2'], total: '$350', hora: '8:42 pm', status: 'Preparando', statusColor: 'bg-blue-900/30 text-blue-400' },
    { id: '#SRR-4820', cliente: 'María López', items: ['Combo Doble x1'], total: '$190', hora: '8:38 pm', status: 'Listo para recoger', statusColor: 'bg-[#5bc827]/20 text-[#5bc827]' },
    { id: '#SRR-4819', cliente: 'Carlos R.', items: ['Burger Clásica x1', 'Refresco x1'], total: '$150', hora: '8:31 pm', status: 'Nuevo pedido', statusColor: 'bg-yellow-900/40 text-yellow-400' },
  ])

  const emptyForm = { nombre: '', descripcion: '', categoria: categorias[0], precio: '', imagen: null as string | null, disponible: true }
  const [form, setForm] = useState(emptyForm)
  const fileRef = useRef<HTMLInputElement>(null)

  const filtered = platillos.filter(p =>
    filter === 'todos' ? true : filter === 'disponibles' ? p.disponible : !p.disponible
  )

  const currentVentas = selectedVentasTimeframe === 'personalizado' 
    ? generarVentasPorFecha(fechaVentasSeleccionada.dia, fechaVentasSeleccionada.mes, fechaVentasSeleccionada.anio)
    : DATA_VENTAS[selectedVentasTimeframe as Exclude<VentasTimeframe, 'personalizado'>]

  const statsData = [
    { label: 'Pedidos activos', value: `${activeOrders.length}`, icon: '📦', trend: null },
    { label: 'Platillos activos', value: `${platillos.filter(p => p.disponible).length}`, icon: '🍽️', trend: null },
    { label: 'Rating promedio', value: '4.7 ★', icon: '⭐', trend: '+0.2' },
  ]

  /**
   * Abre el formulario modal para agregar un nuevo platillo.
   * Limpia el formulario y establece el estado para creación.
   */
  const openAdd = () => { setForm(emptyForm); setEditId(null); setShowForm(true) }

  /**
   * Abre el formulario modal para editar un platillo existente.
   * 
   * @param {Platillo} p - Datos del platillo a editar.
   */
  const openEdit = (p: Platillo) => {
    setForm({ nombre: p.nombre, descripcion: p.descripcion, categoria: p.categoria, precio: p.precio, imagen: p.imagen, disponible: p.disponible })
    setEditId(p.id)
    setShowForm(true)
  }

  /**
   * Maneja la subida de una imagen para un platillo y la convierte a formato base64.
   * 
   * @param {React.ChangeEvent<HTMLInputElement>} e - Evento del input de archivo.
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setForm(f => ({ ...f, imagen: ev.target?.result as string }))
    reader.readAsDataURL(file)
  }

  /**
   * Guarda los cambios del formulario de platillo (ya sea crear o editar).
   * Valida campos mínimos y actualiza el estado de platillos.
   */
  const handleSave = () => {
    if (!form.nombre.trim() || !form.precio.trim()) return
    if (editId !== null) {
      setPlatillos(ps => ps.map(p => p.id === editId ? { ...p, ...form } : p))
    } else {
      setPlatillos(ps => [...ps, { id: Date.now(), ...form }])
    }
    setShowForm(false)
  }

  /**
   * Alterna la disponibilidad (agotado/disponible) de un platillo específico.
   * 
   * @param {number} id - Identificador del platillo.
   */
  const toggleDisponible = (id: number) => {
    setPlatillos(ps => ps.map(p => p.id === id ? { ...p, disponible: !p.disponible } : p))
    setConfirmSoldOut(null)
  }

  const navItems: { icon: string; label: string; view: LocalView }[] = [
    { icon: '📊', label: 'Panel', view: 'dashboard' },
    { icon: '🍽️', label: 'Platillos', view: 'platillos' },
    { icon: '📦', label: 'Pedidos', view: 'pedidos' },
    { icon: '👤', label: 'Perfil', view: 'perfil' },
  ]

  if (selectedOrder) {
    return (
      <LocalOrderDetail 
        orden={{
          id: selectedOrder.id,
          cliente: selectedOrder.cliente,
          hora: selectedOrder.hora,
          estado: selectedOrder.status === 'Nuevo pedido' ? 'pendiente' : selectedOrder.status === 'Preparando' ? 'preparando' : 'listo',
          productos: selectedOrder.items.map((i: string) => {
            const parts = i.split(' x')
            return { nombre: parts[0], cantidad: parseInt(parts[1] || '1') }
          }),
          total: selectedOrder.total
        }}
        onAceptar={() => setSelectedOrder(null)}
        onRechazar={() => setSelectedOrder(null)}
        onBack={() => setSelectedOrder(null)}
      />
    )
  }

  return (
    <div className="min-h-screen bg-[#1a1b1e] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#1a1b1e]/95 backdrop-blur-sm border-b border-[#35373b]">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <img src={logoImg} alt="Sierra App" className="w-9 h-9 rounded-lg object-cover" />
            <div>
              <p className="text-[#5bc827] text-xs font-bold tracking-widest uppercase" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Sierra App</p>
              <p className="text-[#9a9da3] text-[10px]">Panel de Local</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${localAbierto ? 'bg-[#5bc827] animate-pulse' : 'bg-red-500'}`} />
            <span className={`text-xs font-semibold ${localAbierto ? 'text-[#5bc827]' : 'text-red-400'}`}>
              {localAbierto ? 'Abierto' : 'Cerrado'}
            </span>
            <span className="text-[#35373b] mx-1">|</span>
            <span className="text-[#9a9da3] text-xs">Sierra Burger Co.</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 pb-28">

        {/* DASHBOARD */}
        {view === 'dashboard' && (
          <div className="pt-5">
            <h1 className="text-3xl font-bold text-white uppercase mb-1" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
              ¡Buen día, Sierra Burger! 👋
            </h1>
            <p className="text-[#9a9da3] text-sm mb-6">Resumen de tu negocio hoy</p>

            {/* Grid de 3 estadísticas */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              {statsData.map(s => (
                <div key={s.label} className="bg-[#232427] border border-[#35373b] rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xl">{s.icon}</span>
                    {s.trend && <span className="text-[#5bc827] text-[10px] font-bold">{s.trend}</span>}
                  </div>
                  <p className="text-white font-bold text-2xl" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>{s.value}</p>
                  <p className="text-[#9a9da3] text-xs">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Tarjeta Desplegable: Resumen de Ventas */}
            <div className="bg-[#232427] border border-[#35373b] rounded-2xl mb-7 overflow-hidden transition-all duration-300">
              <button 
                onClick={() => setShowVentasDetails(!showVentasDetails)}
                className="w-full text-left p-5 flex items-center justify-between gap-4 group cursor-pointer focus:outline-none"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-[#9a9da3] text-xs uppercase tracking-widest font-semibold">Resumen de ventas</p>
                    <span className="text-[10px] bg-[#5bc827]/10 text-[#5bc827] border border-[#5bc827]/30 px-2.5 py-0.5 rounded-full font-bold uppercase">
                      {selectedVentasTimeframe === 'hoy'
                        ? 'Hoy'
                        : selectedVentasTimeframe === 'semana'
                        ? 'Esta Semana'
                        : selectedVentasTimeframe === 'mes'
                        ? 'Este Mes'
                        : selectedVentasTimeframe === 'anio'
                        ? 'Este Año'
                        : fechaVentasSeleccionada.dia !== null
                        ? `${fechaVentasSeleccionada.dia} de ${MESES[fechaVentasSeleccionada.mes].toLowerCase()}, ${fechaVentasSeleccionada.anio}`
                        : `${MESES[fechaVentasSeleccionada.mes]} ${fechaVentasSeleccionada.anio}`}
                    </span>
                  </div>
                  <p className="text-4xl font-bold text-[#5bc827]" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                    ${currentVentas.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#9a9da3] group-hover:text-white transition-colors hidden sm:inline">
                    {showVentasDetails ? 'Ocultar detalles' : 'Ver detalles'}
                  </span>
                  <div className={`w-8 h-8 rounded-xl bg-[#1a1b1e] border border-[#35373b] group-hover:border-[#5bc827]/50 flex items-center justify-center transition-transform duration-300 ${showVentasDetails ? 'rotate-180' : ''}`}>
                    <span className="text-[#5bc827] text-xs">▼</span>
                  </div>
                </div>
              </button>

              {showVentasDetails && (
                <div className="px-5 pb-5 border-t border-[#35373b] pt-4 space-y-5 animate-fadeIn">
                  {/* Selector de lapso */}
                  <div>
                    <label className="text-xs text-[#9a9da3] uppercase tracking-wider font-semibold block mb-2">Lapso de tiempo</label>
                    <div className="grid grid-cols-5 gap-1.5 bg-[#1a1b1e] p-1.5 rounded-xl border border-[#35373b]">
                      {[
                        { id: 'hoy', label: 'Hoy' },
                        { id: 'semana', label: 'Semana' },
                        { id: 'mes', label: 'Mes' },
                        { id: 'anio', label: 'Año' },
                        { id: 'personalizado', label: '📅 Elegir fecha' }
                      ].map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setSelectedVentasTimeframe(t.id as VentasTimeframe)}
                          className={`py-2 px-1 text-[11px] font-bold rounded-lg transition-all text-center cursor-pointer truncate ${
                            selectedVentasTimeframe === t.id
                              ? 'bg-[#5bc827] text-[#1a1b1e] shadow-md shadow-[#5bc827]/20'
                              : 'text-[#9a9da3] hover:text-white hover:bg-[#232427]'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Calendario Personalizado */}
                  {selectedVentasTimeframe === 'personalizado' && (
                    <div className="bg-[#1a1b1e] border border-[#35373b] p-4 rounded-xl space-y-3 animate-fadeIn">
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#35373b]/60">
                        {/* Selector de Mes */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              let newMes = fechaVentasSeleccionada.mes - 1
                              let newAnio = fechaVentasSeleccionada.anio
                              if (newMes < 0) {
                                newMes = 11
                                newAnio = Math.max(2023, newAnio - 1)
                              }
                              setFechaVentasSeleccionada(prev => ({ ...prev, mes: newMes, anio: newAnio }))
                            }}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#232427] border border-[#35373b] text-[#9a9da3] hover:text-white hover:border-[#5bc827] transition-colors"
                          >
                            ‹
                          </button>
                          <select
                            value={fechaVentasSeleccionada.mes}
                            onChange={(e) => setFechaVentasSeleccionada(prev => ({ ...prev, mes: Number(e.target.value) }))}
                            className="bg-[#232427] border border-[#35373b] text-white text-xs font-semibold rounded-lg px-2 py-1 outline-none focus:border-[#5bc827] transition-colors cursor-pointer"
                          >
                            {MESES.map((m, idx) => (
                              <option key={m} value={idx} className="bg-[#1a1b1e] text-white">{m}</option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => {
                              let newMes = fechaVentasSeleccionada.mes + 1
                              let newAnio = fechaVentasSeleccionada.anio
                              if (newMes > 11) {
                                newMes = 0
                                newAnio = Math.min(2026, newAnio + 1)
                              }
                              setFechaVentasSeleccionada(prev => ({ ...prev, mes: newMes, anio: newAnio }))
                            }}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#232427] border border-[#35373b] text-[#9a9da3] hover:text-white hover:border-[#5bc827] transition-colors"
                          >
                            ›
                          </button>
                        </div>

                        {/* Selector de Año */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={fechaVentasSeleccionada.anio <= 2023}
                            onClick={() => setFechaVentasSeleccionada(prev => ({ ...prev, anio: Math.max(2023, prev.anio - 1) }))}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#232427] border border-[#35373b] text-[#9a9da3] hover:text-white hover:border-[#5bc827] disabled:opacity-40 transition-colors"
                          >
                            ‹
                          </button>
                          <select
                            value={fechaVentasSeleccionada.anio}
                            onChange={(e) => setFechaVentasSeleccionada(prev => ({ ...prev, anio: Number(e.target.value) }))}
                            className="bg-[#232427] border border-[#35373b] text-white text-xs font-bold rounded-lg px-2 py-1 outline-none focus:border-[#5bc827] transition-colors cursor-pointer"
                          >
                            {[2023, 2024, 2025, 2026].map(yr => (
                              <option key={yr} value={yr} className="bg-[#1a1b1e] text-white">{yr}</option>
                            ))}
                          </select>
                          <button
                            type="button"
                            disabled={fechaVentasSeleccionada.anio >= 2026}
                            onClick={() => setFechaVentasSeleccionada(prev => ({ ...prev, anio: Math.min(2026, prev.anio + 1) }))}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#232427] border border-[#35373b] text-[#9a9da3] hover:text-white hover:border-[#5bc827] disabled:opacity-40 transition-colors"
                          >
                            ›
                          </button>
                        </div>
                      </div>

                      {/* Encabezado Días de la Semana */}
                      <div className="grid grid-cols-7 gap-1 text-center">
                        {DIAS_SEMANA.map(d => (
                          <span key={d} className="text-[10px] text-[#9a9da3] font-bold uppercase py-1">
                            {d}
                          </span>
                        ))}
                      </div>

                      {/* Cuadrícula de Días */}
                      {(() => {
                        const firstDayIndex = (new Date(fechaVentasSeleccionada.anio, fechaVentasSeleccionada.mes, 1).getDay() + 6) % 7
                        const daysInMonth = new Date(fechaVentasSeleccionada.anio, fechaVentasSeleccionada.mes + 1, 0).getDate()

                        return (
                          <div className="grid grid-cols-7 gap-1">
                            {Array.from({ length: firstDayIndex }).map((_, i) => (
                              <div key={`empty-${i}`} className="h-8" />
                            ))}

                            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                              const isSelected = fechaVentasSeleccionada.dia === day
                              return (
                                <button
                                  key={day}
                                  type="button"
                                  onClick={() => setFechaVentasSeleccionada(prev => ({ ...prev, dia: day }))}
                                  className={`h-8 text-xs font-semibold rounded-lg flex items-center justify-center transition-all ${
                                    isSelected
                                      ? 'bg-[#5bc827] text-[#1a1b1e] font-bold shadow-md shadow-[#5bc827]/20 scale-105'
                                      : 'bg-[#1a1b1e] border border-[#35373b] text-white hover:bg-[#232427] hover:border-[#5bc827]/40'
                                  }`}
                                >
                                  {day}
                                </button>
                              )
                            })}
                          </div>
                        )
                      })()}

                      {/* Botones de Selección: Día vs Mes */}
                      <div className="flex items-center gap-2 pt-2 border-t border-[#35373b]/60">
                        <button
                          type="button"
                          onClick={() => setFechaVentasSeleccionada(prev => ({ ...prev, dia: prev.dia || 1 }))}
                          className={`flex-1 py-2 px-2 text-xs font-bold rounded-lg border transition-all ${
                            fechaVentasSeleccionada.dia !== null
                              ? 'bg-[#5bc827]/10 border-[#5bc827] text-[#5bc827]'
                              : 'bg-[#1a1b1e] border-[#35373b] text-[#9a9da3] hover:text-white hover:bg-[#232427]'
                          }`}
                        >
                          Ver solo este día
                        </button>
                        <button
                          type="button"
                          onClick={() => setFechaVentasSeleccionada(prev => ({ ...prev, dia: null }))}
                          className={`flex-1 py-2 px-2 text-xs font-bold rounded-lg border transition-all ${
                            fechaVentasSeleccionada.dia === null
                              ? 'bg-[#5bc827]/10 border-[#5bc827] text-[#5bc827]'
                              : 'bg-[#1a1b1e] border-[#35373b] text-[#9a9da3] hover:text-white hover:bg-[#232427]'
                          }`}
                        >
                          Ver todo el mes
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Resumen de Pedidos y Ticket */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#1a1b1e] border border-[#35373b] p-3.5 rounded-xl">
                      <p className="text-xs text-[#9a9da3]">Pedidos completados</p>
                      <p className="text-xl font-bold text-white mt-0.5">{currentVentas.pedidos}</p>
                    </div>
                    <div className="bg-[#1a1b1e] border border-[#35373b] p-3.5 rounded-xl">
                      <p className="text-xs text-[#9a9da3]">Ticket promedio</p>
                      <p className="text-xl font-bold text-white mt-0.5">${currentVentas.ticketPromedio.toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Desglose Métodos de Pago */}
                  <div>
                    <p className="text-xs text-[#9a9da3] uppercase tracking-wider font-semibold mb-2">Métodos de Pago</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-[#1a1b1e] border border-[#35373b] p-3.5 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">💵</span>
                          <div>
                            <p className="text-xs text-[#9a9da3]">Efectivo</p>
                            <p className="text-lg font-bold text-white">${currentVentas.efectivo.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                          </div>
                        </div>
                        <span className="text-xs font-mono text-[#9a9da3]">
                          {((currentVentas.efectivo / currentVentas.total) * 100).toFixed(0)}%
                        </span>
                      </div>

                      <div className="bg-[#1a1b1e] border border-[#35373b] p-3.5 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">💳</span>
                          <div>
                            <p className="text-xs text-[#9a9da3]">Tarjeta</p>
                            <p className="text-lg font-bold text-white">${currentVentas.tarjeta.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                          </div>
                        </div>
                        <span className="text-xs font-mono text-[#9a9da3]">
                          {((currentVentas.tarjeta / currentVentas.total) * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Fila final: Comisión y Neto */}
                  <div className="bg-[#1a1b1e] border border-[#35373b] p-4 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#9a9da3]">Ventas totales brutas</span>
                      <span className="text-white font-semibold">${currentVentas.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#9a9da3]">Comisión de plataforma (15%)</span>
                      <span className="text-red-400 font-semibold">-${currentVentas.comisionPlataforma.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="border-t border-[#35373b] pt-2 flex items-center justify-between">
                      <span className="text-sm font-bold text-white">Recibes (Neto)</span>
                      <span className="text-xl font-bold text-[#5bc827]">${currentVentas.netoRecibido.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <h2 className="text-xl font-bold text-white uppercase mb-3" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Acciones rápidas</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: '➕', label: 'Agregar platillo', action: () => { setView('platillos'); openAdd() } },
                { icon: '📋', label: 'Ver mis platillos', action: () => setView('platillos') },
                { icon: '📦', label: 'Órdenes activas', action: () => setView('pedidos') },
                { 
                  icon: localAbierto ? '🔴' : '🟢', 
                  label: localAbierto ? 'Cerrar local' : 'Abrir local', 
                  action: () => setShowConfirmToggle(true) 
                },
              ].map(a => (
                <button
                  key={a.label}
                  onClick={a.action}
                  className="bg-[#232427] border border-[#35373b] hover:border-[#5bc827]/60 rounded-2xl p-5 flex flex-col items-start gap-2 transition-all hover:bg-[#1a3320] text-left group cursor-pointer"
                >
                  <span className="text-2xl">{a.icon}</span>
                  <span className="text-sm font-semibold text-[#c4c6ca] group-hover:text-white transition-colors">{a.label}</span>
                </button>
              ))}
            </div>

            {/* Pedidos Activos en el Dashboard */}
            <div className="mt-6 bg-[#232427] border border-[#5bc827]/30 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-[#5bc827] animate-pulse" />
                <h3 className="text-sm font-bold text-white">{activeOrders.length} pedidos activos</h3>
              </div>
              {activeOrders.map(p => (
                <div 
                  key={p.id} 
                  onClick={() => setSelectedOrder(p)}
                  className="flex items-center justify-between py-2.5 border-b border-[#35373b] last:border-0 cursor-pointer hover:bg-[#1a1b1e]/60 transition-colors rounded-lg px-2 group"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#5bc827] group-hover:underline">{p.id}</span>
                      <span className="text-white text-xs font-semibold">{p.cliente}</span>
                    </div>
                    <p className="text-[#9a9da3] text-[10px]">{Array.isArray(p.items) ? p.items.join(', ') : p.items}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    p.status === 'Nuevo pedido' ? 'bg-yellow-900/40 text-yellow-400' :
                    p.status === 'Listo para recoger' ? 'bg-[#5bc827]/20 text-[#5bc827]' :
                    'bg-blue-900/30 text-blue-400'
                  }`}>
                    {p.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PLATILLOS */}
        {view === 'platillos' && (
          <div className="pt-5">
            <div className="flex items-center justify-between mb-5">
              <h1 className="text-3xl font-bold text-white uppercase" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                Mis Platillos
              </h1>
              <button
                onClick={openAdd}
                className="bg-[#5bc827] hover:bg-[#7ed944] text-[#1a1b1e] font-bold text-sm px-4 py-2 rounded-full flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <span className="text-base leading-none">+</span> Agregar platillo
              </button>
            </div>

            {/* Filters */}
            <div className="flex bg-[#232427] rounded-full p-1 w-fit gap-1 mb-5">
              {(['todos', 'disponibles', 'agotados'] as Filter[]).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold capitalize transition-all cursor-pointer ${
                    filter === f ? 'bg-[#5bc827] text-[#1a1b1e]' : 'text-[#9a9da3] hover:text-white'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                  <span className="ml-1 opacity-70">
                    ({f === 'todos' ? platillos.length : f === 'disponibles' ? platillos.filter(p => p.disponible).length : platillos.filter(p => !p.disponible).length})
                  </span>
                </button>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <span className="text-5xl mb-3">🍽️</span>
                <p className="text-white font-semibold">Sin platillos {filter !== 'todos' ? `${filter}` : ''}</p>
                <p className="text-[#9a9da3] text-sm mt-1">
                  {filter === 'todos' ? 'Agrega tu primer platillo.' : 'Cambia el filtro para ver otros.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map(p => (
                  <PlatilloCard
                    key={p.id}
                    p={p}
                    onEdit={() => openEdit(p)}
                    onToggle={() => p.disponible ? setConfirmSoldOut(p.id) : toggleDisponible(p.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* PEDIDOS */}
        {view === 'pedidos' && (
          <div className="pt-5">
            <h1 className="text-3xl font-bold text-white uppercase mb-5" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Pedidos Activos</h1>
            <div className="space-y-3">
              {activeOrders.map(order => (
                <div key={order.id} onClick={() => setSelectedOrder(order)} className="bg-[#232427] border border-[#35373b] rounded-2xl p-4 cursor-pointer hover:border-[#5bc827]/50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="text-[#5bc827] text-sm font-bold">{order.id}</span>
                      <p className="text-white text-xs font-semibold">{order.cliente}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${order.statusColor}`}>{order.status}</span>
                  </div>
                  <p className="text-[#9a9da3] text-xs mb-2">{order.items.join(' · ')}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#9a9da3]">⏱ {order.hora}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[#5bc827] font-bold text-sm">{order.total}</span>
                      <button className="bg-[#5bc827] hover:bg-[#7ed944] text-[#1a1b1e] text-xs font-bold px-3 py-1 rounded-full transition-colors cursor-pointer">
                        Ver
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PERFIL */}
        {view === 'perfil' && (
          <div className="pt-5">
            <h1 className="text-3xl font-bold text-white uppercase mb-5" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Mi Negocio</h1>
            <div className="bg-[#232427] border border-[#35373b] rounded-2xl p-5 mb-4 flex items-center gap-4">
              <div className="w-16 h-16 bg-[#5bc827]/20 border-2 border-[#5bc827] rounded-2xl flex items-center justify-center text-2xl">🏪</div>
              <div>
                <h2 className="text-white font-bold text-lg">Sierra Burger Co.</h2>
                <p className="text-[#9a9da3] text-xs">Hamburguesas · Centro Sierra</p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#5bc827]" />
                  <span className="text-[#5bc827] text-[10px] font-bold">Verificado</span>
                </div>
              </div>
            </div>
            {[
              { icon: '⏰', label: 'Horario de atención', sub: 'Lun–Dom 9:00 am – 11:00 pm' },
              { icon: '📍', label: 'Dirección', sub: 'Av. Sierra #45, Col. Centro' },
              { icon: '📞', label: 'Teléfono', sub: '+52 614 000 0000' },
              { icon: '🏦', label: 'Datos bancarios', sub: 'Cuenta registrada' },
            ].map(item => (
              <button key={item.label} className="w-full flex items-center gap-3 px-3 py-3.5 rounded-xl hover:bg-[#232427] transition-colors text-left cursor-pointer">
                <span className="text-xl w-7 text-center">{item.icon}</span>
                <div className="flex-1">
                  <p className="text-sm text-white font-medium">{item.label}</p>
                  <p className="text-[10px] text-[#9a9da3]">{item.sub}</p>
                </div>
                <svg className="w-4 h-4 text-[#35373b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
            <div className="mt-6">
              <button onClick={onLogout} className="w-full py-3 rounded-xl border border-red-800/50 text-red-400 text-sm font-semibold hover:bg-red-900/20 transition-colors cursor-pointer">
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
            className={`flex flex-col items-center gap-0.5 px-4 py-1 transition-colors cursor-pointer ${view === item.view ? 'text-[#5bc827]' : 'text-[#9a9da3]'}`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-[10px] font-medium">{item.label}</span>
            {view === item.view && <span className="w-1 h-1 rounded-full bg-[#5bc827] mt-0.5" />}
          </button>
        ))}
      </nav>

      {/* Modal de confirmación para Abrir / Cerrar local */}
      {showConfirmToggle && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowConfirmToggle(false)}>
          <div className="bg-[#232427] border border-[#35373b] rounded-2xl p-6 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <p className="text-center text-4xl mb-3">{localAbierto ? '🔴' : '🟢'}</p>
            <h3 className="text-white font-bold text-lg text-center mb-2">
              {localAbierto ? '¿Quieres cerrar?' : '¿Quieres abrir?'}
            </h3>
            <p className="text-[#9a9da3] text-sm text-center mb-5">
              {localAbierto 
                ? 'Dejarás de recibir nuevos pedidos hasta que vuelvas a abrir.' 
                : 'Empezarás a recibir nuevos pedidos de inmediato.'}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirmToggle(false)} className="flex-1 py-3 rounded-xl border border-[#35373b] text-[#c4c6ca] font-semibold hover:bg-[#1a1b1e] transition-colors cursor-pointer">
                Cancelar
              </button>
              <button 
                onClick={() => { setLocalAbierto(!localAbierto); setShowConfirmToggle(false) }} 
                className={`flex-1 py-3 rounded-xl font-bold transition-colors cursor-pointer ${localAbierto ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-[#5bc827] hover:bg-[#7ed944] text-[#1a1b1e]'}`}
              >
                {localAbierto ? 'Sí, cerrar' : 'Sí, abrir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[#1a1b1e] border border-[#35373b] rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
            <div className="px-5 pt-5 pb-2 flex items-center justify-between border-b border-[#35373b]">
              <h2 className="text-xl font-bold text-white uppercase" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                {editId !== null ? 'Editar platillo' : 'Nuevo platillo'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-[#9a9da3] hover:text-white transition-colors text-xl cursor-pointer">✕</button>
            </div>
            <div className="px-5 py-4 space-y-3">
              {/* Image upload */}
              <div>
                <label className="text-[#c4c6ca] text-xs font-semibold block mb-1">Fotografía</label>
                <div
                  onClick={() => fileRef.current?.click()}
                  className="w-full h-32 rounded-xl border-2 border-dashed border-[#35373b] hover:border-[#5bc827] flex items-center justify-center cursor-pointer overflow-hidden transition-colors"
                >
                  {form.imagen ? (
                    <img src={form.imagen} alt="preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-[#9a9da3]">
                      <span className="text-3xl">📷</span>
                      <span className="text-xs">Subir imagen</span>
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </div>

              {[
                { key: 'nombre', label: 'Nombre del platillo', placeholder: 'Ej. Burger Clásica', type: 'text' },
                { key: 'descripcion', label: 'Descripción', placeholder: 'Ingredientes, porciones...', type: 'textarea' },
                { key: 'precio', label: 'Precio ($)', placeholder: '0.00', type: 'number' },
              ].map(field => (
                <div key={field.key}>
                  <label className="text-[#c4c6ca] text-xs font-semibold block mb-1">{field.label}</label>
                  {field.type === 'textarea' ? (
                    <textarea
                      value={(form as Record<string, any>)[field.key] as string}
                      onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                      rows={2}
                      className="w-full bg-[#232427] border border-[#35373b] focus:border-[#5bc827] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#9a9da3] outline-none transition-colors resize-none"
                    />
                  ) : (
                    <input
                      type={field.type}
                      value={(form as Record<string, any>)[field.key] as string}
                      onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                      className="w-full bg-[#232427] border border-[#35373b] focus:border-[#5bc827] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#9a9da3] outline-none transition-colors"
                    />
                  )}
                </div>
              ))}

              <div>
                <label className="text-[#c4c6ca] text-xs font-semibold block mb-1">Categoría</label>
                <select
                  value={form.categoria}
                  onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}
                  className="w-full bg-[#232427] border border-[#35373b] focus:border-[#5bc827] rounded-xl px-4 py-2.5 text-sm text-white outline-none transition-colors cursor-pointer"
                >
                  {categorias.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="flex items-center justify-between bg-[#232427] border border-[#35373b] rounded-xl px-4 py-3">
                <div>
                  <p className="text-white text-sm font-semibold">Disponible</p>
                  <p className="text-[#9a9da3] text-xs">Visible para clientes</p>
                </div>
                <button
                  onClick={() => setForm(f => ({ ...f, disponible: !f.disponible }))}
                  className={`w-12 h-6 rounded-full transition-all relative cursor-pointer ${form.disponible ? 'bg-[#5bc827]' : 'bg-[#35373b]'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${form.disponible ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-3 rounded-xl border border-[#35373b] text-[#9a9da3] text-sm font-semibold hover:border-[#5bc827]/50 hover:text-white transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 py-3 rounded-xl bg-[#5bc827] hover:bg-[#7ed944] text-[#1a1b1e] font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  Guardar platillo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sold-out confirmation */}
      {confirmSoldOut !== null && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1b1e] border border-[#35373b] rounded-2xl w-full max-w-sm p-6 text-center">
            <span className="text-4xl block mb-3">🚫</span>
            <h3 className="text-white font-bold text-lg mb-1">¿Marcar como agotado?</h3>
            <p className="text-[#9a9da3] text-sm mb-5">El platillo no podrá ser ordenado por clientes hasta que lo vuelvas a habilitar.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmSoldOut(null)} className="flex-1 py-2.5 rounded-xl border border-[#35373b] text-[#9a9da3] text-sm font-semibold hover:text-white transition-colors cursor-pointer">
                Cancelar
              </button>
              <button
                onClick={() => toggleDisponible(confirmSoldOut)}
                className="flex-1 py-2.5 rounded-xl bg-red-900/60 border border-red-800 text-red-400 text-sm font-bold hover:bg-red-900/80 transition-colors cursor-pointer"
              >
                Marcar agotado
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Componente visual que representa la tarjeta de un platillo en el catálogo del local.
 * 
 * @param {Object} props - Datos del platillo y funciones para editar o alternar estado.
 */
function PlatilloCard({ p, onEdit, onToggle }: { p: Platillo; onEdit: () => void; onToggle: () => void }) {
  return (
    <div className={`bg-[#232427] border rounded-2xl overflow-hidden transition-all ${p.disponible ? 'border-[#35373b]' : 'border-red-900/50 opacity-70'}`}>
      <div className="relative h-36 bg-[#1a3320] overflow-hidden">
        {p.imagen ? (
          <img src={p.imagen} alt={p.nombre} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl opacity-30">🍽️</div>
        )}
        {!p.disponible && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-red-900/80 text-red-400 text-xs font-bold px-3 py-1 rounded-full border border-red-800">AGOTADO</span>
          </div>
        )}
        <span className="absolute top-2 left-2 bg-[#1a1b1e]/80 text-[#5bc827] text-[10px] px-2 py-0.5 rounded-full border border-[#35373b]">
          {p.categoria}
        </span>
      </div>
      <div className="p-3">
        <div className="flex items-start justify-between gap-1 mb-1">
          <h3 className="font-bold text-sm text-white leading-tight">{p.nombre}</h3>
          <span className="text-[#5bc827] font-bold text-sm shrink-0">${p.precio}</span>
        </div>
        <p className="text-[#9a9da3] text-xs mb-3 line-clamp-2">{p.descripcion}</p>
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="flex-1 py-1.5 rounded-lg border border-[#35373b] hover:border-[#5bc827]/60 text-[#c4c6ca] text-xs font-semibold transition-colors hover:text-white cursor-pointer"
          >
            ✏️ Editar
          </button>
          <button
            onClick={onToggle}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              p.disponible
                ? 'bg-red-900/30 border border-red-800/50 text-red-400 hover:bg-red-900/50'
                : 'bg-[#5bc827]/20 border border-[#5bc827]/40 text-[#5bc827] hover:bg-[#5bc827]/30'
            }`}
          >
            {p.disponible ? 'Agotar' : '✅ Habilitar'}
          </button>
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'

type Tab = 'dashboard' | 'usuarios' | 'locales' | 'repartidores' | 'pedidos' | 'config'
type Timeframe = 'hoy' | 'semana' | 'mes' | 'anio' | 'personalizado'

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]
const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

interface Props {
  onLogout: () => void
}

// Datos de ejemplo simulados según el lapso de tiempo seleccionado
const DATA_INGRESOS: Record<Exclude<Timeframe, 'personalizado'>, {
  total: number
  efectivo: number
  tarjeta: number
  comisionUsuario: number
  comisionLocales: number
}> = {
  hoy: {
    total: 3250.00,
    efectivo: 1100.00,
    tarjeta: 2150.00,
    comisionUsuario: 1075.00,
    comisionLocales: 2175.00,
  },
  semana: {
    total: 18400.00,
    efectivo: 5900.00,
    tarjeta: 12500.00,
    comisionUsuario: 6100.00,
    comisionLocales: 12300.00,
  },
  mes: {
    total: 45200.00,
    efectivo: 14800.00,
    tarjeta: 30400.00,
    comisionUsuario: 15000.00,
    comisionLocales: 30200.00,
  },
  anio: {
    total: 520400.00,
    efectivo: 165000.00,
    tarjeta: 355400.00,
    comisionUsuario: 173000.00,
    comisionLocales: 347400.00,
  },
}

/**
 * Genera datos simulados de ingresos para cualquier fecha elegida.
 * Utiliza una semilla basada en la fecha para mantener consistencia visual sin cambiar en re-renders.
 * 
 * Nota para integración futura: esta función eventualmente se reemplazará por
 * una llamada a GET /api/admin/ingresos?dia=X&mes=Y&anio=Z 
*/
function generarIngresosPorFecha(dia: number | null, mes: number, anio: number) {
  const isDiaPuntual = dia !== null
  const seed = (anio * 37) + ((mes + 1) * 101) + (dia !== null ? dia * 13 : 777)
  const factor = 0.7 + (((seed * 9301 + 49297) % 233280) / 233280) * 0.6

  const baseTotal = isDiaPuntual ? 3150 * factor : 44800 * factor
  const total = Math.round(baseTotal * 100) / 100

  const pctEfectivo = 0.3 + (((seed * 12345 + 6789) % 100) / 100) * 0.15
  const efectivo = Math.round(total * pctEfectivo * 100) / 100
  const tarjeta = Math.round((total - efectivo) * 100) / 100

  const comisionUsuario = Math.round(total * 0.33 * 100) / 100
  const comisionLocales = Math.round((total - comisionUsuario) * 100) / 100

  return { total, efectivo, tarjeta, comisionUsuario, comisionLocales }
}

/**
 * Componente principal del Panel de Administración.
 *  * Gestiona la navegación entre las diferentes pestañas (dashboard, usuarios, locales, etc.)
 * y mantiene el estado de las configuraciones de comisiones de la plataforma.
 * 
 * @param {Props} props - Propiedades del componente, incluye la función para cerrar sesión.
 */
export default function AdminPanel({ onLogout }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  const [comisionLocal, setComisionLocal] = useState<number>(15)
  const [comisionRepartidor, setComisionRepartidor] = useState<number>(20)
  const [comisionUsuario, setComisionUsuario] = useState<number>(5)
  const [showToast, setShowToast] = useState(false)

  // Estados para el desplegable de ingresos
  const [showIngresosDetails, setShowIngresosDetails] = useState<boolean>(false)
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('mes')
  const [fechaSeleccionada, setFechaSeleccionada] = useState<{
    dia: number | null
    mes: number
    anio: number
  }>({
    dia: null,
    mes: new Date().getMonth(),
    anio: new Date().getFullYear(),
  })
  // Estados para el de usuario seleccionado
  const [usuarios, setUsuarios] = useState([
    { 
      id: 1, name: 'Juan Pérez', email: 'juan@email.com', status: 'Activo',
      telefono: '618 123 4567', fechaRegistro: '12 Ene 2026', 
      pedidosTotales: 24, gastoTotal: 3120, rating: 4.8,
      direccionPrincipal: 'Calle Pino #24, Sierra Norte'
    },
    { 
      id: 2, name: 'María García', email: 'maria@email.com', status: 'Activo',
      telefono: '618 234 5678', fechaRegistro: '3 Mar 2026', 
      pedidosTotales: 11, gastoTotal: 1450, rating: 4.9,
      direccionPrincipal: 'Av. Las Palmas #300, Centro'
    },
    { 
      id: 3, name: 'Pedro Sánchez', email: 'pedro@email.com', status: 'Suspendido',
      telefono: '618 345 6789', fechaRegistro: '20 Nov 2025', 
      pedidosTotales: 6, gastoTotal: 540, rating: 3.9,
      direccionPrincipal: 'Blvd. Montaña #120, Las Cumbres'
    },
  ])

  const [selectedUsuario, setSelectedUsuario] = useState<typeof usuarios[number] | null>(null)
  const [showConfirmSuspend, setShowConfirmSuspend] = useState(false)

    /**
   * Maneja el evento de guardar la configuración de comisiones.
   * Muestra una notificación temporal (toast) de éxito durante 3 segundos.
   */
  const handleSaveConfig = () => {
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
  }

  const currentIngresos = selectedTimeframe === 'personalizado'
    ? generarIngresosPorFecha(fechaSeleccionada.dia, fechaSeleccionada.mes, fechaSeleccionada.anio)
    : DATA_INGRESOS[selectedTimeframe]

  const navItems: { id: Tab, label: string, icon: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'usuarios', label: 'Usuarios', icon: '👥' },
    { id: 'locales', label: 'Locales', icon: '🏪' },
    { id: 'repartidores', label: 'Repartidores', icon: '🏍️' },
    { id: 'pedidos', label: 'Pedidos', icon: '📦' },
    { id: 'config', label: 'Ajustes', icon: '⚙️' },
  ]
  /**
   * Componente interno que renderiza la barra superior del panel.
   * Contiene el logo, título y el botón para cerrar sesión.
   */
  const TopBar = () => (
    <header className="sticky top-0 z-40 bg-[#1a1b1e]/95 backdrop-blur-sm border-b border-[#35373b] px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#5e4526] to-[#2d2112] border border-[#d9a05b] flex items-center justify-center text-sm shadow-lg shadow-[#d9a05b]/20">🛡️</div>
        <div>
          <h1 className="text-white font-bold text-sm leading-tight">Panel Admin</h1>
          <p className="text-[#d9a05b] text-[10px] uppercase tracking-widest">Sierra App</p>
        </div>
      </div>
      <button onClick={onLogout} className="text-[#9a9da3] hover:text-[#d9a05b] transition-colors text-sm font-semibold">
        Salir
      </button>
    </header>
  )
  /**
   * Componente auxiliar para estandarizar el diseño de los títulos de cada sección.
   * 
   * @param {Object} props - Propiedades que incluyen el texto del título.
   */
  const Title = ({ text }: { text: string }) => (
    <h2 className="text-2xl font-bold text-white uppercase tracking-wide mb-4" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
      {text}
    </h2>
  )

  if (selectedUsuario) {
    return (
      <div className="min-h-screen bg-[#1a1b1e] text-white pb-10">
        <header className="sticky top-0 z-40 bg-[#1a1b1e]/95 backdrop-blur-sm border-b border-[#35373b] px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSelectedUsuario(null)} className="text-[#9a9da3] hover:text-white transition-colors cursor-pointer">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h1 className="text-xl font-bold uppercase tracking-wide" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Detalle de usuario</h1>
        </header>

        <div className="p-4 max-w-lg mx-auto w-full space-y-5">
          {/* Encabezado del usuario */}
          <div className="bg-[#232427] border border-[#35373b] rounded-2xl p-5 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#d9a05b]/20 border-2 border-[#d9a05b] flex items-center justify-center text-xl font-bold text-[#d9a05b]">
              {selectedUsuario.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-lg text-white">{selectedUsuario.name}</h2>
              <p className="text-[#9a9da3] text-xs">{selectedUsuario.email}</p>
              <span className={`inline-block mt-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded ${selectedUsuario.status === 'Activo' ? 'text-[#5bc827] bg-[#5bc827]/10' : 'text-red-400 bg-red-400/10'}`}>
                {selectedUsuario.status}
              </span>
            </div>
          </div>

          {/* Información general */}
          <div className="bg-[#232427] border border-[#35373b] rounded-2xl p-5 space-y-3">
            <h3 className="text-[#9a9da3] text-xs uppercase tracking-widest font-semibold mb-2">Información general</h3>
            <InfoRow label="Teléfono" value={selectedUsuario.telefono} />
            <InfoRow label="Fecha de registro" value={selectedUsuario.fechaRegistro} />
            <InfoRow label="Dirección principal" value={selectedUsuario.direccionPrincipal} />
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Pedidos totales" value={String(selectedUsuario.pedidosTotales)} icon="📦" />
            <StatCard label="Gasto total" value={`$${selectedUsuario.gastoTotal.toLocaleString('es-MX')}`} icon="💰" />
            <StatCard label="Rating" value={`${selectedUsuario.rating} ★`} icon="⭐" />
          </div>

          {/* Botón de suspender/reactivar */}
          <button
            onClick={() => setShowConfirmSuspend(true)}
            className={`w-full py-3.5 rounded-xl font-bold text-sm transition-colors cursor-pointer ${
              selectedUsuario.status === 'Activo'
                ? 'border border-red-800/50 text-red-400 hover:bg-red-900/20'
                : 'bg-[#5bc827] hover:bg-[#7ed944] text-[#1a1b1e]'
            }`}
          >
            {selectedUsuario.status === 'Activo' ? 'Suspender usuario' : 'Reactivar usuario'}
          </button>
        </div>

        {/* Modal de confirmación */}
        {showConfirmSuspend && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowConfirmSuspend(false)}>
            <div className="bg-[#232427] border border-[#35373b] rounded-2xl p-6 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
              <h3 className="text-white font-bold text-lg text-center mb-2">
                {selectedUsuario.status === 'Activo' ? '¿Suspender a este usuario?' : '¿Reactivar a este usuario?'}
              </h3>
              <p className="text-[#9a9da3] text-sm text-center mb-5">
                {selectedUsuario.status === 'Activo'
                  ? 'No podrá iniciar sesión ni hacer nuevos pedidos hasta que se reactive.'
                  : 'El usuario podrá volver a iniciar sesión y hacer pedidos normalmente.'}
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowConfirmSuspend(false)} className="flex-1 py-3 rounded-xl border border-[#35373b] text-[#c4c6ca] font-semibold hover:bg-[#1a1b1e] transition-colors cursor-pointer">
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    const nuevoStatus = selectedUsuario.status === 'Activo' ? 'Suspendido' : 'Activo'
                    setUsuarios(prev => prev.map(u => u.id === selectedUsuario.id ? { ...u, status: nuevoStatus } : u))
                    setSelectedUsuario(prev => prev ? { ...prev, status: nuevoStatus } : null)
                    setShowConfirmSuspend(false)
                  }}
                  className={`flex-1 py-3 rounded-xl font-bold transition-colors cursor-pointer ${selectedUsuario.status === 'Activo' ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-[#5bc827] hover:bg-[#7ed944] text-[#1a1b1e]'}`}
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#1a1b1e] text-white pb-20">
      <TopBar />
      <main className="p-4 max-w-5xl mx-auto">
        {activeTab === 'dashboard' && (
          <div>
            <Title text="Dashboard" />
            <div className="grid grid-cols-2 gap-3 mb-6">
              <StatCard 
                label="Usuarios Totales" 
                value="1,245" 
                icon="👥" 
                onClick={() => setActiveTab('usuarios')} 
              />
              <StatCard 
                label="Locales Activos" 
                value="34" 
                icon="🏪" 
                onClick={() => setActiveTab('locales')} 
              />
              <StatCard 
                label="Repartidores" 
                value="89" 
                icon="🏍️" 
                onClick={() => setActiveTab('repartidores')} 
              />
              <StatCard 
                label="Pedidos de Hoy" 
                value="215" 
                icon="📦" 
                onClick={() => setActiveTab('pedidos')} 
              />
            </div>

            {/* Apartado Desplegable: Ingresos de la plataforma */}
            <div className="bg-gradient-to-r from-[#232427] to-[#1a1b1e] border border-[#d9a05b]/30 rounded-2xl shadow-lg shadow-[#d9a05b]/5 relative overflow-hidden transition-all duration-300">
              <div className="absolute right-0 top-0 w-32 h-32 bg-[#d9a05b]/5 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

              {/* Botón Encabezado (Click para desplegar) */}
              <button 
                onClick={() => setShowIngresosDetails(!showIngresosDetails)}
                className="w-full text-left p-5 flex items-center justify-between gap-4 group cursor-pointer focus:outline-none"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-[#9a9da3] text-xs uppercase tracking-widest">Ingresos de la plataforma</p>
                    <span className="text-[10px] bg-[#d9a05b]/10 text-[#d9a05b] border border-[#d9a05b]/30 px-2 py-0.5 rounded-full font-bold uppercase">
                      {selectedTimeframe === 'hoy'
                        ? 'Hoy'
                        : selectedTimeframe === 'semana'
                        ? 'Esta Semana'
                        : selectedTimeframe === 'mes'
                        ? 'Este Mes'
                        : selectedTimeframe === 'anio'
                        ? 'Este Año'
                        : fechaSeleccionada.dia !== null
                        ? `${fechaSeleccionada.dia} de ${MESES[fechaSeleccionada.mes].toLowerCase()}, ${fechaSeleccionada.anio}`
                        : `${MESES[fechaSeleccionada.mes]} ${fechaSeleccionada.anio}`}
                    </span>
                  </div>
                  <p className="text-4xl font-bold text-[#d9a05b]" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                    ${currentIngresos.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#9a9da3] group-hover:text-white transition-colors hidden sm:inline">
                    {showIngresosDetails ? 'Ocultar detalles' : 'Ver detalles'}
                  </span>
                  <div className={`w-8 h-8 rounded-xl bg-[#232427] border border-[#35373b] group-hover:border-[#d9a05b]/50 flex items-center justify-center transition-transform duration-300 ${showIngresosDetails ? 'rotate-180' : ''}`}>
                    <span className="text-[#d9a05b] text-xs">▼</span>
                  </div>
                </div>
              </button>

              {/* Contenido Desplegable */}
              {showIngresosDetails && (
                <div className="px-5 pb-5 border-t border-[#35373b]/60 pt-4 space-y-5 animate-fadeIn">
                  
                  {/* Selector de Lapsos de Tiempo */}
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
                          onClick={() => setSelectedTimeframe(t.id as Timeframe)}
                          className={`py-2 px-1 text-[11px] font-bold rounded-lg transition-all truncate ${
                            selectedTimeframe === t.id
                              ? 'bg-[#d9a05b] text-[#1a1b1e] shadow-md shadow-[#d9a05b]/20'
                              : 'text-[#9a9da3] hover:text-white hover:bg-[#232427]'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Calendario Personalizado */}
                  {selectedTimeframe === 'personalizado' && (
                    <div className="bg-[#1a1b1e] border border-[#35373b] p-4 rounded-xl space-y-3 animate-fadeIn">
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#35373b]/60">
                        {/* Selector de Mes */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              let newMes = fechaSeleccionada.mes - 1
                              let newAnio = fechaSeleccionada.anio
                              if (newMes < 0) {
                                newMes = 11
                                newAnio = Math.max(2023, newAnio - 1)
                              }
                              setFechaSeleccionada(prev => ({ ...prev, mes: newMes, anio: newAnio }))
                            }}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#232427] border border-[#35373b] text-[#9a9da3] hover:text-white hover:border-[#d9a05b] transition-colors"
                          >
                            ‹
                          </button>
                          <select
                            value={fechaSeleccionada.mes}
                            onChange={(e) => setFechaSeleccionada(prev => ({ ...prev, mes: Number(e.target.value) }))}
                            className="bg-[#232427] border border-[#35373b] text-white text-xs font-semibold rounded-lg px-2 py-1 outline-none focus:border-[#d9a05b] transition-colors cursor-pointer"
                          >
                            {MESES.map((m, idx) => (
                              <option key={m} value={idx} className="bg-[#1a1b1e] text-white">{m}</option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => {
                              let newMes = fechaSeleccionada.mes + 1
                              let newAnio = fechaSeleccionada.anio
                              if (newMes > 11) {
                                newMes = 0
                                newAnio = Math.min(2026, newAnio + 1)
                              }
                              setFechaSeleccionada(prev => ({ ...prev, mes: newMes, anio: newAnio }))
                            }}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#232427] border border-[#35373b] text-[#9a9da3] hover:text-white hover:border-[#d9a05b] transition-colors"
                          >
                            ›
                          </button>
                        </div>

                        {/* Selector de Año */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={fechaSeleccionada.anio <= 2023}
                            onClick={() => setFechaSeleccionada(prev => ({ ...prev, anio: Math.max(2023, prev.anio - 1) }))}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#232427] border border-[#35373b] text-[#9a9da3] hover:text-white hover:border-[#d9a05b] disabled:opacity-40 transition-colors"
                          >
                            ‹
                          </button>
                          <select
                            value={fechaSeleccionada.anio}
                            onChange={(e) => setFechaSeleccionada(prev => ({ ...prev, anio: Number(e.target.value) }))}
                            className="bg-[#232427] border border-[#35373b] text-white text-xs font-bold rounded-lg px-2 py-1 outline-none focus:border-[#d9a05b] transition-colors cursor-pointer"
                          >
                            {[2023, 2024, 2025, 2026].map(yr => (
                              <option key={yr} value={yr} className="bg-[#1a1b1e] text-white">{yr}</option>
                            ))}
                          </select>
                          <button
                            type="button"
                            disabled={fechaSeleccionada.anio >= 2026}
                            onClick={() => setFechaSeleccionada(prev => ({ ...prev, anio: Math.min(2026, prev.anio + 1) }))}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#232427] border border-[#35373b] text-[#9a9da3] hover:text-white hover:border-[#d9a05b] disabled:opacity-40 transition-colors"
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
                        const firstDayIndex = (new Date(fechaSeleccionada.anio, fechaSeleccionada.mes, 1).getDay() + 6) % 7
                        const daysInMonth = new Date(fechaSeleccionada.anio, fechaSeleccionada.mes + 1, 0).getDate()

                        return (
                          <div className="grid grid-cols-7 gap-1">
                            {Array.from({ length: firstDayIndex }).map((_, i) => (
                              <div key={`empty-${i}`} className="h-8" />
                            ))}

                            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                              const isSelected = fechaSeleccionada.dia === day
                              return (
                                <button
                                  key={day}
                                  type="button"
                                  onClick={() => setFechaSeleccionada(prev => ({ ...prev, dia: day }))}
                                  className={`h-8 text-xs font-semibold rounded-lg flex items-center justify-center transition-all ${
                                    isSelected
                                      ? 'bg-[#d9a05b] text-[#1a1b1e] font-bold shadow-md shadow-[#d9a05b]/20 scale-105'
                                      : 'bg-[#1a1b1e] border border-[#35373b] text-white hover:bg-[#232427] hover:border-[#d9a05b]/40'
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
                          onClick={() => setFechaSeleccionada(prev => ({ ...prev, dia: prev.dia || 1 }))}
                          className={`flex-1 py-2 px-2 text-xs font-bold rounded-lg border transition-all ${
                            fechaSeleccionada.dia !== null
                              ? 'bg-[#d9a05b]/10 border-[#d9a05b] text-[#d9a05b]'
                              : 'bg-[#1a1b1e] border-[#35373b] text-[#9a9da3] hover:text-white hover:bg-[#232427]'
                          }`}
                        >
                          Ver solo este día
                        </button>
                        <button
                          type="button"
                          onClick={() => setFechaSeleccionada(prev => ({ ...prev, dia: null }))}
                          className={`flex-1 py-2 px-2 text-xs font-bold rounded-lg border transition-all ${
                            fechaSeleccionada.dia === null
                              ? 'bg-[#d9a05b]/10 border-[#d9a05b] text-[#d9a05b]'
                              : 'bg-[#1a1b1e] border-[#35373b] text-[#9a9da3] hover:text-white hover:bg-[#232427]'
                          }`}
                        >
                          Ver todo el mes
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Desglose por Método de Pago */}
                  <div>
                    <p className="text-xs text-[#9a9da3] uppercase tracking-wider font-semibold mb-2">Métodos de Pago</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-[#1a1b1e]/80 border border-[#35373b] p-3.5 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">💵</span>
                          <div>
                            <p className="text-xs text-[#9a9da3]">Pago en Efectivo</p>
                            <p className="text-lg font-bold text-white">${currentIngresos.efectivo.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                          </div>
                        </div>
                        <span className="text-xs font-mono text-[#9a9da3]">
                          {((currentIngresos.efectivo / currentIngresos.total) * 100).toFixed(0)}%
                        </span>
                      </div>

                      <div className="bg-[#1a1b1e]/80 border border-[#35373b] p-3.5 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">💳</span>
                          <div>
                            <p className="text-xs text-[#9a9da3]">Pago en Tarjeta</p>
                            <p className="text-lg font-bold text-white">${currentIngresos.tarjeta.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                          </div>
                        </div>
                        <span className="text-xs font-mono text-[#9a9da3]">
                          {((currentIngresos.tarjeta / currentIngresos.total) * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Desglose por Origen de Comisión */}
                  <div>
                    <p className="text-xs text-[#9a9da3] uppercase tracking-wider font-semibold mb-2">Desglose de Comisiones</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-[#1a1b1e]/80 border border-[#35373b] p-3.5 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">👤</span>
                          <div>
                            <p className="text-xs text-[#9a9da3]">Comisión del Usuario</p>
                            <p className="text-lg font-bold text-[#5bc827]">${currentIngresos.comisionUsuario.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                          </div>
                        </div>
                        <span className="text-[10px] text-[#9a9da3] bg-[#35373b]/50 px-2 py-1 rounded">Cargo servicio</span>
                      </div>

                      <div className="bg-[#1a1b1e]/80 border border-[#35373b] p-3.5 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">🏪</span>
                          <div>
                            <p className="text-xs text-[#9a9da3]">Comisión de Locales</p>
                            <p className="text-lg font-bold text-[#d9a05b]">${currentIngresos.comisionLocales.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                          </div>
                        </div>
                        <span className="text-[10px] text-[#9a9da3] bg-[#35373b]/50 px-2 py-1 rounded">% por venta</span>
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'usuarios' && (
          <div>
            <Title text="Usuarios" />
            <div className="space-y-3">
              {usuarios.map((u) => (
                <div key={u.id} className="bg-[#232427] border border-[#35373b] hover:border-[#d9a05b]/50 p-4 rounded-xl flex items-center justify-between transition-colors">
                  <div>
                    <p className="font-bold text-sm text-white">{u.name}</p>
                    <p className="text-[#9a9da3] text-xs">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`${u.status === 'Activo' ? 'text-[#5bc827] bg-[#5bc827]/10' : 'text-red-400 bg-red-400/10'} text-[10px] uppercase font-bold px-2 py-1 rounded`}>{u.status}</span>
                    <button 
                      onClick={() => setSelectedUsuario(u)}
                      className="text-xs font-semibold bg-[#35373b] hover:bg-[#d9a05b] hover:text-[#1a1b1e] text-white px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      Ver
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'locales' && (
          <div>
            <Title text="Locales y Restaurantes" />
            <div className="space-y-3">
              {[
                { name: 'Taquería El Gordo', status: 'Activo', statusColor: 'text-[#5bc827]', bg: 'bg-[#5bc827]/10' },
                { name: 'Sushi Nuevo', status: 'Pendiente', statusColor: 'text-[#d9a05b]', bg: 'bg-[#d9a05b]/10' },
              ].map((l, i) => (
                <div key={i} className="bg-[#232427] border border-[#35373b] hover:border-[#d9a05b]/50 p-4 rounded-xl flex items-center justify-between transition-colors">
                  <p className="font-bold text-sm text-white">{l.name}</p>
                  <div className="flex items-center gap-3">
                    <span className={`${l.statusColor} ${l.bg} text-[10px] uppercase font-bold px-2 py-1 rounded`}>{l.status}</span>
                    {l.status === 'Pendiente' ? (
                      <button className="text-xs font-semibold bg-[#d9a05b] hover:bg-[#e0b07a] text-[#1a1b1e] px-3 py-1.5 rounded-lg transition-colors">Aprobar</button>
                    ) : (
                      <button className="text-xs bg-[#35373b] hover:bg-[#5bc827] hover:text-[#1a1b1e] text-white px-3 py-1.5 rounded-lg transition-colors">Ver</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'repartidores' && (
          <div>
            <Title text="Repartidores Activos" />
            <div className="space-y-3">
              {[
                { name: 'Carlos R.', mat: 'REP-451234', rating: '4.9', status: 'Activo' },
                { name: 'Ana López', mat: 'REP-883192', rating: '4.7', status: 'Activo' },
              ].map((r, i) => (
                <div key={i} className="bg-[#232427] border border-[#35373b] hover:border-[#d9a05b]/50 p-4 rounded-xl flex items-center justify-between transition-colors">
                  <div>
                    <p className="font-bold text-sm text-white">{r.name} <span className="text-[#d9a05b] ml-1">★ {r.rating}</span></p>
                    <p className="text-[#9a9da3] text-xs font-mono mt-0.5">{r.mat}</p>
                  </div>
                  <button className="text-[10px] font-bold uppercase text-red-400 hover:text-red-300 hover:underline">Suspender</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'pedidos' && (
          <div>
            <Title text="Visión global de pedidos" />
            <div className="space-y-3">
              <div className="bg-[#232427] border border-[#35373b] hover:border-[#d9a05b]/50 transition-colors p-4 rounded-xl relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#5bc827]"></div>
                <div className="flex justify-between items-center mb-3 pl-2">
                  <p className="font-bold text-lg text-[#d9a05b]" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>#ORD-9921</p>
                  <span className="text-[#5bc827] text-[10px] uppercase font-bold bg-[#5bc827]/10 px-2 py-1 rounded">En camino</span>
                </div>
                <div className="pl-2 space-y-1">
                  <p className="text-[#c4c6ca] text-xs"><span className="text-[#9a9da3] mr-1">Local:</span> Burger King</p>
                  <p className="text-[#c4c6ca] text-xs"><span className="text-[#9a9da3] mr-1">Repartidor:</span> Carlos R.</p>
                  <p className="text-[#c4c6ca] text-xs"><span className="text-[#9a9da3] mr-1">Cliente:</span> Juan Sierra</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'config' && (
          <div>
            <Title text="Comisiones y Ajustes" />
            
            <div className="space-y-4">
              <div className="bg-[#232427] border border-[#35373b] p-5 rounded-2xl">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">🏪</span>
                  <div>
                    <h3 className="font-bold text-white">Comisión del local</h3>
                    <p className="text-[#9a9da3] text-xs">Porcentaje que se cobra al restaurante por venta.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    value={comisionLocal} 
                    onChange={e => setComisionLocal(Number(e.target.value))} 
                    className="w-full bg-[#1a1b1e] border border-[#35373b] focus:border-[#d9a05b] rounded-xl px-4 py-3 text-sm text-white outline-none transition-colors" 
                  />
                  <span className="text-[#c4c6ca] font-bold">%</span>
                </div>
                <p className="text-[#9a9da3] text-[10px] mt-2">Valor actual: {comisionLocal}%</p>
              </div>

              <div className="bg-[#232427] border border-[#35373b] p-5 rounded-2xl">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">🏍️</span>
                  <div>
                    <h3 className="font-bold text-white">Comisión al repartidor</h3>
                    <p className="text-[#9a9da3] text-xs">Monto fijo que se paga al repartidor por entrega.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#c4c6ca] font-bold">$</span>
                  <input 
                    type="number" 
                    value={comisionRepartidor} 
                    onChange={e => setComisionRepartidor(Number(e.target.value))} 
                    className="w-full bg-[#1a1b1e] border border-[#35373b] focus:border-[#d9a05b] rounded-xl px-4 py-3 text-sm text-white outline-none transition-colors" 
                  />
                </div>
                <p className="text-[#9a9da3] text-[10px] mt-2">Valor actual: ${comisionRepartidor}</p>
              </div>

              <div className="bg-[#232427] border border-[#35373b] p-5 rounded-2xl">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">👤</span>
                  <div>
                    <h3 className="font-bold text-white">Comisión al usuario</h3>
                    <p className="text-[#9a9da3] text-xs">Monto fijo cobrado como cargo por servicio.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#c4c6ca] font-bold">$</span>
                  <input 
                    type="number" 
                    value={comisionUsuario} 
                    onChange={e => setComisionUsuario(Number(e.target.value))} 
                    className="w-full bg-[#1a1b1e] border border-[#35373b] focus:border-[#d9a05b] rounded-xl px-4 py-3 text-sm text-white outline-none transition-colors" 
                  />
                </div>
                <p className="text-[#9a9da3] text-[10px] mt-2">Valor actual: ${comisionUsuario}</p>
              </div>

              {/* Zonas de cobertura */}
              <div className="bg-[#232427] p-5 rounded-2xl border border-[#35373b] mt-5">
                <label className="text-[#c4c6ca] text-xs font-semibold block mb-3">Zonas de cobertura activas</label>
                <div className="flex gap-2 flex-wrap">
                  <span className="bg-[#d9a05b]/20 border border-[#d9a05b]/50 text-[#d9a05b] px-3 py-1.5 rounded-full text-xs font-bold">Norte</span>
                  <span className="bg-[#d9a05b]/20 border border-[#d9a05b]/50 text-[#d9a05b] px-3 py-1.5 rounded-full text-xs font-bold">Centro</span>
                  <button className="border border-dashed border-[#9a9da3] text-[#9a9da3] px-3 py-1.5 rounded-full text-xs hover:border-[#d9a05b] hover:text-[#d9a05b] transition-colors">+ Añadir zona</button>
                </div>
              </div>

              <div className="bg-[#1a1b1e] border border-[#35373b] p-4 rounded-xl mt-5">
                <p className="text-xs text-[#9a9da3] leading-relaxed">
                  <span className="text-[#d9a05b] font-bold">Simulación:</span> En un pedido de $200, el local recibe ${(200 * (1 - comisionLocal/100)).toFixed(2)}, el repartidor ${comisionRepartidor}, la plataforma cobra ${comisionUsuario} al usuario y se queda con ${(200 * (comisionLocal/100) + comisionUsuario - comisionRepartidor).toFixed(2)} de comisión total.
                </p>
              </div>

              <button 
                onClick={handleSaveConfig} 
                className="w-full py-4 rounded-xl bg-gradient-to-r from-[#d9a05b] to-[#b38346] shadow-lg shadow-[#d9a05b]/20 text-[#1a1b1e] font-bold text-sm mt-5 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {showToast ? 'Cambios guardados ✓' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Tabs / Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#1a1b1e]/95 backdrop-blur-sm border-t border-[#35373b] flex overflow-x-auto z-50 py-2 px-2 sm:justify-center gap-1 sm:gap-6 hide-scrollbar">
        {navItems.map(item => (
          <button key={item.id} onClick={() => setActiveTab(item.id)}
            className={`flex-shrink-0 flex flex-col items-center gap-1 px-3 py-1.5 transition-all min-w-[70px] ${activeTab === item.id ? 'text-[#d9a05b]' : 'text-[#9a9da3] hover:text-[#c4c6ca]'}`}>
            <span className={`text-xl ${activeTab === item.id ? 'scale-110' : ''} transition-transform`}>{item.icon}</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider">{item.label}</span>
            {activeTab === item.id && <span className="w-1 h-1 rounded-full bg-[#d9a05b] mt-0.5 absolute bottom-1" />}
          </button>
        ))}
      </nav>
      
      {/* Estilos adicionales */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.25s ease-out forwards;
        }
      `}</style>
    </div>
  )
}

const InfoRow = ({ label, value }: { label: string, value: string }) => (
  <div className="flex justify-between text-sm">
    <span className="text-[#9a9da3]">{label}</span>
    <span className="text-white font-medium">{value}</span>
  </div>
)

/**
 * Componente de tarjeta para mostrar estadísticas en el Dashboard.
 * Permite hacer clic para navegar a la pestaña correspondiente.
 */
function StatCard({ 
  label, 
  value, 
  icon, 
  onClick 
}: { 
  label: string
  value: string
  icon: string
  onClick?: () => void 
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-[#232427] border border-[#35373b] hover:border-[#d9a05b]/60 hover:bg-[#2a2c30] p-3 rounded-xl flex items-center gap-3 text-left w-full transition-all active:scale-[0.98] cursor-pointer group"
    >
      <div className="text-2xl group-hover:scale-110 transition-transform">{icon}</div>
      <div>
        <p className="text-white font-bold text-lg leading-tight">{value}</p>
        <p className="text-[#9a9da3] group-hover:text-[#c4c6ca] text-[10px] uppercase tracking-widest transition-colors">{label}</p>
      </div>
    </button>
  )
}
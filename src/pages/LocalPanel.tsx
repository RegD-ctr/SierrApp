import { useState, useRef, useEffect } from 'react'
import logoImg from '@/imports/logo.jpeg'
import LocalOrderDetail from '@/components/LocalOrderDetail'
import { api, getImageUrl } from '@/lib/api'
import { getSocket } from '@/lib/socket'
import { playOrderAlertSound } from '@/lib/sound'

type Role = 'usuario' | 'local' | 'repartidor'
type Filter = 'todos' | 'disponibles' | 'agotados'
type LocalView = 'dashboard' | 'platillos' | 'pedidos' | 'perfil'

interface Platillo {
  id: string
  nombre: string
  descripcion: string
  categoria: string
  precio: string | number
  imagen: string | null
  disponible: boolean
}

interface RestaurantMe {
  id: string
  nombre: string
  categoria: string
  rating: number
  reviews: number
  tiempoEntrega: string
  deliveryFeeTexto: string
  deliveryFee: number
  coverImg: string | null
  badge: string | null
  direccion: string
  isOpen: boolean
  status: string
  createdAt: string
  dishes?: {
    id: string
    nombre: string
    descripcion: string
    categoria: string
    precio: number
    imagen: string | null
    disponible: boolean
    optionGroups?: any[]
  }[]
}

interface OrderItem {
  id: string
  orderId: string
  dishId: string
  nombreSnapshot: string
  precioSnapshot: number
  cantidad: number
  subtotal: number
  notas?: string | null
  extrasTotal: number
}

interface OrderFromBackend {
  id: string
  restaurantId: string
  userId: string
  addressId: string
  driverId: string | null
  estado: 'PENDIENTE' | 'ACEPTADO' | 'LISTO' | 'REPARTIDOR_ASIGNADO' | 'RECOGIDO' | 'EN_CAMINO' | 'ENTREGADO' | 'CANCELADO' | 'RECHAZADO'
  subtotal: number
  deliveryFee: number
  total: number
  metodoPago: string
  instrucciones?: string | null
  createdAt: string
  items: OrderItem[]
  user?: {
    nombre: string
    telefono: string
  }
}

const categorias = ['Entradas', 'Platos fuertes', 'Postres', 'Bebidas', 'Combos', 'Ensaladas', 'Tacos', 'Pizzas', 'Burgers', 'Otro']

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
  return { total: 0, pedidos: 0, ticketPromedio: 0, efectivo: 0, tarjeta: 0, comisionPlataforma: 0, netoRecibido: 0 }
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
    total: 0,
    pedidos: 0,
    ticketPromedio: 0,
    efectivo: 0,
    tarjeta: 0,
    comisionPlataforma: 0,
    netoRecibido: 0,
  },
  semana: {
    total: 0,
    pedidos: 0,
    ticketPromedio: 0,
    efectivo: 0,
    tarjeta: 0,
    comisionPlataforma: 0,
    netoRecibido: 0,
  },
  mes: {
    total: 0,
    pedidos: 0,
    ticketPromedio: 0,
    efectivo: 0,
    tarjeta: 0,
    comisionPlataforma: 0,
    netoRecibido: 0,
  },
  anio: {
    total: 0,
    pedidos: 0,
    ticketPromedio: 0,
    efectivo: 0,
    tarjeta: 0,
    comisionPlataforma: 0,
    netoRecibido: 0,
  },
}

function getOrderStatusDisplay(estado: string) {
  switch (estado) {
    case 'PENDIENTE':
      return { status: 'Nuevo pedido', statusColor: 'bg-yellow-900/40 text-yellow-400 border border-yellow-800/40' }
    case 'ACEPTADO':
      return { status: 'Preparando', statusColor: 'bg-blue-900/30 text-blue-400 border border-blue-800/40' }
    case 'LISTO':
      return { status: 'Listo para recoger', statusColor: 'bg-[#5bc827]/20 text-[#5bc827] border border-[#5bc827]/40' }
    case 'REPARTIDOR_ASIGNADO':
      return { status: 'Repartidor asignado', statusColor: 'bg-indigo-900/30 text-indigo-400 border border-indigo-800/40' }
    case 'RECOGIDO':
    case 'EN_CAMINO':
      return { status: 'En camino', statusColor: 'bg-teal-900/30 text-teal-400 border border-teal-800/40' }
    case 'ENTREGADO':
      return { status: 'Entregado', statusColor: 'bg-[#5bc827]/20 text-[#5bc827]' }
    case 'RECHAZADO':
      return { status: 'Rechazado', statusColor: 'bg-red-900/30 text-red-400 border border-red-800/40' }
    case 'CANCELADO':
      return { status: 'Cancelado', statusColor: 'bg-neutral-800 text-neutral-400' }
    default:
      return { status: estado, statusColor: 'bg-neutral-800 text-neutral-400' }
  }
}

/**
 * Componente del panel de control para un Local (Restaurante).
 * Permite gestionar el dashboard, editar/crear platillos, y manejar órdenes entrantes.
 */
export default function LocalPanel({ onLogout }: Props) {
  const [view, setView] = useState<LocalView>('dashboard')
  const [restaurant, setRestaurant] = useState<RestaurantMe | null>(null)
  const [loadingRestaurant, setLoadingRestaurant] = useState(true)
  const [platillos, setPlatillos] = useState<Platillo[]>([])
  const [filter, setFilter] = useState<Filter>('todos')
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [confirmSoldOut, setConfirmSoldOut] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<OrderFromBackend | null>(null)

  // Estado para estado abierto/cerrado del local y su modal de confirmación
  const [localAbierto, setLocalAbierto] = useState(true)
  const [showConfirmToggle, setShowConfirmToggle] = useState(false)
  const [togglingOpen, setTogglingOpen] = useState(false)

  // Pedidos reales del backend
  const [orders, setOrders] = useState<OrderFromBackend[]>([])
  const [orderFilter, setOrderFilter] = useState<'activos' | 'todos'>('activos')
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  // Estado para desplegable de resumen de ventas
  const [showVentasDetails, setShowVentasDetails] = useState(false)
  const [selectedVentasTimeframe, setSelectedVentasTimeframe] = useState<VentasTimeframe>('mes')
  const [fechaVentasSeleccionada, setFechaVentasSeleccionada] = useState<{ dia: number | null, mes: number, anio: number }>({ 
    dia: null, mes: new Date().getMonth(), anio: new Date().getFullYear() 
  })

  // Formulario de platillos
  const emptyForm = { nombre: '', descripcion: '', categoria: categorias[0], precio: '', imagen: null as string | null, disponible: true }
  const [form, setForm] = useState(emptyForm)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [savingDish, setSavingDish] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Modal para editar perfil de restaurante
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [profileForm, setProfileForm] = useState({
    nombre: '',
    categoria: '',
    tiempoEntrega: '',
    deliveryFee: '0',
    direccion: '',
    coverImg: null as string | null,
  })
  const [selectedCoverFile, setSelectedCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const coverRef = useRef<HTMLInputElement>(null)

  // Carga inicial del restaurante propio y de pedidos
  const loadRestaurant = async () => {
    try {
      setLoadingRestaurant(true)
      const data = await api.get<RestaurantMe>('/api/restaurants/me/restaurant')
      setRestaurant(data)
      setLocalAbierto(data.isOpen)
      if (data.dishes) {
        setPlatillos(data.dishes.map(d => ({
          id: d.id,
          nombre: d.nombre,
          descripcion: d.descripcion,
          categoria: d.categoria,
          precio: d.precio,
          imagen: d.imagen,
          disponible: d.disponible,
        })))
      }
    } catch (err: any) {
      console.error('Error cargando restaurante:', err)
    } finally {
      setLoadingRestaurant(false)
    }
  }

  const loadOrders = async () => {
    try {
      const data = await api.get<OrderFromBackend[]>('/api/orders/restaurant')
      setOrders(data)
    } catch (err: any) {
      console.error('Error cargando órdenes:', err)
    }
  }

  const [orderAlertBanner, setOrderAlertBanner] = useState<string | null>(null)

  const showOrderBanner = (msg: string) => {
    setOrderAlertBanner(msg)
    setTimeout(() => setOrderAlertBanner(null), 5000)
  }

  useEffect(() => {
    loadRestaurant()
    loadOrders()
    const timer = setInterval(loadOrders, 10000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const socket = getSocket()
    if (!socket) return

    const handleNewOrder = () => {
      playOrderAlertSound()
      showOrderBanner('🔔 ¡Nuevo pedido recibido!')
      loadOrders()
    }

    socket.on('order:new', handleNewOrder)
    return () => {
      socket.off('order:new', handleNewOrder)
    }
  }, [])

  const filtered = platillos.filter(p =>
    filter === 'todos' ? true : filter === 'disponibles' ? p.disponible : !p.disponible
  )

  const currentVentas = selectedVentasTimeframe === 'personalizado' 
    ? generarVentasPorFecha(fechaVentasSeleccionada.dia, fechaVentasSeleccionada.mes, fechaVentasSeleccionada.anio)
    : DATA_VENTAS[selectedVentasTimeframe as Exclude<VentasTimeframe, 'personalizado'>]

  const activeOrdersCount = orders.filter(o => ['PENDIENTE', 'ACEPTADO', 'LISTO'].includes(o.estado)).length
  const activeDishesCount = platillos.filter(p => p.disponible).length

  const statsData = [
    { label: 'Pedidos activos', value: `${activeOrdersCount}`, icon: '📦', trend: null },
    { label: 'Platillos activos', value: `${activeDishesCount}`, icon: '🍽️', trend: null },
    { label: 'Rating promedio', value: restaurant?.rating ? `${restaurant.rating}` : '—', icon: '⭐', trend: null },
  ]

  // Handlers para abrir/cerrar local
  const handleToggleOpen = async () => {
    setTogglingOpen(true)
    try {
      const updated = await api.patch<RestaurantMe>('/api/restaurants/me/restaurant/estado', {
        isOpen: !localAbierto
      })
      setLocalAbierto(updated.isOpen)
      setRestaurant(prev => prev ? { ...prev, isOpen: updated.isOpen } : null)
      setShowConfirmToggle(false)
    } catch (err: any) {
      alert(err?.message || 'Error al cambiar estado del local')
    } finally {
      setTogglingOpen(false)
    }
  }

  // Handlers para agregar / editar platillos
  const openAdd = () => { 
    setForm(emptyForm)
    setSelectedFile(null)
    setImagePreview(null)
    setFormError(null)
    setEditId(null)
    setShowForm(true) 
  }

  const openEdit = (p: Platillo) => {
    setForm({ 
      nombre: p.nombre, 
      descripcion: p.descripcion, 
      categoria: p.categoria, 
      precio: String(p.precio), 
      imagen: p.imagen, 
      disponible: p.disponible 
    })
    setSelectedFile(null)
    setImagePreview(null)
    setFormError(null)
    setEditId(p.id)
    setShowForm(true)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedFile(file)
    setImagePreview(URL.createObjectURL(file))
    setFormError(null)
  }

  const handleSaveDish = async () => {
    setFormError(null)
    if (!form.nombre.trim()) {
      setFormError('El nombre del platillo es obligatorio.')
      return
    }
    const numPrecio = parseFloat(String(form.precio))
    if (isNaN(numPrecio) || numPrecio <= 0) {
      setFormError('El precio debe ser un número mayor a 0.')
      return
    }
    if (numPrecio > 50000) {
      setFormError('El precio no puede exceder $50,000.')
      return
    }

    setSavingDish(true)
    try {
      let finalImagePath: string | null = form.imagen
      if (selectedFile) {
        const fd = new FormData()
        fd.append('file', selectedFile)
        const uploadRes = await api.upload<{ path: string }>('/api/uploads/image', fd)
        finalImagePath = uploadRes.path
      }

      if (editId !== null) {
        const payload: any = {
          nombre: form.nombre.trim(),
          descripcion: form.descripcion.trim(),
          categoria: form.categoria.trim(),
          precio: numPrecio,
          disponible: form.disponible,
        }
        if (finalImagePath && finalImagePath.startsWith('/uploads/')) {
          payload.imagen = finalImagePath
        }
        await api.patch(`/api/restaurants/me/dishes/${editId}`, payload)
      } else {
        const payload: any = {
          nombre: form.nombre.trim(),
          descripcion: form.descripcion.trim(),
          categoria: form.categoria.trim(),
          precio: numPrecio,
        }
        if (finalImagePath && finalImagePath.startsWith('/uploads/')) {
          payload.imagen = finalImagePath
        }
        await api.post('/api/restaurants/me/dishes', payload)
      }

      await loadRestaurant()
      setShowForm(false)
      setEditId(null)
    } catch (err: any) {
      setFormError(err?.message || 'Error al guardar el platillo')
    } finally {
      setSavingDish(false)
    }
  }

  const toggleDisponible = async (id: string, nuevoDisponible?: boolean) => {
    const target = platillos.find(p => p.id === id)
    if (!target) return
    const valor = nuevoDisponible !== undefined ? nuevoDisponible : !target.disponible
    try {
      await api.patch(`/api/restaurants/me/dishes/${id}`, { disponible: valor })
      setPlatillos(ps => ps.map(p => p.id === id ? { ...p, disponible: valor } : p))
      setConfirmSoldOut(null)
    } catch (err: any) {
      alert(err?.message || 'Error al cambiar disponibilidad del platillo')
    }
  }

  const handleDeleteDish = async (dishId: string) => {
    try {
      await api.delete(`/api/restaurants/me/dishes/${dishId}`)
      setPlatillos(ps => ps.filter(p => p.id !== dishId))
      setConfirmDeleteId(null)
      if (showForm && editId === dishId) {
        setShowForm(false)
        setEditId(null)
      }
    } catch (err: any) {
      alert(err?.message || 'Error al eliminar el platillo')
    }
  }

  // Handlers para pedidos
  const handleAcceptOrder = async (orderId: string) => {
    setActionLoadingId(orderId)
    try {
      await api.patch(`/api/orders/${orderId}/accept`)
      await loadOrders()
    } catch (err: any) {
      alert(err?.message || 'Error al aceptar el pedido')
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleRejectOrder = async (orderId: string) => {
    setActionLoadingId(orderId)
    try {
      await api.patch(`/api/orders/${orderId}/reject`)
      await loadOrders()
    } catch (err: any) {
      alert(err?.message || 'Error al rechazar el pedido')
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleReadyOrder = async (orderId: string) => {
    setActionLoadingId(orderId)
    try {
      await api.patch(`/api/orders/${orderId}/ready`)
      await loadOrders()
    } catch (err: any) {
      alert(err?.message || 'Error al marcar como listo')
    } finally {
      setActionLoadingId(null)
    }
  }

  // Handlers para editar perfil del restaurante
  const openEditProfile = () => {
    if (!restaurant) return
    setProfileForm({
      nombre: restaurant.nombre,
      categoria: restaurant.categoria,
      tiempoEntrega: restaurant.tiempoEntrega,
      deliveryFee: String(restaurant.deliveryFee),
      direccion: restaurant.direccion,
      coverImg: restaurant.coverImg,
    })
    setSelectedCoverFile(null)
    setCoverPreview(null)
    setProfileError(null)
    setShowEditProfile(true)
  }

  const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedCoverFile(file)
    setCoverPreview(URL.createObjectURL(file))
    setProfileError(null)
  }

  const handleSaveProfile = async () => {
    setProfileError(null)
    if (!profileForm.nombre.trim()) {
      setProfileError('El nombre del negocio es obligatorio.')
      return
    }
    const numFee = parseFloat(profileForm.deliveryFee)
    if (isNaN(numFee) || numFee < 0) {
      setProfileError('El costo de envío debe ser un número válido.')
      return
    }

    setSavingProfile(true)
    try {
      let coverPath = profileForm.coverImg
      if (selectedCoverFile) {
        const fd = new FormData()
        fd.append('file', selectedCoverFile)
        const res = await api.upload<{ path: string }>('/api/uploads/image', fd)
        coverPath = res.path
      }

      const payload: any = {
        nombre: profileForm.nombre.trim(),
        categoria: profileForm.categoria.trim(),
        tiempoEntrega: profileForm.tiempoEntrega.trim(),
        deliveryFee: numFee,
        deliveryFeeTexto: numFee === 0 ? 'Envío gratis' : `$${numFee} de envío`,
        direccion: profileForm.direccion.trim(),
      }
      if (coverPath && coverPath.startsWith('/uploads/')) {
        payload.coverImg = coverPath
      }

      const updated = await api.patch<RestaurantMe>('/api/restaurants/me/restaurant', payload)
      setRestaurant(prev => prev ? { ...prev, ...updated } : updated)
      setShowEditProfile(false)
    } catch (err: any) {
      setProfileError(err?.message || 'Error al actualizar el perfil')
    } finally {
      setSavingProfile(false)
    }
  }

  const navItems: { icon: string; label: string; view: LocalView }[] = [
    { icon: '📊', label: 'Panel', view: 'dashboard' },
    { icon: '🍽️', label: 'Platillos', view: 'platillos' },
    { icon: '📦', label: 'Pedidos', view: 'pedidos' },
    { icon: '👤', label: 'Perfil', view: 'perfil' },
  ]

  // Renderizar detalle de pedido con datos reales de items
  if (selectedOrder) {
    return (
      <LocalOrderDetail 
        orden={{
          id: selectedOrder.id.slice(0, 8),
          cliente: selectedOrder.user?.nombre || 'Cliente',
          hora: new Date(selectedOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          estado: selectedOrder.estado === 'PENDIENTE' ? 'pendiente' : selectedOrder.estado === 'ACEPTADO' ? 'preparando' : 'listo',
          productos: selectedOrder.items.map((i: OrderItem) => ({
            nombre: i.nombreSnapshot + (i.notas ? ` (${i.notas})` : ''),
            cantidad: i.cantidad,
          })),
          total: `$${Number(selectedOrder.total).toFixed(2)}`
        }}
        onAceptar={async () => {
          if (selectedOrder.estado === 'PENDIENTE') {
            await handleAcceptOrder(selectedOrder.id)
          } else if (selectedOrder.estado === 'ACEPTADO') {
            await handleReadyOrder(selectedOrder.id)
          }
          setSelectedOrder(null)
        }}
        onRechazar={async () => {
          await handleRejectOrder(selectedOrder.id)
          setSelectedOrder(null)
        }}
        onBack={() => setSelectedOrder(null)}
      />
    )
  }

  const displayedOrders = orderFilter === 'activos'
    ? orders.filter(o => ['PENDIENTE', 'ACEPTADO', 'LISTO'].includes(o.estado))
    : orders

  return (
    <div className="min-h-screen bg-[#1a1b1e] text-white">
      {orderAlertBanner && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#5bc827] text-[#1a1b1e] font-bold text-sm px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 border border-white/30 animate-bounce">
          <span>🔔</span> {orderAlertBanner}
        </div>
      )}

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
            <button
              onClick={() => setShowConfirmToggle(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#232427] border border-[#35373b] hover:border-[#5bc827]/50 transition-colors cursor-pointer"
            >
              <div className={`w-2 h-2 rounded-full ${localAbierto ? 'bg-[#5bc827] animate-pulse' : 'bg-red-500'}`} />
              <span className={`text-xs font-semibold ${localAbierto ? 'text-[#5bc827]' : 'text-red-400'}`}>
                {localAbierto ? 'Abierto' : 'Cerrado'}
              </span>
            </button>
            <span className="text-[#35373b] mx-1">|</span>
            <span className="text-[#9a9da3] text-xs font-medium truncate max-w-[150px]">
              {restaurant?.nombre || 'Mi Restaurante'}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 pb-28">

        {/* DASHBOARD */}
        {view === 'dashboard' && (
          <div className="pt-5">
            <h1 className="text-3xl font-bold text-white uppercase mb-1" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
              ¡Buen día! 👋
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
                          {currentVentas.total > 0 ? ((currentVentas.efectivo / currentVentas.total) * 100).toFixed(0) : '0'}%
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
                          {currentVentas.total > 0 ? ((currentVentas.tarjeta / currentVentas.total) * 100).toFixed(0) : '0'}%
                        </span>
                      </div>
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
                <h3 className="text-sm font-bold text-white">{activeOrdersCount} pedidos activos</h3>
              </div>
              {activeOrdersCount === 0 ? (
                <p className="text-[#9a9da3] text-xs text-center py-4">No hay pedidos activos</p>
              ) : (
                orders
                  .filter(o => ['PENDIENTE', 'ACEPTADO', 'LISTO'].includes(o.estado))
                  .map(p => {
                    const display = getOrderStatusDisplay(p.estado)
                    return (
                      <div 
                        key={p.id} 
                        onClick={() => setSelectedOrder(p)}
                        className="flex items-center justify-between py-2.5 border-b border-[#35373b] last:border-0 cursor-pointer hover:bg-[#1a1b1e]/60 transition-colors rounded-lg px-2 group"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#5bc827] group-hover:underline">#{p.id.slice(0, 8)}</span>
                            <span className="text-white text-xs font-semibold">{p.user?.nombre || 'Cliente'}</span>
                          </div>
                          <p className="text-[#9a9da3] text-[10px]">{p.items.map(it => `${it.nombreSnapshot} x${it.cantidad}`).join(', ')}</p>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${display.statusColor}`}>
                          {display.status}
                        </span>
                      </div>
                    )
                  })
              )}
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
                    onToggle={() => p.disponible ? setConfirmSoldOut(p.id) : toggleDisponible(p.id, true)}
                    onDelete={() => setConfirmDeleteId(p.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* PEDIDOS */}
        {view === 'pedidos' && (
          <div className="pt-5">
            <div className="flex items-center justify-between mb-5">
              <h1 className="text-3xl font-bold text-white uppercase" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                Pedidos
              </h1>
              <div className="flex items-center gap-2">
                <button
                  onClick={loadOrders}
                  title="Refrescar pedidos"
                  className="p-2 rounded-xl bg-[#232427] border border-[#35373b] hover:border-[#5bc827] text-[#9a9da3] hover:text-white transition-colors cursor-pointer text-xs flex items-center gap-1"
                >
                  🔄 <span className="hidden sm:inline">Refrescar</span>
                </button>
                <div className="flex bg-[#232427] rounded-full p-1 gap-1">
                  <button
                    onClick={() => setOrderFilter('activos')}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      orderFilter === 'activos' ? 'bg-[#5bc827] text-[#1a1b1e]' : 'text-[#9a9da3] hover:text-white'
                    }`}
                  >
                    Activos ({activeOrdersCount})
                  </button>
                  <button
                    onClick={() => setOrderFilter('todos')}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      orderFilter === 'todos' ? 'bg-[#5bc827] text-[#1a1b1e]' : 'text-[#9a9da3] hover:text-white'
                    }`}
                  >
                    Todos ({orders.length})
                  </button>
                </div>
              </div>
            </div>

            {displayedOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <span className="text-5xl mb-3">📦</span>
                <p className="text-white font-semibold">
                  {orderFilter === 'activos' ? 'No hay pedidos activos' : 'No hay pedidos registrados'}
                </p>
                <p className="text-[#9a9da3] text-sm mt-1">
                  {orderFilter === 'activos' ? 'Los pedidos entrantes aparecerán aquí' : 'Los pedidos de clientes aparecerán aquí'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {displayedOrders.map(order => {
                  const display = getOrderStatusDisplay(order.estado)
                  const itemsText = order.items.map(it => `${it.nombreSnapshot} x${it.cantidad}`).join(' · ')
                  const hora = new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  const isActionLoading = actionLoadingId === order.id

                  return (
                    <div
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className="bg-[#232427] border border-[#35373b] rounded-2xl p-4 cursor-pointer hover:border-[#5bc827]/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <span className="text-[#5bc827] text-sm font-bold">#{order.id.slice(0, 8)}</span>
                          <p className="text-white text-xs font-semibold">{order.user?.nombre || 'Cliente'}</p>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${display.statusColor}`}>
                          {display.status}
                        </span>
                      </div>
                      <p className="text-[#9a9da3] text-xs mb-2 line-clamp-1">{itemsText}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-[#9a9da3]">⏱ {hora}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[#5bc827] font-bold text-sm">${Number(order.total).toFixed(2)}</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedOrder(order) }}
                            className="bg-[#5bc827] hover:bg-[#7ed944] text-[#1a1b1e] text-xs font-bold px-3 py-1 rounded-full transition-colors cursor-pointer"
                          >
                            Ver
                          </button>
                        </div>
                      </div>

                      {/* Botones de acción directa en tarjeta */}
                      {order.estado === 'PENDIENTE' && (
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#35373b]">
                          <button
                            disabled={isActionLoading}
                            onClick={(e) => { e.stopPropagation(); handleRejectOrder(order.id) }}
                            className="flex-1 py-1.5 px-3 rounded-lg border border-red-800/60 text-red-400 text-xs font-bold hover:bg-red-900/30 transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            {isActionLoading ? '...' : 'Rechazar'}
                          </button>
                          <button
                            disabled={isActionLoading}
                            onClick={(e) => { e.stopPropagation(); handleAcceptOrder(order.id) }}
                            className="flex-1 py-1.5 px-3 rounded-lg bg-[#5bc827] hover:bg-[#7ed944] text-[#1a1b1e] text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                          >
                            {isActionLoading ? '...' : 'Aceptar'}
                          </button>
                        </div>
                      )}

                      {order.estado === 'ACEPTADO' && (
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#35373b]">
                          <button
                            disabled={isActionLoading}
                            onClick={(e) => { e.stopPropagation(); handleReadyOrder(order.id) }}
                            className="w-full py-1.5 px-3 rounded-lg bg-[#5bc827] hover:bg-[#7ed944] text-[#1a1b1e] text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                          >
                            {isActionLoading ? '...' : 'Listo para recoger'}
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

        {/* PERFIL */}
        {view === 'perfil' && (
          <div className="pt-5">
            <h1 className="text-3xl font-bold text-white uppercase mb-5" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Mi Negocio</h1>
            
            <div className="bg-[#232427] border border-[#35373b] rounded-2xl p-5 mb-4 flex items-center gap-4">
              <div className="w-16 h-16 bg-[#5bc827]/20 border-2 border-[#5bc827] rounded-2xl flex items-center justify-center text-2xl overflow-hidden shrink-0">
                {restaurant?.coverImg ? (
                  <img src={getImageUrl(restaurant.coverImg)} alt={restaurant.nombre} className="w-full h-full object-cover" />
                ) : (
                  '🏪'
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-white font-bold text-lg truncate">{restaurant?.nombre || 'Mi Restaurante'}</h2>
                <p className="text-[#9a9da3] text-xs">{restaurant?.categoria || 'Comida'}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${localAbierto ? 'bg-[#5bc827]' : 'bg-red-500'}`} />
                    <span className={`text-[10px] font-bold ${localAbierto ? 'text-[#5bc827]' : 'text-red-400'}`}>
                      {localAbierto ? 'Abierto' : 'Cerrado'}
                    </span>
                  </div>
                  <span className="text-[#35373b]">•</span>
                  <span className="text-[#5bc827] text-[10px] font-bold">Verificado</span>
                </div>
              </div>
            </div>

            <button
              onClick={openEditProfile}
              className="w-full py-2.5 rounded-xl border border-[#35373b] hover:border-[#5bc827] text-white text-xs font-semibold mb-4 transition-colors flex items-center justify-center gap-2 cursor-pointer bg-[#232427]"
            >
              ✏️ Editar datos del negocio
            </button>

            {[
              { icon: '⏰', label: 'Tiempo de entrega', sub: restaurant?.tiempoEntrega || '25-35 min' },
              { icon: '🛵', label: 'Costo de envío', sub: restaurant?.deliveryFeeTexto || '$25 de envío' },
              { icon: '📍', label: 'Dirección', sub: restaurant?.direccion || 'Sin dirección registrada' },
              { icon: '⭐', label: 'Calificación', sub: restaurant?.rating ? `${restaurant.rating} (${restaurant.reviews} reseñas)` : 'Sin reseñas' },
            ].map(item => (
              <div key={item.label} className="w-full flex items-center gap-3 px-3 py-3.5 rounded-xl bg-[#232427]/50 border border-[#35373b]/40 mb-2">
                <span className="text-xl w-7 text-center">{item.icon}</span>
                <div className="flex-1">
                  <p className="text-sm text-white font-medium">{item.label}</p>
                  <p className="text-[10px] text-[#9a9da3]">{item.sub}</p>
                </div>
              </div>
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
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => !togglingOpen && setShowConfirmToggle(false)}>
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
              <button 
                disabled={togglingOpen}
                onClick={() => setShowConfirmToggle(false)} 
                className="flex-1 py-3 rounded-xl border border-[#35373b] text-[#c4c6ca] font-semibold hover:bg-[#1a1b1e] transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button 
                disabled={togglingOpen}
                onClick={handleToggleOpen} 
                className={`flex-1 py-3 rounded-xl font-bold transition-colors cursor-pointer ${localAbierto ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-[#5bc827] hover:bg-[#7ed944] text-[#1a1b1e]'} ${togglingOpen ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {togglingOpen ? 'Guardando...' : localAbierto ? 'Sí, cerrar' : 'Sí, abrir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Form Modal para Platillos */}
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
              {formError && (
                <div className="p-3 rounded-xl bg-red-900/30 border border-red-800 text-red-300 text-xs">
                  {formError}
                </div>
              )}

              {/* Image upload */}
              <div>
                <label className="text-[#c4c6ca] text-xs font-semibold block mb-1">Fotografía</label>
                <div
                  onClick={() => fileRef.current?.click()}
                  className="w-full h-32 rounded-xl border-2 border-dashed border-[#35373b] hover:border-[#5bc827] flex items-center justify-center cursor-pointer overflow-hidden transition-colors relative"
                >
                  {imagePreview ? (
                    <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                  ) : form.imagen ? (
                    <img src={getImageUrl(form.imagen)} alt="preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-[#9a9da3]">
                      <span className="text-3xl">📷</span>
                      <span className="text-xs">Subir imagen</span>
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </div>

              <div>
                <label className="text-[#c4c6ca] text-xs font-semibold block mb-1">Nombre del platillo</label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                  placeholder="Ej. Tacos al Pastor"
                  className="w-full bg-[#232427] border border-[#35373b] focus:border-[#5bc827] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#9a9da3] outline-none transition-colors"
                />
              </div>

              <div>
                <label className="text-[#c4c6ca] text-xs font-semibold block mb-1">Descripción</label>
                <textarea
                  value={form.descripcion}
                  onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                  placeholder="Ingredientes, porciones..."
                  rows={2}
                  className="w-full bg-[#232427] border border-[#35373b] focus:border-[#5bc827] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#9a9da3] outline-none transition-colors resize-none"
                />
              </div>

              <div>
                <label className="text-[#c4c6ca] text-xs font-semibold block mb-1">Precio ($)</label>
                <input
                  type="number"
                  step="0.5"
                  value={form.precio}
                  onChange={e => setForm(f => ({ ...f, precio: e.target.value }))}
                  placeholder="0.00"
                  className="w-full bg-[#232427] border border-[#35373b] focus:border-[#5bc827] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#9a9da3] outline-none transition-colors"
                />
              </div>

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
                  type="button"
                  onClick={() => setForm(f => ({ ...f, disponible: !f.disponible }))}
                  className={`w-12 h-6 rounded-full transition-all relative cursor-pointer ${form.disponible ? 'bg-[#5bc827]' : 'bg-[#35373b]'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${form.disponible ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  disabled={savingDish}
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-3 rounded-xl border border-[#35373b] text-[#9a9da3] text-sm font-semibold hover:border-[#5bc827]/50 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={savingDish}
                  onClick={handleSaveDish}
                  className="flex-1 py-3 rounded-xl bg-[#5bc827] hover:bg-[#7ed944] text-[#1a1b1e] font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:scale-100"
                >
                  {savingDish ? 'Guardando...' : (editId !== null ? 'Actualizar' : 'Guardar platillo')}
                </button>
              </div>

              {editId !== null && (
                <button
                  type="button"
                  disabled={savingDish}
                  onClick={() => setConfirmDeleteId(editId)}
                  className="w-full py-2.5 rounded-xl border border-red-800/60 text-red-400 hover:bg-red-900/20 text-xs font-semibold transition-colors mt-2"
                >
                  🗑️ Eliminar platillo
                </button>
              )}
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
                onClick={() => toggleDisponible(confirmSoldOut, false)}
                className="flex-1 py-2.5 rounded-xl bg-red-900/60 border border-red-800 text-red-400 text-sm font-bold hover:bg-red-900/80 transition-colors cursor-pointer"
              >
                Marcar agotado
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete dish confirmation */}
      {confirmDeleteId !== null && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1b1e] border border-[#35373b] rounded-2xl w-full max-w-sm p-6 text-center">
            <span className="text-4xl block mb-3">🗑️</span>
            <h3 className="text-white font-bold text-lg mb-1">¿Eliminar este platillo?</h3>
            <p className="text-[#9a9da3] text-sm mb-5">Esta acción no se puede deshacer. Se eliminará del menú de tu restaurante.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDeleteId(null)} className="flex-1 py-2.5 rounded-xl border border-[#35373b] text-[#9a9da3] text-sm font-semibold hover:text-white transition-colors cursor-pointer">
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteDish(confirmDeleteId)}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold transition-colors cursor-pointer"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Restaurant Profile Modal */}
      {showEditProfile && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[#1a1b1e] border border-[#35373b] rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
            <div className="px-5 pt-5 pb-2 flex items-center justify-between border-b border-[#35373b]">
              <h2 className="text-xl font-bold text-white uppercase" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                Editar datos del negocio
              </h2>
              <button onClick={() => setShowEditProfile(false)} className="text-[#9a9da3] hover:text-white transition-colors text-xl cursor-pointer">✕</button>
            </div>
            <div className="px-5 py-4 space-y-3">
              {profileError && (
                <div className="p-3 rounded-xl bg-red-900/30 border border-red-800 text-red-300 text-xs">
                  {profileError}
                </div>
              )}

              {/* Cover image upload */}
              <div>
                <label className="text-[#c4c6ca] text-xs font-semibold block mb-1">Imagen de portada</label>
                <div
                  onClick={() => coverRef.current?.click()}
                  className="w-full h-32 rounded-xl border-2 border-dashed border-[#35373b] hover:border-[#5bc827] flex items-center justify-center cursor-pointer overflow-hidden transition-colors relative"
                >
                  {coverPreview ? (
                    <img src={coverPreview} alt="preview" className="w-full h-full object-cover" />
                  ) : profileForm.coverImg ? (
                    <img src={getImageUrl(profileForm.coverImg)} alt="preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-[#9a9da3]">
                      <span className="text-3xl">📷</span>
                      <span className="text-xs">Subir imagen de portada</span>
                    </div>
                  )}
                </div>
                <input ref={coverRef} type="file" accept="image/*" onChange={handleCoverFileChange} className="hidden" />
              </div>

              <div>
                <label className="text-[#c4c6ca] text-xs font-semibold block mb-1">Nombre del negocio</label>
                <input
                  type="text"
                  value={profileForm.nombre}
                  onChange={e => setProfileForm(f => ({ ...f, nombre: e.target.value }))}
                  className="w-full bg-[#232427] border border-[#35373b] focus:border-[#5bc827] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#9a9da3] outline-none transition-colors"
                />
              </div>

              <div>
                <label className="text-[#c4c6ca] text-xs font-semibold block mb-1">Categoría</label>
                <input
                  type="text"
                  value={profileForm.categoria}
                  onChange={e => setProfileForm(f => ({ ...f, categoria: e.target.value }))}
                  placeholder="Ej. Tacos, Mexicana, Italiana..."
                  className="w-full bg-[#232427] border border-[#35373b] focus:border-[#5bc827] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#9a9da3] outline-none transition-colors"
                />
              </div>

              <div>
                <label className="text-[#c4c6ca] text-xs font-semibold block mb-1">Tiempo estimado de entrega</label>
                <input
                  type="text"
                  value={profileForm.tiempoEntrega}
                  onChange={e => setProfileForm(f => ({ ...f, tiempoEntrega: e.target.value }))}
                  placeholder="Ej. 25-35 min"
                  className="w-full bg-[#232427] border border-[#35373b] focus:border-[#5bc827] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#9a9da3] outline-none transition-colors"
                />
              </div>

              <div>
                <label className="text-[#c4c6ca] text-xs font-semibold block mb-1">Costo de envío ($)</label>
                <input
                  type="number"
                  value={profileForm.deliveryFee}
                  onChange={e => setProfileForm(f => ({ ...f, deliveryFee: e.target.value }))}
                  placeholder="25"
                  className="w-full bg-[#232427] border border-[#35373b] focus:border-[#5bc827] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#9a9da3] outline-none transition-colors"
                />
              </div>

              <div>
                <label className="text-[#c4c6ca] text-xs font-semibold block mb-1">Dirección</label>
                <input
                  type="text"
                  value={profileForm.direccion}
                  onChange={e => setProfileForm(f => ({ ...f, direccion: e.target.value }))}
                  placeholder="Calle, número, colonia"
                  className="w-full bg-[#232427] border border-[#35373b] focus:border-[#5bc827] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#9a9da3] outline-none transition-colors"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  disabled={savingProfile}
                  onClick={() => setShowEditProfile(false)}
                  className="flex-1 py-3 rounded-xl border border-[#35373b] text-[#9a9da3] text-sm font-semibold hover:border-[#5bc827]/50 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={savingProfile}
                  onClick={handleSaveProfile}
                  className="flex-1 py-3 rounded-xl bg-[#5bc827] hover:bg-[#7ed944] text-[#1a1b1e] font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-50"
                >
                  {savingProfile ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Componente visual que representa la tarjeta de un platillo en el catálogo del local.
 */
function PlatilloCard({ p, onEdit, onToggle, onDelete }: { 
  p: Platillo; 
  onEdit: () => void; 
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <div className={`bg-[#232427] border rounded-2xl overflow-hidden transition-all ${p.disponible ? 'border-[#35373b]' : 'border-red-900/50 opacity-70'}`}>
      <div className="relative h-36 bg-[#1a3320] overflow-hidden">
        {p.imagen ? (
          <img src={getImageUrl(p.imagen)} alt={p.nombre} className="w-full h-full object-cover" />
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
          <span className="text-[#5bc827] font-bold text-sm shrink-0">${Number(p.precio).toFixed(2)}</span>
        </div>
        <p className="text-[#9a9da3] text-xs mb-3 line-clamp-2">{p.descripcion}</p>
        <div className="flex items-center gap-2">
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
          <button
            onClick={onDelete}
            title="Eliminar platillo"
            className="px-2.5 py-1.5 rounded-lg border border-red-900/40 text-red-400 hover:bg-red-900/30 transition-colors cursor-pointer text-xs"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  )
}

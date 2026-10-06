import { useState, useEffect, useMemo, useRef } from "react"
import { api, getImageUrl, type CurrentUser } from "@/lib/api"
import { getSocket } from "@/lib/socket"
import EditProfileModal from "@/components/EditProfileModal"
import Terminos from "@/pages/Terminos"
import Privacidad from "@/pages/Privacidad"

type Tab = "dashboard" | "usuarios" | "locales" | "repartidores" | "pedidos" | "soporte" | "config"
type Timeframe = "hoy" | "semana" | "mes" | "anio" | "personalizado"
type LocalTimeframe = "hoy" | "semana" | "mes" | "anio" | "personalizado"

// TODO: reemplazar con datos reales del backend (GET /api/admin/restaurants/earnings)
const DATA_GANANCIAS_LOCAL: Record<string | number, Record<Exclude<LocalTimeframe, "personalizado">, {
  total: number
  efectivo: number
  tarjeta: number
  comisionPlataforma: number
}>> = {
  1: {
    hoy: { total: 0, efectivo: 0, tarjeta: 0, comisionPlataforma: 0 },
    semana: { total: 0, efectivo: 0, tarjeta: 0, comisionPlataforma: 0 },
    mes: { total: 0, efectivo: 0, tarjeta: 0, comisionPlataforma: 0 },
    anio: { total: 0, efectivo: 0, tarjeta: 0, comisionPlataforma: 0 },
  },
}

function generarGananciasPorFecha(
  localId: string | number,
  dia: number | null,
  mes: number,
  anio: number,
) {
  return { total: 0, efectivo: 0, tarjeta: 0, comisionPlataforma: 0 }
}

const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
]
const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

interface Props {
  onLogout: () => void
  currentUser?: CurrentUser | null
  onUserUpdate?: (user: CurrentUser) => void
}

// TODO: reemplazar con datos reales del backend (GET /api/admin/earnings)
const DATA_INGRESOS: Record<Exclude<Timeframe, "personalizado">, {
  total: number
  efectivo: number
  tarjeta: number
  comisionUsuario: number
  comisionLocales: number
}> = {
  hoy: {
    total: 0,
    efectivo: 0,
    tarjeta: 0,
    comisionUsuario: 0,
    comisionLocales: 0,
  },
  semana: {
    total: 0,
    efectivo: 0,
    tarjeta: 0,
    comisionUsuario: 0,
    comisionLocales: 0,
  },
  mes: {
    total: 0,
    efectivo: 0,
    tarjeta: 0,
    comisionUsuario: 0,
    comisionLocales: 0,
  },
  anio: {
    total: 0,
    efectivo: 0,
    tarjeta: 0,
    comisionUsuario: 0,
    comisionLocales: 0,
  },
}

/**
 * Genera datos simulados de ingresos para cualquier fecha elegida.
 * Utiliza una semilla basada en la fecha para mantener consistencia visual sin cambiar en re-renders.
 *
 * Nota para integración futura: esta función eventualmente se reemplazará por
 * una llamada a GET /api/admin/ingresos?dia=X&mes=Y&anio=Z
 */
function generarIngresosPorFecha(
  dia: number | null,
  mes: number,
  anio: number,
) {
  return {
    total: 0,
    efectivo: 0,
    tarjeta: 0,
    comisionUsuario: 0,
    comisionLocales: 0,
  }
}

interface AdminOrder {
  id: string
  estado: string
  subtotal: number
  envio: number
  comisionUsuarioFija: number
  comisionRepartidorFija: number
  comisionLocalMonto: number
  total: number
  metodoPago: string
  createdAt: string
  restaurant?: { nombre: string }
  user?: { nombre: string }
}

function isOrderInTimeframe(
  createdAtStr: string,
  timeframe: Timeframe,
  fechaCustom: { dia: number | null; mes: number; anio: number },
): boolean {
  const d = new Date(createdAtStr)
  const now = new Date()

  if (timeframe === "hoy") {
    return (
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    )
  }

  if (timeframe === "semana") {
    const startOfWeek = new Date(now)
    const dayOfWeek = (now.getDay() + 6) % 7 // Lunes = 0
    startOfWeek.setDate(now.getDate() - dayOfWeek)
    startOfWeek.setHours(0, 0, 0, 0)
    return d >= startOfWeek && d <= now
  }

  if (timeframe === "mes") {
    return (
      d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    )
  }

  if (timeframe === "anio") {
    return d.getFullYear() === now.getFullYear()
  }

  if (timeframe === "personalizado") {
    if (fechaCustom.dia !== null) {
      return (
        d.getDate() === fechaCustom.dia &&
        d.getMonth() === fechaCustom.mes &&
        d.getFullYear() === fechaCustom.anio
      )
    } else {
      return (
        d.getMonth() === fechaCustom.mes && d.getFullYear() === fechaCustom.anio
      )
    }
  }

  return true
}

/**
 * Componente principal del Panel de Administración.
 *  * Gestiona la navegación entre las diferentes pestañas (dashboard, usuarios, locales, etc.)
 * y mantiene el estado de las configuraciones de comisiones de la plataforma.
 *
 * @param {Props} props - Propiedades del componente, incluye la función para cerrar sesión.
 */
export default function AdminPanel({
  onLogout,
  currentUser,
  onUserUpdate,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard")
  const [editProfileOpen, setEditProfileOpen] = useState(false)
  const [comisionLocal, setComisionLocal] = useState<number>(15)
  const [comisionRepartidor, setComisionRepartidor] = useState<number>(20)
  const [comisionUsuario, setComisionUsuario] = useState<number>(5)
  const [showToast, setShowToast] = useState(false)

  // Estados para vistas legales y zonas de cobertura
  const [legalView, setLegalView] = useState<"terminos" | "privacidad" | null>(null)
  interface DeliveryZoneItem {
    id: string
    nombre: string
    activa: boolean
    createdAt: string
  }
  const [zones, setZones] = useState<DeliveryZoneItem[]>([])
  const [loadingZones, setLoadingZones] = useState<boolean>(false)
  const [zoneModalOpen, setZoneModalOpen] = useState<boolean>(false)
  const [newZoneName, setNewZoneName] = useState<string>("")
  const [savingZone, setSavingZone] = useState<boolean>(false)
  const [zoneActionError, setZoneActionError] = useState<string | null>(null)

  // Estados para el desplegable de ingresos
  const [showIngresosDetails, setShowIngresosDetails] = useState<boolean>(false)
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>("mes")
  const [fechaSeleccionada, setFechaSeleccionada] = useState<{
    dia: number | null
    mes: number
    anio: number
  }>({
    dia: null,
    mes: new Date().getMonth(),
    anio: new Date().getFullYear(),
  })
  interface UsuarioAdmin {
    id: string
    name: string
    email: string
    status: string
    telefono: string
    fechaRegistro: string
    pedidosTotales: number
    gastoTotal: number
    rating: number
    direccionPrincipal: string
  }

  interface LocalAdmin {
    id: string
    name: string
    status: string
    statusColor: string
    bg: string
    categoria: string
    propietario: string
    telefono: string
    direccion: string
    fechaAlta: string
    rating: number
    pedidosTotales: number
  }

  interface RepartidorAdmin {
    id: string
    name: string
    mat: string
    rating: string
    status: string
    telefono: string
    vehiculo: string
    fechaAlta: string
    direccion: string
    entregasTotales: number
    gananciasTotales: number
    fotoUrl?: string | null
  }

  interface SupportUser {
    id: string
    nombre: string
    email: string
    rol: string
  }

  interface SupportConversation {
    user: SupportUser
    lastMessage: {
      id: string
      mensaje: string
      autor: "USUARIO" | "SOPORTE"
      createdAt: string
      orderId?: string | null
    } | null
  }

  interface SupportDetailMessage {
    id: string
    userId: string
    orderId?: string | null
    autor: "USUARIO" | "SOPORTE"
    mensaje: string
    createdAt: string
  }

  // Estados para soporte
  const [conversations, setConversations] = useState<SupportConversation[]>([])
  const [loadingConversations, setLoadingConversations] =
    useState<boolean>(false)
  const [selectedConversationUser, setSelectedConversationUser] =
    useState<SupportUser | null>(null)
  const [conversationMessages, setConversationMessages] =
    useState<SupportDetailMessage[]>([])
  const [loadingConversation, setLoadingConversation] = useState<boolean>(false)
  const [replyText, setReplyText] = useState<string>("")
  const [sendingReply, setSendingReply] = useState<boolean>(false)
  const [replyError, setReplyError] = useState<string | null>(null)
  const chatBottomRef = useRef<HTMLDivElement | null>(null)

  // Estados para usuarios
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([])
  const [loadingUsuarios, setLoadingUsuarios] = useState<boolean>(false)
  const [selectedUsuario, setSelectedUsuario] = useState<UsuarioAdmin | null>(
    null,
  )
  const [showConfirmSuspend, setShowConfirmSuspend] = useState<boolean>(false)
  const [updatingUser, setUpdatingUser] = useState<boolean>(false)

  // Estados para configuración de comisiones
  const [loadingConfig, setLoadingConfig] = useState<boolean>(false)
  const [savingConfig, setSavingConfig] = useState<boolean>(false)

  // Estados para pedidos del dashboard
  const [adminOrders, setAdminOrders] = useState<AdminOrder[]>([])
  const [loadingOrders, setLoadingOrders] = useState<boolean>(false)

  // Carga de usuarios desde el backend
  const loadUsuarios = async () => {
    try {
      setLoadingUsuarios(true)
      const data = await api.get<any[]>("/api/admin/usuarios")
      const mapped: UsuarioAdmin[] = (data || []).map((u) => ({
        id: u.id,
        name: u.nombre || u.name || "Usuario",
        email: u.email,
        status:
          u.status === "ACTIVO" || u.status === "Activo"
            ? "Activo"
            : "Suspendido",
        telefono: u.telefono || "Sin teléfono",
        fechaRegistro: u.createdAt
          ? new Date(u.createdAt).toLocaleDateString("es-MX", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })
          : "Reciente",
        pedidosTotales: u.pedidosTotales ?? 0,
        gastoTotal: u.gastoTotal ?? 0,
        rating: u.rating ?? 5,
        direccionPrincipal: u.direccionPrincipal || "No especificada",
      }))
      setUsuarios(mapped)
    } catch (err) {
      console.error("Error al cargar usuarios:", err)
    } finally {
      setLoadingUsuarios(false)
    }
  }

  // Acción de suspender/reactivar usuario
  const handleToggleSuspendUsuario = async () => {
    if (!selectedUsuario || updatingUser) return
    setUpdatingUser(true)
    try {
      const isActivo = selectedUsuario.status === "Activo"
      const endpoint = isActivo
        ? `/api/admin/usuarios/${selectedUsuario.id}/suspend`
        : `/api/admin/usuarios/${selectedUsuario.id}/reactivate`
      const updated = await api.patch<any>(endpoint)
      const nuevoStatus =
        updated.status === "ACTIVO" || updated.status === "Activo"
          ? "Activo"
          : "Suspendido"
      setSelectedUsuario((prev) =>
        prev ? { ...prev, status: nuevoStatus } : null,
      )
      setShowConfirmSuspend(false)
      await loadUsuarios()
    } catch (err) {
      console.error("Error al suspender/reactivar usuario:", err)
    } finally {
      setUpdatingUser(false)
    }
  }

  // Carga de comisiones desde el backend
  const loadConfig = async () => {
    try {
      setLoadingConfig(true)
      const config = await api.get<{
        id: string
        comisionLocalPorcentaje: number
        comisionRepartidorFija: number
        comisionUsuarioFija: number
      }>("/api/admin/config")
      setComisionLocal(config.comisionLocalPorcentaje)
      setComisionRepartidor(config.comisionRepartidorFija)
      setComisionUsuario(config.comisionUsuarioFija)
    } catch (err) {
      console.error("Error al cargar configuración:", err)
    } finally {
      setLoadingConfig(false)
    }
  }

  // Guardado de comisiones hacia el backend
  const handleSaveConfig = async () => {
    if (savingConfig) return
    setSavingConfig(true)
    try {
      const updated = await api.patch<{
        id: string
        comisionLocalPorcentaje: number
        comisionRepartidorFija: number
        comisionUsuarioFija: number
      }>("/api/admin/config", {
        comisionLocalPorcentaje: Number(comisionLocal),
        comisionRepartidorFija: Number(comisionRepartidor),
        comisionUsuarioFija: Number(comisionUsuario),
      })
      setComisionLocal(updated.comisionLocalPorcentaje)
      setComisionRepartidor(updated.comisionRepartidorFija)
      setComisionUsuario(updated.comisionUsuarioFija)
      setShowToast(true)
      setTimeout(() => setShowToast(false), 3000)
    } catch (err) {
      console.error("Error al guardar configuración:", err)
    } finally {
      setSavingConfig(false)
    }
  }

  // Carga y gestión de zonas de cobertura
  const loadZones = async () => {
    try {
      setLoadingZones(true)
      setZoneActionError(null)
      const data = await api.get<DeliveryZoneItem[]>("/api/admin/zonas")
      setZones(data || [])
    } catch (err: any) {
      console.error("Error al cargar zonas de cobertura:", err)
      setZoneActionError(err?.message || "Error al cargar zonas.")
    } finally {
      setLoadingZones(false)
    }
  }

  const handleAddZone = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const trimmed = newZoneName.trim()
    if (!trimmed || savingZone) return
    try {
      setSavingZone(true)
      setZoneActionError(null)
      await api.post("/api/admin/zonas", { nombre: trimmed })
      setNewZoneName("")
      setZoneModalOpen(false)
      await loadZones()
    } catch (err: any) {
      setZoneActionError(err?.message || "Error al crear zona.")
    } finally {
      setSavingZone(false)
    }
  }

  const handleToggleZone = async (id: string, activaActual: boolean) => {
    try {
      setZoneActionError(null)
      await api.patch(`/api/admin/zonas/${id}`, { activa: !activaActual })
      await loadZones()
    } catch (err: any) {
      setZoneActionError(err?.message || "Error al actualizar zona.")
    }
  }

  const handleDeleteZone = async (id: string, nombre: string) => {
    if (!confirm(`¿Eliminar la zona "${nombre}"? Esta acción no se puede deshacer.`)) return
    try {
      setZoneActionError(null)
      await api.delete(`/api/admin/zonas/${id}`)
      await loadZones()
    } catch (err: any) {
      setZoneActionError(err?.message || "Error al eliminar zona.")
    }
  }

  // Carga de pedidos para el dashboard
  const loadAdminOrders = async () => {
    try {
      setLoadingOrders(true)
      const data = await api.get<AdminOrder[]>("/api/orders/admin/all")
      setAdminOrders(data || [])
    } catch (err) {
      console.error("Error al cargar pedidos para dashboard:", err)
      setAdminOrders([])
    } finally {
      setLoadingOrders(false)
    }
  }

  // Estados para locales
  const [locales, setLocales] = useState<LocalAdmin[]>([])
  const [loadingLocales, setLoadingLocales] = useState<boolean>(false)
  const [updatingLocal, setUpdatingLocal] = useState<boolean>(false)
  const [selectedLocal, setSelectedLocal] = useState<LocalAdmin | null>(null)
  const [localTimeframe, setLocalTimeframe] = useState<LocalTimeframe>("mes")
  const [fechaLocalSeleccionada, setFechaLocalSeleccionada] = useState<{
    dia: number | null
    mes: number
    anio: number
  }>({
    dia: null,
    mes: new Date().getMonth(),
    anio: new Date().getFullYear(),
  })
  const [showLocalGanancias, setShowLocalGanancias] = useState(false)
  const [showConfirmSuspendLocal, setShowConfirmSuspendLocal] = useState(false)

  // Estados para repartidores
  const [repartidores, setRepartidores] = useState<RepartidorAdmin[]>([])
  const [loadingRepartidores, setLoadingRepartidores] = useState<boolean>(false)
  const [updatingRepartidor, setUpdatingRepartidor] = useState<boolean>(false)
  const [selectedRepartidor, setSelectedRepartidor] =
    useState<RepartidorAdmin | null>(null)
  const [showConfirmSuspendRepartidor, setShowConfirmSuspendRepartidor] =
    useState(false)
  const [showConfirmRechazarRepartidor, setShowConfirmRechazarRepartidor] =
    useState<RepartidorAdmin | null>(null)

  // Estados para el listado global de pedidos
  const [pedidosList, setPedidosList] = useState<AdminOrder[]>([])
  const [loadingPedidosList, setLoadingPedidosList] = useState<boolean>(false)
  const [pedidosEstadoFilter, setPedidosEstadoFilter] =
    useState<string>("TODOS")

  // Carga de locales desde el backend
  const loadLocales = async () => {
    try {
      setLoadingLocales(true)
      const data = await api.get<any[]>("/api/restaurants/admin/all")
      const mapped: LocalAdmin[] = (data || []).map((r) => {
        let statusLabel = "Pendiente"
        let statusColor = "text-amber-400"
        let bg = "bg-amber-400/10"

        if (r.status === "ACTIVO" || r.status === "Activo") {
          statusLabel = "Activo"
          statusColor = "text-[#5bc827]"
          bg = "bg-[#5bc827]/10"
        } else if (r.status === "SUSPENDIDO" || r.status === "Suspendido") {
          statusLabel = "Suspendido"
          statusColor = "text-red-400"
          bg = "bg-red-400/10"
        }

        return {
          id: r.id,
          name: r.nombre || "Restaurante",
          status: statusLabel,
          statusColor,
          bg,
          categoria: r.categoria || "Restaurante",
          propietario: r.owner?.nombre || "Sin propietario",
          telefono: r.owner?.telefono || r.telefono || "Sin teléfono",
          direccion: r.direccion || "Sin dirección",
          fechaAlta: r.createdAt
            ? new Date(r.createdAt).toLocaleDateString("es-MX", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })
            : "Reciente",
          rating: r.ratingPromedio ?? r.rating ?? 5,
          pedidosTotales: r.totalPedidos ?? 0,
        }
      })
      setLocales(mapped)
    } catch (err) {
      console.error("Error al cargar locales:", err)
    } finally {
      setLoadingLocales(false)
    }
  }

  // Acción de aprobar local
  const handleApproveLocal = async (id: string) => {
    if (updatingLocal) return
    setUpdatingLocal(true)
    try {
      await api.patch(`/api/restaurants/admin/${id}/approve`)
      await loadLocales()
    } catch (err) {
      console.error("Error al aprobar local:", err)
    } finally {
      setUpdatingLocal(false)
    }
  }

  // Acción de suspender/reactivar local
  const handleToggleSuspendLocal = async () => {
    if (!selectedLocal || updatingLocal) return
    setUpdatingLocal(true)
    try {
      const isSuspendido = selectedLocal.status === "Suspendido"
      const endpoint = isSuspendido
        ? `/api/restaurants/admin/${selectedLocal.id}/reactivate`
        : `/api/restaurants/admin/${selectedLocal.id}/suspend`
      const updated = await api.patch<any>(endpoint)
      const nuevoStatus =
        updated.status === "ACTIVO" || updated.status === "Activo"
          ? "Activo"
          : "Suspendido"
      const nuevoColor =
        nuevoStatus === "Activo" ? "text-[#5bc827]" : "text-red-400"
      const nuevoBg =
        nuevoStatus === "Activo" ? "bg-[#5bc827]/10" : "bg-red-400/10"
      setSelectedLocal((prev) =>
        prev
          ? {
              ...prev,
              status: nuevoStatus,
              statusColor: nuevoColor,
              bg: nuevoBg,
            }
          : null,
      )
      setShowConfirmSuspendLocal(false)
      await loadLocales()
    } catch (err) {
      console.error("Error al suspender/reactivar local:", err)
    } finally {
      setUpdatingLocal(false)
    }
  }

  // Carga de repartidores desde el backend
  const loadRepartidores = async () => {
    try {
      setLoadingRepartidores(true)
      const data = await api.get<any[]>("/api/admin/repartidores")
      const mapped: RepartidorAdmin[] = (data || []).map((r) => {
        let statusLabel = "Pendiente"
        if (r.status === "ACTIVO") statusLabel = "Activo"
        else if (r.status === "SUSPENDIDO") statusLabel = "Suspendido"
        else if (r.status === "RECHAZADO") statusLabel = "Rechazado"

        const vehiculo = r.driverProfile?.vehiculo || "Moto"
        const matricula = r.driverProfile?.matricula
          ? `Placas: ${r.driverProfile.matricula}`
          : vehiculo

        return {
          id: r.id,
          name: r.nombre || "Repartidor",
          mat: matricula,
          rating:
            r.driverProfile?.ratingPromedio != null
              ? String(r.driverProfile.ratingPromedio)
              : "5.0",
          status: statusLabel,
          telefono: r.telefono || "Sin teléfono",
          vehiculo,
          fechaAlta: r.createdAt
            ? new Date(r.createdAt).toLocaleDateString("es-MX", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })
            : "Reciente",
          direccion: "Huatusco, Ver.",
          entregasTotales: r.driverProfile?.totalEntregas ?? 0,
          gananciasTotales: 0,
          fotoUrl: r.driverProfile?.fotoUrl || null,
        }
      })
      setRepartidores(mapped)
    } catch (err) {
      console.error("Error al cargar repartidores:", err)
    } finally {
      setLoadingRepartidores(false)
    }
  }

  // Acción de aprobar repartidor
  const handleApproveRepartidor = async (id: string) => {
    if (updatingRepartidor) return
    setUpdatingRepartidor(true)
    try {
      await api.patch(`/api/admin/repartidores/${id}/approve`)
      await loadRepartidores()
    } catch (err) {
      console.error("Error al aprobar repartidor:", err)
    } finally {
      setUpdatingRepartidor(false)
    }
  }

  // Acción de rechazar repartidor
  const handleRejectRepartidor = async (id: string) => {
    if (updatingRepartidor) return
    setUpdatingRepartidor(true)
    try {
      await api.patch(`/api/admin/repartidores/${id}/reject`)
      setShowConfirmRechazarRepartidor(null)
      await loadRepartidores()
    } catch (err) {
      console.error("Error al rechazar repartidor:", err)
    } finally {
      setUpdatingRepartidor(false)
    }
  }

  // Acción de suspender/reactivar repartidor
  const handleToggleSuspendRepartidor = async () => {
    if (!selectedRepartidor || updatingRepartidor) return
    setUpdatingRepartidor(true)
    try {
      const isActivo = selectedRepartidor.status === "Activo"
      const endpoint = isActivo
        ? `/api/admin/repartidores/${selectedRepartidor.id}/suspend`
        : `/api/admin/repartidores/${selectedRepartidor.id}/reactivate`
      const updated = await api.patch<any>(endpoint)
      const nuevoStatus = updated.status === "ACTIVO" ? "Activo" : "Suspendido"
      setSelectedRepartidor((prev) =>
        prev ? { ...prev, status: nuevoStatus } : null,
      )
      setShowConfirmSuspendRepartidor(false)
      await loadRepartidores()
    } catch (err) {
      console.error("Error al suspender/reactivar repartidor:", err)
    } finally {
      setUpdatingRepartidor(false)
    }
  }

  // Carga de pedidos para la pestaña Pedidos
  const loadPedidosList = async (estado?: string) => {
    try {
      setLoadingPedidosList(true)
      const query = estado && estado !== "TODOS" ? `?estado=${estado}` : ""
      const data = await api.get<AdminOrder[]>(`/api/orders/admin/all${query}`)
      setPedidosList(data || [])
    } catch (err) {
      console.error("Error al cargar lista de pedidos:", err)
      setPedidosList([])
    } finally {
      setLoadingPedidosList(false)
    }
  }

  const handleFilterPedidos = (nuevoEstado: string) => {
    setPedidosEstadoFilter(nuevoEstado)
    loadPedidosList(nuevoEstado)
  }

  // Carga de conversaciones de soporte
  const loadConversations = async () => {
    try {
      setLoadingConversations(true)
      const data = await api.get<SupportConversation[]>(
        "/api/support/admin/conversations",
      )
      setConversations(data || [])
    } catch (err) {
      console.error("Error al cargar conversaciones de soporte:", err)
    } finally {
      setLoadingConversations(false)
    }
  }

  const openConversation = async (user: SupportUser) => {
    setSelectedConversationUser(user)
    setReplyError(null)
    setReplyText("")
    try {
      setLoadingConversation(true)
      const data = await api.get<{
        user: SupportUser
        messages: SupportDetailMessage[]
      }>(`/api/support/admin/conversations/${user.id}`)
      setConversationMessages(data.messages || [])
    } catch (err) {
      console.error("Error al abrir conversación:", err)
    } finally {
      setLoadingConversation(false)
    }
  }

  const handleSendReply = async () => {
    if (!selectedConversationUser || !replyText.trim() || sendingReply) return
    const textToSend = replyText.trim()
    setSendingReply(true)
    setReplyError(null)
    try {
      const newMsg = await api.post<SupportDetailMessage>(
        `/api/support/admin/conversations/${selectedConversationUser.id}/reply`,
        { mensaje: textToSend },
      )
      setConversationMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev
        return [...prev, newMsg]
      })
      setReplyText("")
      loadConversations()
    } catch (err: any) {
      console.error("Error al responder soporte:", err)
      setReplyError(err.message || "Error al enviar respuesta")
    } finally {
      setSendingReply(false)
    }
  }

  // Socket listener para mensajes de soporte en tiempo real
  useEffect(() => {
    const socket = getSocket()
    if (!socket) return

    const handleSupportMessage = (msg: any) => {
      loadConversations()
      if (
        selectedConversationUser &&
        msg.userId === selectedConversationUser.id
      ) {
        setConversationMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev
          return [...prev, msg]
        })
      }
    }

    socket.on("support:message", handleSupportMessage)

    return () => {
      socket.off("support:message", handleSupportMessage)
    }
  }, [selectedConversationUser])

  // Auto scroll al final de la conversación al recibir nuevos mensajes
  useEffect(() => {
    if (selectedConversationUser && chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [conversationMessages, selectedConversationUser])

  // Carga inicial al montar el componente
  useEffect(() => {
    loadUsuarios()
    loadConfig()
    loadAdminOrders()
    loadLocales()
    loadRepartidores()
    loadPedidosList()
    loadConversations()
    loadZones()
  }, [])

  useEffect(() => {
    if (activeTab === "config") {
      loadZones()
    }
  }, [activeTab])

  /**
   * NOTA DE ARQUITECTURA / INTEGRACIÓN:
   * Este cálculo se realiza temporalmente en el cliente a partir de GET /api/orders/admin/all.
   * A futuro, con más volumen de pedidos, convendrá un endpoint de agregación dedicado en el
   * backend (ej. GET /api/orders/admin/summary?desde=&hasta=).
   *
   * DEFINICIÓN DE COMISIÓN TOTAL DE LA PLATAFORMA:
   * - Solo se consideran pedidos con estado ENTREGADO (ingreso real liquidado).
   * - comisionUsuarioFija: Cargo por servicio pagado por el usuario (INGRESO).
   * - comisionLocalMonto: Comisión cobrada al local por venta (INGRESO).
   * - comisionRepartidorFija: Es un EGRESO pagado al repartidor, NO un ingreso de la plataforma,
   *   por lo que NO debe sumarse aquí.
   */
  const currentIngresos = useMemo(() => {
    const filtered = adminOrders.filter((o) =>
      isOrderInTimeframe(o.createdAt, selectedTimeframe, fechaSeleccionada),
    )

    const delivered = filtered.filter((o) => o.estado === "ENTREGADO")

    let total = 0
    let efectivo = 0
    let tarjeta = 0
    let comisionUsuario = 0
    let comisionLocales = 0

    for (const o of delivered) {
      const orderTotal = Number(o.total) || 0
      total += orderTotal

      const metodo = (o.metodoPago || "").toUpperCase()
      if (metodo === "EFECTIVO") {
        efectivo += orderTotal
      } else {
        tarjeta += orderTotal
      }

      comisionUsuario += Number(o.comisionUsuarioFija) || 0
      comisionLocales += Number(o.comisionLocalMonto) || 0
    }

    return {
      total,
      efectivo,
      tarjeta,
      comisionUsuario,
      comisionLocales,
      comisionPlataforma: comisionUsuario + comisionLocales,
    }
  }, [adminOrders, selectedTimeframe, fechaSeleccionada])

  const navItems: { id: Tab; label: string; icon: string }[] = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "usuarios", label: "Usuarios", icon: "👥" },
    { id: "locales", label: "Locales", icon: "🏪" },
    { id: "repartidores", label: "Repartidores", icon: "🏍️" },
    { id: "pedidos", label: "Pedidos", icon: "📦" },
    { id: "soporte", label: "Soporte", icon: "💬" },
    { id: "config", label: "Ajustes", icon: "⚙️" },
  ]
  /**
   * Componente interno que renderiza la barra superior del panel.
   * Contiene el logo, título y el botón para cerrar sesión.
   */
  const TopBar = () => (
    <header className="sticky top-0 z-40 bg-[#1a1b1e]/95 backdrop-blur-sm border-b border-[#35373b] px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#5e4526] to-[#2d2112] border border-[#d9a05b] flex items-center justify-center text-sm shadow-lg shadow-[#d9a05b]/20">
          🛡️
        </div>
        <div>
          <h1 className="text-white font-bold text-sm leading-tight">
            Panel Admin
          </h1>
          <p className="text-[#d9a05b] text-[10px] uppercase tracking-widest">
            Sierra App
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => setEditProfileOpen(true)}
          className="text-xs text-[#d9a05b] hover:text-[#e4b274] transition-colors border border-[#d9a05b]/30 px-2.5 py-1 rounded-lg flex items-center gap-1 font-medium cursor-pointer"
        >
          👤 Mi perfil
        </button>
        <button
          onClick={onLogout}
          className="text-[#9a9da3] hover:text-[#d9a05b] transition-colors text-sm font-semibold cursor-pointer"
        >
          Salir
        </button>
      </div>
    </header>
  )
  /**
   * Componente auxiliar para estandarizar el diseño de los títulos de cada sección.
   *
   * @param {Object} props - Propiedades que incluyen el texto del título.
   */
  const Title = ({ text }: { text: string }) => (
    <h2
      className="text-2xl font-bold text-white uppercase tracking-wide mb-4"
      style={{ fontFamily: "Barlow Condensed, sans-serif" }}
    >
      {text}
    </h2>
  )

  if (selectedUsuario) {
    return (
      <div className="min-h-screen bg-[#1a1b1e] text-white pb-10">
        <header className="sticky top-0 z-40 bg-[#1a1b1e]/95 backdrop-blur-sm border-b border-[#35373b] px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setSelectedUsuario(null)}
            className="text-[#9a9da3] hover:text-white transition-colors cursor-pointer"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <h1
            className="text-xl font-bold uppercase tracking-wide"
            style={{ fontFamily: "Barlow Condensed, sans-serif" }}
          >
            Detalle de usuario
          </h1>
        </header>

        <div className="p-4 max-w-lg mx-auto w-full space-y-5">
          {/* Encabezado del usuario */}
          <div className="bg-[#232427] border border-[#35373b] rounded-2xl p-5 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#d9a05b]/20 border-2 border-[#d9a05b] flex items-center justify-center text-xl font-bold text-[#d9a05b]">
              {selectedUsuario.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-lg text-white">
                {selectedUsuario.name}
              </h2>
              <p className="text-[#9a9da3] text-xs">{selectedUsuario.email}</p>
              <span
                className={`inline-block mt-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                  selectedUsuario.status === "Activo"
                    ? "text-[#5bc827] bg-[#5bc827]/10"
                    : "text-red-400 bg-red-400/10"
                }`}
              >
                {selectedUsuario.status}
              </span>
            </div>
          </div>

          {/* Información general */}
          <div className="bg-[#232427] border border-[#35373b] rounded-2xl p-5 space-y-3">
            <h3 className="text-[#9a9da3] text-xs uppercase tracking-widest font-semibold mb-2">
              Información general
            </h3>
            <InfoRow label="Teléfono" value={selectedUsuario.telefono} />
            <InfoRow
              label="Fecha de registro"
              value={selectedUsuario.fechaRegistro}
            />
            <InfoRow
              label="Dirección principal"
              value={selectedUsuario.direccionPrincipal}
            />
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-3 gap-3">
            <StatCard
              label="Pedidos totales"
              value={String(selectedUsuario.pedidosTotales)}
              icon="📦"
            />
            <StatCard
              label="Gasto total"
              value={`$${selectedUsuario.gastoTotal.toLocaleString("es-MX")}`}
              icon="💰"
            />
            <StatCard
              label="Rating"
              value={`${selectedUsuario.rating} ★`}
              icon="⭐"
            />
          </div>

          {/* Botón de suspender/reactivar */}
          <button
            onClick={() => setShowConfirmSuspend(true)}
            className={`w-full py-3.5 rounded-xl font-bold text-sm transition-colors cursor-pointer ${
              selectedUsuario.status === "Activo"
                ? "border border-red-800/50 text-red-400 hover:bg-red-900/20"
                : "bg-[#5bc827] hover:bg-[#7ed944] text-[#1a1b1e]"
            }`}
          >
            {selectedUsuario.status === "Activo"
              ? "Suspender usuario"
              : "Reactivar usuario"}
          </button>
        </div>

        {/* Modal de confirmación */}
        {showConfirmSuspend && (
          <div
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => setShowConfirmSuspend(false)}
          >
            <div
              className="bg-[#232427] border border-[#35373b] rounded-2xl p-6 max-w-sm w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-white font-bold text-lg text-center mb-2">
                {selectedUsuario.status === "Activo"
                  ? "¿Suspender a este usuario?"
                  : "¿Reactivar a este usuario?"}
              </h3>
              <p className="text-[#9a9da3] text-sm text-center mb-5">
                {selectedUsuario.status === "Activo"
                  ? "No podrá iniciar sesión ni hacer nuevos pedidos hasta que se reactive."
                  : "El usuario podrá volver a iniciar sesión y hacer pedidos normalmente."}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmSuspend(false)}
                  className="flex-1 py-3 rounded-xl border border-[#35373b] text-[#c4c6ca] font-semibold hover:bg-[#1a1b1e] transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  disabled={updatingUser}
                  onClick={handleToggleSuspendUsuario}
                  className={`flex-1 py-3 rounded-xl font-bold transition-colors cursor-pointer disabled:opacity-50 ${
                    selectedUsuario.status === "Activo"
                      ? "bg-red-600 hover:bg-red-500 text-white"
                      : "bg-[#5bc827] hover:bg-[#7ed944] text-[#1a1b1e]"
                  }`}
                >
                  {updatingUser ? "Procesando..." : "Confirmar"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (selectedLocal) {
    const ganancias =
      localTimeframe === "personalizado"
        ? generarGananciasPorFecha(
            selectedLocal.id,
            fechaLocalSeleccionada.dia,
            fechaLocalSeleccionada.mes,
            fechaLocalSeleccionada.anio,
          )
        : (DATA_GANANCIAS_LOCAL[selectedLocal.id]?.[
            (localTimeframe as Exclude<LocalTimeframe, "personalizado">)
          ] ?? { total: 0, efectivo: 0, tarjeta: 0, comisionPlataforma: 0 })

    return (
      <div className="min-h-screen bg-[#1a1b1e] text-white pb-10">
        <header className="sticky top-0 z-40 bg-[#1a1b1e]/95 backdrop-blur-sm border-b border-[#35373b] px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setSelectedLocal(null)}
            className="text-[#9a9da3] hover:text-white transition-colors cursor-pointer"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <h1
            className="text-xl font-bold uppercase tracking-wide"
            style={{ fontFamily: "Barlow Condensed, sans-serif" }}
          >
            Detalle del local
          </h1>
        </header>

        <div className="p-4 max-w-lg mx-auto w-full space-y-5">
          {/* Encabezado del local */}
          <div className="bg-[#232427] border border-[#35373b] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-bold text-lg text-white">
                {selectedLocal.name}
              </h2>
              <span
                className={`${selectedLocal.statusColor} ${selectedLocal.bg} text-[10px] uppercase font-bold px-2 py-1 rounded`}
              >
                {selectedLocal.status}
              </span>
            </div>
            <p className="text-[#9a9da3] text-xs">{selectedLocal.categoria}</p>
          </div>

          {/* Información general */}
          <div className="bg-[#232427] border border-[#35373b] rounded-2xl p-5 space-y-3">
            <h3 className="text-[#9a9da3] text-xs uppercase tracking-widest font-semibold mb-2">
              Información general
            </h3>
            <InfoRow label="Propietario" value={selectedLocal.propietario} />
            <InfoRow label="Teléfono" value={selectedLocal.telefono} />
            <InfoRow label="Dirección" value={selectedLocal.direccion} />
            <InfoRow label="Fecha de alta" value={selectedLocal.fechaAlta} />
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="Rating"
              value={`${selectedLocal.rating} ★`}
              icon="⭐"
            />
            <StatCard
              label="Pedidos totales"
              value={String(selectedLocal.pedidosTotales)}
              icon="📦"
            />
          </div>

          {/* Ganancias del local */}
          <div className="bg-gradient-to-r from-[#232427] to-[#1a1b1e] border border-[#5bc827]/30 rounded-2xl shadow-lg shadow-[#5bc827]/5 relative overflow-hidden">
            <button
              onClick={() => setShowLocalGanancias(!showLocalGanancias)}
              className="w-full text-left p-5 flex items-center justify-between gap-4 group focus:outline-none cursor-pointer"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-[#9a9da3] text-xs uppercase tracking-widest">
                    Ganancias del local
                  </p>
                  <span className="text-[10px] bg-[#5bc827]/10 text-[#5bc827] border border-[#5bc827]/30 px-2 py-0.5 rounded-full font-bold uppercase">
                    {localTimeframe === "hoy"
                      ? "Hoy"
                      : localTimeframe === "semana"
                        ? "Esta Semana"
                        : localTimeframe === "mes"
                          ? "Este Mes"
                          : localTimeframe === "anio"
                            ? "Este Año"
                            : fechaLocalSeleccionada.dia !== null
                              ? `${fechaLocalSeleccionada.dia} de ${MESES[fechaLocalSeleccionada.mes].toLowerCase()}, ${fechaLocalSeleccionada.anio}`
                              : `${MESES[fechaLocalSeleccionada.mes]} ${fechaLocalSeleccionada.anio}`}
                  </span>
                </div>
                <p
                  className="text-4xl font-bold text-[#5bc827]"
                  style={{ fontFamily: "Barlow Condensed, sans-serif" }}
                >
                  $
                  {ganancias.total.toLocaleString("es-MX", {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
              <div
                className={`w-8 h-8 rounded-xl bg-[#232427] border border-[#35373b] flex items-center justify-center transition-transform duration-300 ${
                  showLocalGanancias ? "rotate-180" : ""
                }`}
              >
                <span className="text-[#5bc827] text-xs">▼</span>
              </div>
            </button>

            {showLocalGanancias && (
              <div className="px-5 pb-5 border-t border-[#35373b]/60 pt-4 space-y-5 animate-fadeIn">
                <div>
                  <label className="text-xs text-[#9a9da3] uppercase tracking-wider font-semibold block mb-2">
                    Lapso de tiempo
                  </label>
                  <div className="grid grid-cols-5 gap-1.5 bg-[#1a1b1e] p-1.5 rounded-xl border border-[#35373b]">
                    {[
                      { id: "hoy", label: "Hoy" },
                      { id: "semana", label: "Semana" },
                      { id: "mes", label: "Mes" },
                      { id: "anio", label: "Año" },
                      { id: "personalizado", label: "📅 Elegir fecha" },
                    ].map((t) => (
                      <button
                        key={t.id}
                        onClick={() =>
                          setLocalTimeframe(t.id as LocalTimeframe)
                        }
                        className={`py-2 px-1 text-[11px] font-bold rounded-lg transition-all truncate cursor-pointer ${
                          localTimeframe === t.id
                            ? "bg-[#5bc827] text-[#1a1b1e] shadow-md shadow-[#5bc827]/20"
                            : "text-[#9a9da3] hover:text-white hover:bg-[#232427]"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Calendario Personalizado */}
                {localTimeframe === "personalizado" && (
                  <div className="bg-[#1a1b1e] border border-[#35373b] p-4 rounded-xl space-y-3 animate-fadeIn">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#35373b]/60">
                      {/* Selector de Mes */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            let newMes = fechaLocalSeleccionada.mes - 1
                            let newAnio = fechaLocalSeleccionada.anio
                            if (newMes < 0) {
                              newMes = 11
                              newAnio = Math.max(2023, newAnio - 1)
                            }
                            setFechaLocalSeleccionada((prev) => ({
                              ...prev,
                              mes: newMes,
                              anio: newAnio,
                            }))
                          }}
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#232427] border border-[#35373b] text-[#9a9da3] hover:text-white hover:border-[#5bc827] transition-colors"
                        >
                          ‹
                        </button>
                        <select
                          value={fechaLocalSeleccionada.mes}
                          onChange={(e) =>
                            setFechaLocalSeleccionada((prev) => ({
                              ...prev,
                              mes: Number(e.target.value),
                            }))
                          }
                          className="bg-[#232427] border border-[#35373b] text-white text-xs font-semibold rounded-lg px-2 py-1 outline-none focus:border-[#5bc827] transition-colors cursor-pointer"
                        >
                          {MESES.map((m, idx) => (
                            <option
                              key={m}
                              value={idx}
                              className="bg-[#1a1b1e] text-white"
                            >
                              {m}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => {
                            let newMes = fechaLocalSeleccionada.mes + 1
                            let newAnio = fechaLocalSeleccionada.anio
                            if (newMes > 11) {
                              newMes = 0
                              newAnio = Math.min(2026, newAnio + 1)
                            }
                            setFechaLocalSeleccionada((prev) => ({
                              ...prev,
                              mes: newMes,
                              anio: newAnio,
                            }))
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
                          disabled={fechaLocalSeleccionada.anio <= 2023}
                          onClick={() =>
                            setFechaLocalSeleccionada((prev) => ({
                              ...prev,
                              anio: Math.max(2023, prev.anio - 1),
                            }))
                          }
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#232427] border border-[#35373b] text-[#9a9da3] hover:text-white hover:border-[#5bc827] disabled:opacity-40 transition-colors"
                        >
                          ‹
                        </button>
                        <select
                          value={fechaLocalSeleccionada.anio}
                          onChange={(e) =>
                            setFechaLocalSeleccionada((prev) => ({
                              ...prev,
                              anio: Number(e.target.value),
                            }))
                          }
                          className="bg-[#232427] border border-[#35373b] text-white text-xs font-bold rounded-lg px-2 py-1 outline-none focus:border-[#5bc827] transition-colors cursor-pointer"
                        >
                          {[2023, 2024, 2025, 2026].map((yr) => (
                            <option
                              key={yr}
                              value={yr}
                              className="bg-[#1a1b1e] text-white"
                            >
                              {yr}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          disabled={fechaLocalSeleccionada.anio >= 2026}
                          onClick={() =>
                            setFechaLocalSeleccionada((prev) => ({
                              ...prev,
                              anio: Math.min(2026, prev.anio + 1),
                            }))
                          }
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#232427] border border-[#35373b] text-[#9a9da3] hover:text-white hover:border-[#5bc827] disabled:opacity-40 transition-colors"
                        >
                          ›
                        </button>
                      </div>
                    </div>

                    {/* Encabezado Días de la Semana */}
                    <div className="grid grid-cols-7 gap-1 text-center">
                      {DIAS_SEMANA.map((d) => (
                        <span
                          key={d}
                          className="text-[10px] text-[#9a9da3] font-bold uppercase py-1"
                        >
                          {d}
                        </span>
                      ))}
                    </div>

                    {/* Cuadrícula de Días */}
                    {(() => {
                      const firstDayIndex =
                        (new Date(
                          fechaLocalSeleccionada.anio,
                          fechaLocalSeleccionada.mes,
                          1,
                        ).getDay() +
                          6) %
                        7
                      const daysInMonth = new Date(
                        fechaLocalSeleccionada.anio,
                        fechaLocalSeleccionada.mes + 1,
                        0,
                      ).getDate()

                      return (
                        <div className="grid grid-cols-7 gap-1">
                          {Array.from({ length: firstDayIndex }).map((_, i) => (
                            <div key={`empty-${i}`} className="h-8" />
                          ))}

                          {Array.from(
                            { length: daysInMonth },
                            (_, i) => i + 1,
                          ).map((day) => {
                            const isSelected =
                              fechaLocalSeleccionada.dia === day
                            return (
                              <button
                                key={day}
                                type="button"
                                onClick={() =>
                                  setFechaLocalSeleccionada((prev) => ({
                                    ...prev,
                                    dia: day,
                                  }))
                                }
                                className={`h-8 text-xs font-semibold rounded-lg flex items-center justify-center transition-all ${
                                  isSelected
                                    ? "bg-[#5bc827] text-[#1a1b1e] font-bold shadow-md shadow-[#5bc827]/20 scale-105"
                                    : "bg-[#1a1b1e] border border-[#35373b] text-white hover:bg-[#232427] hover:border-[#5bc827]/40"
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
                        onClick={() =>
                          setFechaLocalSeleccionada((prev) => ({
                            ...prev,
                            dia: prev.dia || 1,
                          }))
                        }
                        className={`flex-1 py-2 px-2 text-xs font-bold rounded-lg border transition-all ${
                          fechaLocalSeleccionada.dia !== null
                            ? "bg-[#5bc827]/10 border-[#5bc827] text-[#5bc827]"
                            : "bg-[#1a1b1e] border-[#35373b] text-[#9a9da3] hover:text-white hover:bg-[#232427]"
                        }`}
                      >
                        Ver solo este día
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setFechaLocalSeleccionada((prev) => ({
                            ...prev,
                            dia: null,
                          }))
                        }
                        className={`flex-1 py-2 px-2 text-xs font-bold rounded-lg border transition-all ${
                          fechaLocalSeleccionada.dia === null
                            ? "bg-[#5bc827]/10 border-[#5bc827] text-[#5bc827]"
                            : "bg-[#1a1b1e] border-[#35373b] text-[#9a9da3] hover:text-white hover:bg-[#232427]"
                        }`}
                      >
                        Ver todo el mes
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-xs text-[#9a9da3] uppercase tracking-wider font-semibold mb-2">
                    Métodos de Pago
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-[#1a1b1e]/80 border border-[#35373b] p-3.5 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">💵</span>
                        <div>
                          <p className="text-xs text-[#9a9da3]">
                            Pago en Efectivo
                          </p>
                          <p className="text-lg font-bold text-white">
                            $
                            {ganancias.efectivo.toLocaleString("es-MX", {
                              minimumFractionDigits: 2,
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-[#1a1b1e]/80 border border-[#35373b] p-3.5 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">💳</span>
                        <div>
                          <p className="text-xs text-[#9a9da3]">
                            Pago en Tarjeta
                          </p>
                          <p className="text-lg font-bold text-white">
                            $
                            {ganancias.tarjeta.toLocaleString("es-MX", {
                              minimumFractionDigits: 2,
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-red-950/30 border border-red-900/40 p-3.5 rounded-xl flex items-center justify-between mt-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">📉</span>
                    <div>
                      <p className="text-xs text-red-400">
                        Comisión de la plataforma
                      </p>
                      <p className="text-lg font-bold text-red-300">
                        -$
                        {ganancias.comisionPlataforma.toLocaleString("es-MX", {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Botón de suspender/reactivar */}
          <button
            onClick={() => setShowConfirmSuspendLocal(true)}
            className={`w-full py-3.5 rounded-xl font-bold text-sm transition-colors cursor-pointer ${
              selectedLocal.status !== "Suspendido"
                ? "border border-red-800/50 text-red-400 hover:bg-red-900/20"
                : "bg-[#5bc827] hover:bg-[#7ed944] text-[#1a1b1e]"
            }`}
          >
            {selectedLocal.status !== "Suspendido"
              ? "Suspender local"
              : "Reactivar local"}
          </button>
        </div>

        {showConfirmSuspendLocal && (
          <div
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => setShowConfirmSuspendLocal(false)}
          >
            <div
              className="bg-[#232427] border border-[#35373b] rounded-2xl p-6 max-w-sm w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-white font-bold text-lg text-center mb-2">
                {selectedLocal.status !== "Suspendido"
                  ? "¿Suspender este local?"
                  : "¿Reactivar este local?"}
              </h3>
              <p className="text-[#9a9da3] text-sm text-center mb-5">
                {selectedLocal.status !== "Suspendido"
                  ? "Dejará de aparecer para los usuarios y no podrá recibir nuevos pedidos."
                  : "El local volverá a estar visible y podrá recibir pedidos normalmente."}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmSuspendLocal(false)}
                  className="flex-1 py-3 rounded-xl border border-[#35373b] text-[#c4c6ca] font-semibold hover:bg-[#1a1b1e] transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  disabled={updatingLocal}
                  onClick={handleToggleSuspendLocal}
                  className={`flex-1 py-3 rounded-xl font-bold transition-colors cursor-pointer disabled:opacity-50 ${
                    selectedLocal.status !== "Suspendido"
                      ? "bg-red-600 hover:bg-red-500 text-white"
                      : "bg-[#5bc827] hover:bg-[#7ed944] text-[#1a1b1e]"
                  }`}
                >
                  {updatingLocal ? "Procesando..." : "Confirmar"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (selectedRepartidor) {
    return (
      <div className="min-h-screen bg-[#1a1b1e] text-white pb-10">
        <header className="sticky top-0 z-40 bg-[#1a1b1e]/95 backdrop-blur-sm border-b border-[#35373b] px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setSelectedRepartidor(null)}
            className="text-[#9a9da3] hover:text-white transition-colors cursor-pointer"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <h1
            className="text-xl font-bold uppercase tracking-wide"
            style={{ fontFamily: "Barlow Condensed, sans-serif" }}
          >
            Detalle del repartidor
          </h1>
        </header>

        <div className="p-4 max-w-lg mx-auto w-full space-y-5">
          <div className="bg-[#232427] border border-[#35373b] rounded-2xl p-5 flex items-center gap-4">
            {selectedRepartidor.fotoUrl ? (
              <img
                src={getImageUrl(selectedRepartidor.fotoUrl)}
                alt={selectedRepartidor.name}
                className="w-14 h-14 rounded-full object-cover border-2 border-[#d9a05b]"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-[#d9a05b]/20 border-2 border-[#d9a05b] flex items-center justify-center text-xl font-bold text-[#d9a05b]">
                {selectedRepartidor.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </div>
            )}
            <div className="flex-1">
              <h2 className="font-bold text-lg text-white">
                {selectedRepartidor.name}{" "}
                <span className="text-[#d9a05b] text-sm">
                  ★ {selectedRepartidor.rating}
                </span>
              </h2>
              <p className="text-[#9a9da3] text-xs font-mono">
                {selectedRepartidor.mat}
              </p>
              <span
                className={`inline-block mt-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                  selectedRepartidor.status === "Activo"
                    ? "text-[#5bc827] bg-[#5bc827]/10"
                    : selectedRepartidor.status === "Pendiente"
                      ? "text-amber-400 bg-amber-400/10"
                      : selectedRepartidor.status === "Rechazado"
                        ? "text-red-400 bg-red-400/10"
                        : "text-orange-400 bg-orange-400/10"
                }`}
              >
                {selectedRepartidor.status}
              </span>
            </div>
          </div>

          <div className="bg-[#232427] border border-[#35373b] rounded-2xl p-5 space-y-3">
            <h3 className="text-[#9a9da3] text-xs uppercase tracking-widest font-semibold mb-2">
              Información general
            </h3>
            <InfoRow label="Teléfono" value={selectedRepartidor.telefono} />
            <InfoRow label="Vehículo" value={selectedRepartidor.vehiculo} />
            <InfoRow label="Dirección" value={selectedRepartidor.direccion} />
            <InfoRow
              label="Fecha de alta"
              value={selectedRepartidor.fechaAlta}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="Entregas totales"
              value={String(selectedRepartidor.entregasTotales)}
              icon="📦"
            />
            <StatCard
              label="Ganancias totales"
              value={`$${selectedRepartidor.gananciasTotales.toLocaleString("es-MX")}`}
              icon="💰"
            />
          </div>

          {selectedRepartidor.status !== "Rechazado" &&
            selectedRepartidor.status !== "Pendiente" && (
              <button
                onClick={() => setShowConfirmSuspendRepartidor(true)}
                className={`w-full py-3.5 rounded-xl font-bold text-sm transition-colors cursor-pointer ${
                  selectedRepartidor.status === "Activo"
                    ? "border border-red-800/50 text-red-400 hover:bg-red-900/20"
                    : "bg-[#5bc827] hover:bg-[#7ed944] text-[#1a1b1e]"
                }`}
              >
                {selectedRepartidor.status === "Activo"
                  ? "Suspender repartidor"
                  : "Reactivar repartidor"}
              </button>
            )}
        </div>

        {showConfirmSuspendRepartidor && (
          <div
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => setShowConfirmSuspendRepartidor(false)}
          >
            <div
              className="bg-[#232427] border border-[#35373b] rounded-2xl p-6 max-w-sm w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-white font-bold text-lg text-center mb-2">
                {selectedRepartidor.status === "Activo"
                  ? "¿Suspender a este repartidor?"
                  : "¿Reactivar a este repartidor?"}
              </h3>
              <p className="text-[#9a9da3] text-sm text-center mb-5">
                {selectedRepartidor.status === "Activo"
                  ? "No podrá recibir nuevas asignaciones de pedidos hasta que se reactive."
                  : "El repartidor volverá a poder recibir pedidos normalmente."}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmSuspendRepartidor(false)}
                  className="flex-1 py-3 rounded-xl border border-[#35373b] text-[#c4c6ca] font-semibold hover:bg-[#1a1b1e] transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  disabled={updatingRepartidor}
                  onClick={handleToggleSuspendRepartidor}
                  className={`flex-1 py-3 rounded-xl font-bold transition-colors cursor-pointer disabled:opacity-50 ${
                    selectedRepartidor.status === "Activo"
                      ? "bg-red-600 hover:bg-red-500 text-white"
                      : "bg-[#5bc827] hover:bg-[#7ed944] text-[#1a1b1e]"
                  }`}
                >
                  {updatingRepartidor ? "Procesando..." : "Confirmar"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (legalView === "terminos") return <Terminos onBack={() => setLegalView(null)} />
  if (legalView === "privacidad") return <Privacidad onBack={() => setLegalView(null)} />

  return (
    <div className="min-h-screen bg-[#1a1b1e] text-white pb-20">
      <TopBar />
      <main className="p-4 max-w-5xl mx-auto">
        {activeTab === "dashboard" && (
          <div>
            <Title text="Dashboard" />
            {/* TODO: reemplazar con datos reales del backend (GET /api/admin/stats) */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <StatCard
                label="Usuarios Totales"
                value={String(usuarios.length)}
                icon="👥"
                onClick={() => setActiveTab("usuarios")}
              />
              <StatCard
                label="Locales Activos"
                value={String(
                  locales.filter((l) => l.status === "Activo").length,
                )}
                icon="🏪"
                onClick={() => setActiveTab("locales")}
              />
              <StatCard
                label="Repartidores"
                value={String(repartidores.length)}
                icon="🏍️"
                onClick={() => setActiveTab("repartidores")}
              />
              <StatCard
                label="Pedidos de Hoy"
                value={String(
                  adminOrders.filter((o) =>
                    isOrderInTimeframe(o.createdAt, "hoy", fechaSeleccionada),
                  ).length,
                )}
                icon="📦"
                onClick={() => setActiveTab("pedidos")}
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
                    <p className="text-[#9a9da3] text-xs uppercase tracking-widest">
                      Ingresos de la plataforma
                    </p>
                    <span className="text-[10px] bg-[#d9a05b]/10 text-[#d9a05b] border border-[#d9a05b]/30 px-2 py-0.5 rounded-full font-bold uppercase">
                      {selectedTimeframe === "hoy"
                        ? "Hoy"
                        : selectedTimeframe === "semana"
                          ? "Esta Semana"
                          : selectedTimeframe === "mes"
                            ? "Este Mes"
                            : selectedTimeframe === "anio"
                              ? "Este Año"
                              : fechaSeleccionada.dia !== null
                                ? `${fechaSeleccionada.dia} de ${MESES[fechaSeleccionada.mes].toLowerCase()}, ${fechaSeleccionada.anio}`
                                : `${MESES[fechaSeleccionada.mes]} ${fechaSeleccionada.anio}`}
                    </span>
                  </div>
                  <p
                    className="text-4xl font-bold text-[#d9a05b]"
                    style={{ fontFamily: "Barlow Condensed, sans-serif" }}
                  >
                    $
                    {currentIngresos.total.toLocaleString("es-MX", {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#9a9da3] group-hover:text-white transition-colors hidden sm:inline">
                    {showIngresosDetails ? "Ocultar detalles" : "Ver detalles"}
                  </span>
                  <div
                    className={`w-8 h-8 rounded-xl bg-[#232427] border border-[#35373b] group-hover:border-[#d9a05b]/50 flex items-center justify-center transition-transform duration-300 ${
                      showIngresosDetails ? "rotate-180" : ""
                    }`}
                  >
                    <span className="text-[#d9a05b] text-xs">▼</span>
                  </div>
                </div>
              </button>

              {/* Contenido Desplegable */}
              {showIngresosDetails && (
                <div className="px-5 pb-5 border-t border-[#35373b]/60 pt-4 space-y-5 animate-fadeIn">
                  {/* Selector de Lapsos de Tiempo */}
                  <div>
                    <label className="text-xs text-[#9a9da3] uppercase tracking-wider font-semibold block mb-2">
                      Lapso de tiempo
                    </label>
                    <div className="grid grid-cols-5 gap-1.5 bg-[#1a1b1e] p-1.5 rounded-xl border border-[#35373b]">
                      {[
                        { id: "hoy", label: "Hoy" },
                        { id: "semana", label: "Semana" },
                        { id: "mes", label: "Mes" },
                        { id: "anio", label: "Año" },
                        { id: "personalizado", label: "📅 Elegir fecha" },
                      ].map((t) => (
                        <button
                          key={t.id}
                          onClick={() =>
                            setSelectedTimeframe(t.id as Timeframe)
                          }
                          className={`py-2 px-1 text-[11px] font-bold rounded-lg transition-all truncate ${
                            selectedTimeframe === t.id
                              ? "bg-[#d9a05b] text-[#1a1b1e] shadow-md shadow-[#d9a05b]/20"
                              : "text-[#9a9da3] hover:text-white hover:bg-[#232427]"
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Calendario Personalizado */}
                  {selectedTimeframe === "personalizado" && (
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
                              setFechaSeleccionada((prev) => ({
                                ...prev,
                                mes: newMes,
                                anio: newAnio,
                              }))
                            }}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#232427] border border-[#35373b] text-[#9a9da3] hover:text-white hover:border-[#d9a05b] transition-colors"
                          >
                            ‹
                          </button>
                          <select
                            value={fechaSeleccionada.mes}
                            onChange={(e) =>
                              setFechaSeleccionada((prev) => ({
                                ...prev,
                                mes: Number(e.target.value),
                              }))
                            }
                            className="bg-[#232427] border border-[#35373b] text-white text-xs font-semibold rounded-lg px-2 py-1 outline-none focus:border-[#d9a05b] transition-colors cursor-pointer"
                          >
                            {MESES.map((m, idx) => (
                              <option
                                key={m}
                                value={idx}
                                className="bg-[#1a1b1e] text-white"
                              >
                                {m}
                              </option>
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
                              setFechaSeleccionada((prev) => ({
                                ...prev,
                                mes: newMes,
                                anio: newAnio,
                              }))
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
                            onClick={() =>
                              setFechaSeleccionada((prev) => ({
                                ...prev,
                                anio: Math.max(2023, prev.anio - 1),
                              }))
                            }
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#232427] border border-[#35373b] text-[#9a9da3] hover:text-white hover:border-[#d9a05b] disabled:opacity-40 transition-colors"
                          >
                            ‹
                          </button>
                          <select
                            value={fechaSeleccionada.anio}
                            onChange={(e) =>
                              setFechaSeleccionada((prev) => ({
                                ...prev,
                                anio: Number(e.target.value),
                              }))
                            }
                            className="bg-[#232427] border border-[#35373b] text-white text-xs font-bold rounded-lg px-2 py-1 outline-none focus:border-[#d9a05b] transition-colors cursor-pointer"
                          >
                            {[2023, 2024, 2025, 2026].map((yr) => (
                              <option
                                key={yr}
                                value={yr}
                                className="bg-[#1a1b1e] text-white"
                              >
                                {yr}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            disabled={fechaSeleccionada.anio >= 2026}
                            onClick={() =>
                              setFechaSeleccionada((prev) => ({
                                ...prev,
                                anio: Math.min(2026, prev.anio + 1),
                              }))
                            }
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#232427] border border-[#35373b] text-[#9a9da3] hover:text-white hover:border-[#d9a05b] disabled:opacity-40 transition-colors"
                          >
                            ›
                          </button>
                        </div>
                      </div>

                      {/* Encabezado Días de la Semana */}
                      <div className="grid grid-cols-7 gap-1 text-center">
                        {DIAS_SEMANA.map((d) => (
                          <span
                            key={d}
                            className="text-[10px] text-[#9a9da3] font-bold uppercase py-1"
                          >
                            {d}
                          </span>
                        ))}
                      </div>

                      {/* Cuadrícula de Días */}
                      {(() => {
                        const firstDayIndex =
                          (new Date(
                            fechaSeleccionada.anio,
                            fechaSeleccionada.mes,
                            1,
                          ).getDay() +
                            6) %
                          7
                        const daysInMonth = new Date(
                          fechaSeleccionada.anio,
                          fechaSeleccionada.mes + 1,
                          0,
                        ).getDate()

                        return (
                          <div className="grid grid-cols-7 gap-1">
                            {Array.from({ length: firstDayIndex }).map(
                              (_, i) => (
                                <div key={`empty-${i}`} className="h-8" />
                              ),
                            )}

                            {Array.from(
                              { length: daysInMonth },
                              (_, i) => i + 1,
                            ).map((day) => {
                              const isSelected = fechaSeleccionada.dia === day
                              return (
                                <button
                                  key={day}
                                  type="button"
                                  onClick={() =>
                                    setFechaSeleccionada((prev) => ({
                                      ...prev,
                                      dia: day,
                                    }))
                                  }
                                  className={`h-8 text-xs font-semibold rounded-lg flex items-center justify-center transition-all ${
                                    isSelected
                                      ? "bg-[#d9a05b] text-[#1a1b1e] font-bold shadow-md shadow-[#d9a05b]/20 scale-105"
                                      : "bg-[#1a1b1e] border border-[#35373b] text-white hover:bg-[#232427] hover:border-[#d9a05b]/40"
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
                          onClick={() =>
                            setFechaSeleccionada((prev) => ({
                              ...prev,
                              dia: prev.dia || 1,
                            }))
                          }
                          className={`flex-1 py-2 px-2 text-xs font-bold rounded-lg border transition-all ${
                            fechaSeleccionada.dia !== null
                              ? "bg-[#d9a05b]/10 border-[#d9a05b] text-[#d9a05b]"
                              : "bg-[#1a1b1e] border-[#35373b] text-[#9a9da3] hover:text-white hover:bg-[#232427]"
                          }`}
                        >
                          Ver solo este día
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setFechaSeleccionada((prev) => ({
                              ...prev,
                              dia: null,
                            }))
                          }
                          className={`flex-1 py-2 px-2 text-xs font-bold rounded-lg border transition-all ${
                            fechaSeleccionada.dia === null
                              ? "bg-[#d9a05b]/10 border-[#d9a05b] text-[#d9a05b]"
                              : "bg-[#1a1b1e] border-[#35373b] text-[#9a9da3] hover:text-white hover:bg-[#232427]"
                          }`}
                        >
                          Ver todo el mes
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Desglose por Método de Pago */}
                  <div>
                    <p className="text-xs text-[#9a9da3] uppercase tracking-wider font-semibold mb-2">
                      Métodos de Pago
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-[#1a1b1e]/80 border border-[#35373b] p-3.5 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">💵</span>
                          <div>
                            <p className="text-xs text-[#9a9da3]">
                              Pago en Efectivo
                            </p>
                            <p className="text-lg font-bold text-white">
                              $
                              {currentIngresos.efectivo.toLocaleString(
                                "es-MX",
                                { minimumFractionDigits: 2 },
                              )}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-mono text-[#9a9da3]">
                          {currentIngresos.total > 0
                            ? (
                                (currentIngresos.efectivo /
                                  currentIngresos.total) *
                                100
                              ).toFixed(0)
                            : "0"}
                          %
                        </span>
                      </div>

                      <div className="bg-[#1a1b1e]/80 border border-[#35373b] p-3.5 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">💳</span>
                          <div>
                            <p className="text-xs text-[#9a9da3]">
                              Pago en Tarjeta
                            </p>
                            <p className="text-lg font-bold text-white">
                              $
                              {currentIngresos.tarjeta.toLocaleString("es-MX", {
                                minimumFractionDigits: 2,
                              })}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-mono text-[#9a9da3]">
                          {currentIngresos.total > 0
                            ? (
                                (currentIngresos.tarjeta /
                                  currentIngresos.total) *
                                100
                              ).toFixed(0)
                            : "0"}
                          %
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Desglose por Origen de Comisión */}
                  <div>
                    <p className="text-xs text-[#9a9da3] uppercase tracking-wider font-semibold mb-2">
                      Desglose de Comisiones
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-[#1a1b1e]/80 border border-[#35373b] p-3.5 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">👤</span>
                          <div>
                            <p className="text-xs text-[#9a9da3]">
                              Comisión del Usuario
                            </p>
                            <p className="text-lg font-bold text-[#5bc827]">
                              $
                              {currentIngresos.comisionUsuario.toLocaleString(
                                "es-MX",
                                { minimumFractionDigits: 2 },
                              )}
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] text-[#9a9da3] bg-[#35373b]/50 px-2 py-1 rounded">
                          Cargo servicio
                        </span>
                      </div>

                      <div className="bg-[#1a1b1e]/80 border border-[#35373b] p-3.5 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">🏪</span>
                          <div>
                            <p className="text-xs text-[#9a9da3]">
                              Comisión de Locales
                            </p>
                            <p className="text-lg font-bold text-[#d9a05b]">
                              $
                              {currentIngresos.comisionLocales.toLocaleString(
                                "es-MX",
                                { minimumFractionDigits: 2 },
                              )}
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] text-[#9a9da3] bg-[#35373b]/50 px-2 py-1 rounded">
                          % por venta
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "usuarios" && (
          <div>
            <Title text="Usuarios" />
            {loadingUsuarios ? (
              <div className="flex flex-col items-center justify-center py-12 text-center bg-[#232427] border border-[#35373b] rounded-xl">
                <div className="w-8 h-8 border-2 border-[#d9a05b] border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-[#9a9da3] text-sm">Cargando usuarios...</p>
              </div>
            ) : usuarios.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center bg-[#232427] border border-[#35373b] rounded-xl">
                <span className="text-4xl mb-2">👥</span>
                <p className="text-white font-semibold text-sm">
                  No hay usuarios registrados
                </p>
                <p className="text-[#9a9da3] text-xs mt-1">
                  Los clientes de la plataforma aparecerán aquí
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {usuarios.map((u) => (
                  <div
                    key={u.id}
                    className="bg-[#232427] border border-[#35373b] hover:border-[#d9a05b]/50 p-4 rounded-xl flex items-center justify-between transition-colors"
                  >
                    <div>
                      <p className="font-bold text-sm text-white">{u.name}</p>
                      <p className="text-[#9a9da3] text-xs">{u.email}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`${
                          u.status === "Activo"
                            ? "text-[#5bc827] bg-[#5bc827]/10"
                            : "text-red-400 bg-red-400/10"
                        } text-[10px] uppercase font-bold px-2 py-1 rounded`}
                      >
                        {u.status}
                      </span>
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
            )}
          </div>
        )}

        {activeTab === "locales" && (
          <div>
            <Title text="Locales y Restaurantes" />
            {loadingLocales ? (
              <div className="flex flex-col items-center justify-center py-12 text-center bg-[#232427] border border-[#35373b] rounded-xl">
                <div className="w-8 h-8 border-2 border-[#d9a05b] border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-[#9a9da3] text-sm">Cargando locales...</p>
              </div>
            ) : locales.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center bg-[#232427] border border-[#35373b] rounded-xl">
                <span className="text-4xl mb-2">🏪</span>
                <p className="text-white font-semibold text-sm">
                  No hay locales registrados
                </p>
                <p className="text-[#9a9da3] text-xs mt-1">
                  Los restaurantes de la plataforma aparecerán aquí
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {locales.map((l) => (
                  <div
                    key={l.id}
                    className="bg-[#232427] border border-[#35373b] hover:border-[#d9a05b]/50 p-4 rounded-xl flex items-center justify-between transition-colors"
                  >
                    <div>
                      <p className="font-bold text-sm text-white">{l.name}</p>
                      <p className="text-[#9a9da3] text-xs">{l.categoria}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`${l.statusColor} ${l.bg} text-[10px] uppercase font-bold px-2 py-1 rounded`}
                      >
                        {l.status}
                      </span>
                      {l.status === "Pendiente" ? (
                        <button
                          disabled={updatingLocal}
                          onClick={() => handleApproveLocal(l.id)}
                          className="text-xs font-semibold bg-[#d9a05b] hover:bg-[#e0b07a] text-[#1a1b1e] px-3 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                        >
                          Aprobar
                        </button>
                      ) : (
                        <button
                          onClick={() => setSelectedLocal(l)}
                          className="text-xs font-semibold bg-[#35373b] hover:bg-[#5bc827] hover:text-[#1a1b1e] text-white px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          Ver
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "repartidores" && (
          <div>
            <Title text="Repartidores" />
            {loadingRepartidores ? (
              <div className="flex flex-col items-center justify-center py-12 text-center bg-[#232427] border border-[#35373b] rounded-xl">
                <div className="w-8 h-8 border-2 border-[#d9a05b] border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-[#9a9da3] text-sm">
                  Cargando repartidores...
                </p>
              </div>
            ) : repartidores.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center bg-[#232427] border border-[#35373b] rounded-xl">
                <span className="text-4xl mb-2">🏍️</span>
                <p className="text-white font-semibold text-sm">
                  No hay repartidores registrados
                </p>
                <p className="text-[#9a9da3] text-xs mt-1">
                  Los repartidores de la plataforma aparecerán aquí
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {repartidores.map((r) => (
                  <div
                    key={r.id}
                    className="bg-[#232427] border border-[#35373b] hover:border-[#d9a05b]/50 p-4 rounded-xl flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {r.fotoUrl ? (
                        <img
                          src={getImageUrl(r.fotoUrl)}
                          alt={r.name}
                          className="w-10 h-10 rounded-full object-cover border border-[#d9a05b]/40 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#d9a05b]/20 border border-[#d9a05b]/40 flex items-center justify-center text-xs font-bold text-[#d9a05b] flex-shrink-0">
                          {r.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-sm text-white">
                          {r.name}{" "}
                          {r.status !== "Pendiente" && (
                            <span className="text-[#d9a05b] ml-1">
                              ★ {r.rating}
                            </span>
                          )}
                        </p>
                        <p className="text-[#9a9da3] text-xs font-mono mt-0.5">
                          {r.mat}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-1 rounded ${
                          r.status === "Activo"
                            ? "text-[#5bc827] bg-[#5bc827]/10"
                            : r.status === "Pendiente"
                              ? "text-amber-400 bg-amber-400/10"
                              : r.status === "Rechazado"
                                ? "text-red-400 bg-red-400/10"
                                : "text-orange-400 bg-orange-400/10"
                        }`}
                      >
                        {r.status}
                      </span>
                      {r.status === "Pendiente" ? (
                        <>
                          <button
                            disabled={updatingRepartidor}
                            onClick={() => handleApproveRepartidor(r.id)}
                            className="text-xs font-semibold bg-[#5bc827] hover:bg-[#7ed944] text-[#1a1b1e] px-3 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                          >
                            Aprobar
                          </button>
                          <button
                            disabled={updatingRepartidor}
                            onClick={() => setShowConfirmRechazarRepartidor(r)}
                            className="text-xs font-semibold border border-red-800/50 text-red-400 hover:bg-red-900/20 px-3 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                          >
                            Rechazar
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setSelectedRepartidor(r)}
                          className="text-xs bg-[#35373b] hover:bg-[#5bc827] hover:text-[#1a1b1e] text-white px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          Ver
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "pedidos" && (
          <div>
            <Title text="Visión global de pedidos" />

            {/* Filtros por estado */}
            <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-4 hide-scrollbar">
              {[
                { id: "TODOS", label: "Todos" },
                { id: "PENDIENTE", label: "Pendientes" },
                { id: "EN_PREPARACION", label: "En Preparación" },
                { id: "EN_CAMINO", label: "En Camino" },
                { id: "ENTREGADO", label: "Entregados" },
                { id: "CANCELADO", label: "Cancelados" },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => handleFilterPedidos(f.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                    pedidosEstadoFilter === f.id
                      ? "bg-[#d9a05b] text-[#1a1b1e]"
                      : "bg-[#232427] border border-[#35373b] text-[#9a9da3] hover:text-white hover:border-[#d9a05b]/40"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {loadingPedidosList ? (
              <div className="flex flex-col items-center justify-center py-12 text-center bg-[#232427] border border-[#35373b] rounded-xl">
                <div className="w-8 h-8 border-2 border-[#d9a05b] border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-[#9a9da3] text-sm">Cargando pedidos...</p>
              </div>
            ) : pedidosList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center bg-[#232427] border border-[#35373b] rounded-xl">
                <span className="text-4xl mb-2">📦</span>
                <p className="text-white font-semibold text-sm">
                  {pedidosEstadoFilter === "TODOS"
                    ? "No hay pedidos registrados"
                    : `No hay pedidos con estado ${pedidosEstadoFilter}`}
                </p>
                <p className="text-[#9a9da3] text-xs mt-1">
                  Los pedidos de la plataforma aparecerán aquí
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pedidosList.map((order) => {
                  let badgeColor =
                    "text-amber-400 bg-amber-400/10 border-amber-400/30"
                  let estadoLabel = order.estado
                  if (order.estado === "PENDIENTE") {
                    badgeColor =
                      "text-amber-400 bg-amber-400/10 border-amber-400/30"
                    estadoLabel = "Pendiente"
                  } else if (order.estado === "EN_PREPARACION") {
                    badgeColor =
                      "text-blue-400 bg-blue-400/10 border-blue-400/30"
                    estadoLabel = "En Preparación"
                  } else if (order.estado === "EN_CAMINO") {
                    badgeColor =
                      "text-purple-400 bg-purple-400/10 border-purple-400/30"
                    estadoLabel = "En Camino"
                  } else if (order.estado === "ENTREGADO") {
                    badgeColor =
                      "text-[#5bc827] bg-[#5bc827]/10 border-[#5bc827]/30"
                    estadoLabel = "Entregado"
                  } else if (order.estado === "CANCELADO") {
                    badgeColor = "text-red-400 bg-red-400/10 border-red-400/30"
                    estadoLabel = "Cancelado"
                  }

                  const fechaFormateada = order.createdAt
                    ? new Date(order.createdAt).toLocaleString("es-MX", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })
                    : "Reciente"

                  const esEfectivo =
                    (order.metodoPago || "").toUpperCase() === "EFECTIVO"

                  return (
                    <div
                      key={order.id}
                      className="bg-[#232427] border border-[#35373b] hover:border-[#d9a05b]/50 p-4 rounded-xl transition-colors space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-[#d9a05b] font-bold bg-[#d9a05b]/10 border border-[#d9a05b]/30 px-2 py-0.5 rounded">
                            #{order.id.slice(0, 8)}
                          </span>
                          <span className="text-[#9a9da3] text-xs">
                            {fechaFormateada}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${badgeColor}`}
                        >
                          {estadoLabel}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-[#9a9da3]">Restaurante</p>
                          <p className="font-semibold text-white truncate">
                            {order.restaurant?.nombre || "Restaurante"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[#9a9da3]">Cliente</p>
                          <p className="font-semibold text-white truncate">
                            {order.user?.nombre || "Cliente"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-[#35373b]/60">
                        <div className="flex items-center gap-1.5 text-xs text-[#c4c6ca]">
                          <span>{esEfectivo ? "💵" : "💳"}</span>
                          <span>{esEfectivo ? "Efectivo" : "Tarjeta"}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[#9a9da3] text-xs mr-1">
                            Total:
                          </span>
                          <span className="text-sm font-bold text-white">
                            ${Number(order.total).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "config" && (
          <div>
            <Title text="Comisiones y Ajustes" />

            <div className="space-y-4">
              <div className="bg-[#232427] border border-[#35373b] p-5 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#d9a05b]/20 border border-[#d9a05b] flex items-center justify-center text-lg font-bold text-[#d9a05b]">
                    🛡️
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">
                      {currentUser?.nombre || "Administrador"}
                    </h3>
                    <p className="text-[#9a9da3] text-xs">
                      {currentUser?.email || "admin@sierraapp.com"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setEditProfileOpen(true)}
                  className="px-3 py-1.5 rounded-xl border border-[#d9a05b]/40 text-[#d9a05b] text-xs font-semibold hover:bg-[#d9a05b]/10 transition-colors cursor-pointer"
                >
                  Editar mi cuenta
                </button>
              </div>

              <div className="bg-[#232427] border border-[#35373b] p-5 rounded-2xl">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">🏪</span>
                  <div>
                    <h3 className="font-bold text-white">Comisión del local</h3>
                    <p className="text-[#9a9da3] text-xs">
                      Porcentaje que se cobra al restaurante por venta.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={comisionLocal}
                    onChange={(e) => setComisionLocal(Number(e.target.value))}
                    className="w-full bg-[#1a1b1e] border border-[#35373b] focus:border-[#d9a05b] rounded-xl px-4 py-3 text-sm text-white outline-none transition-colors"
                  />
                  <span className="text-[#c4c6ca] font-bold">%</span>
                </div>
                <p className="text-[#9a9da3] text-[10px] mt-2">
                  Valor actual: {comisionLocal}%
                </p>
              </div>

              <div className="bg-[#232427] border border-[#35373b] p-5 rounded-2xl">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">🏍️</span>
                  <div>
                    <h3 className="font-bold text-white">
                      Comisión al repartidor
                    </h3>
                    <p className="text-[#9a9da3] text-xs">
                      Monto fijo que se paga al repartidor por entrega.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#c4c6ca] font-bold">$</span>
                  <input
                    type="number"
                    value={comisionRepartidor}
                    onChange={(e) =>
                      setComisionRepartidor(Number(e.target.value))
                    }
                    className="w-full bg-[#1a1b1e] border border-[#35373b] focus:border-[#d9a05b] rounded-xl px-4 py-3 text-sm text-white outline-none transition-colors"
                  />
                </div>
                <p className="text-[#9a9da3] text-[10px] mt-2">
                  Valor actual: ${comisionRepartidor}
                </p>
              </div>

              <div className="bg-[#232427] border border-[#35373b] p-5 rounded-2xl">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">👤</span>
                  <div>
                    <h3 className="font-bold text-white">
                      Comisión al usuario
                    </h3>
                    <p className="text-[#9a9da3] text-xs">
                      Monto fijo cobrado como cargo por servicio.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#c4c6ca] font-bold">$</span>
                  <input
                    type="number"
                    value={comisionUsuario}
                    onChange={(e) => setComisionUsuario(Number(e.target.value))}
                    className="w-full bg-[#1a1b1e] border border-[#35373b] focus:border-[#d9a05b] rounded-xl px-4 py-3 text-sm text-white outline-none transition-colors"
                  />
                </div>
                <p className="text-[#9a9da3] text-[10px] mt-2">
                  Valor actual: ${comisionUsuario}
                </p>
              </div>

              {/* Zonas de cobertura */}
              <div className="bg-[#232427] p-5 rounded-2xl border border-[#35373b] mt-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-white text-sm font-bold">Zonas de cobertura activas</h3>
                    <p className="text-[#9a9da3] text-xs">
                      Gestión de colonias y sectores con servicio de entrega.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setNewZoneName("")
                      setZoneActionError(null)
                      setZoneModalOpen(true)
                    }}
                    className="border border-dashed border-[#d9a05b] text-[#d9a05b] hover:bg-[#d9a05b]/10 px-3 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                  >
                    + Añadir zona
                  </button>
                </div>

                {zoneActionError && (
                  <div className="mb-3 p-2.5 rounded-xl bg-red-900/30 border border-red-500/40 text-red-300 text-xs">
                    {zoneActionError}
                  </div>
                )}

                {loadingZones ? (
                  <div className="py-4 text-center text-xs text-[#9a9da3]">
                    Cargando zonas de cobertura...
                  </div>
                ) : zones.length === 0 ? (
                  <div className="py-4 text-center text-xs text-[#9a9da3]">
                    No hay zonas registradas aún. Haz clic en "+ Añadir zona" para registrar una.
                  </div>
                ) : (
                  <div className="space-y-2 mt-2">
                    {zones.map((zone) => (
                      <div
                        key={zone.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-[#1a1b1e] border border-[#35373b]"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-sm">📍</span>
                          <div>
                            <span className="text-sm font-semibold text-white block">
                              {zone.nombre}
                            </span>
                            <span
                              className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                zone.activa
                                  ? "bg-[#5bc827]/20 text-[#5bc827] border border-[#5bc827]/40"
                                  : "bg-[#35373b]/50 text-[#9a9da3] border border-[#35373b]"
                              }`}
                            >
                              {zone.activa ? "Activa" : "Inactiva"}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleZone(zone.id, zone.activa)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                              zone.activa
                                ? "bg-[#35373b]/60 hover:bg-[#35373b] text-[#c4c6ca]"
                                : "bg-[#5bc827]/20 hover:bg-[#5bc827]/30 text-[#5bc827] border border-[#5bc827]/40"
                            }`}
                          >
                            {zone.activa ? "Desactivar" : "Activar"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteZone(zone.id, zone.nombre)}
                            className="p-1.5 rounded-lg text-[#9a9da3] hover:text-red-400 hover:bg-red-950/30 transition-colors cursor-pointer"
                            title="Eliminar zona"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Documentación Legal y Privacidad */}
              <div className="bg-[#232427] p-5 rounded-2xl border border-[#35373b] mt-5">
                <label className="text-[#c4c6ca] text-xs font-semibold block mb-3">
                  Documentación legal de la plataforma
                </label>
                <div className="flex gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setLegalView("terminos")}
                    className="px-3.5 py-2 rounded-xl bg-[#1a1b1e] border border-[#35373b] hover:border-[#d9a05b] text-white text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <span>📋</span>
                    <span>Términos y condiciones</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLegalView("privacidad")}
                    className="px-3.5 py-2 rounded-xl bg-[#1a1b1e] border border-[#35373b] hover:border-[#d9a05b] text-white text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <span>🔒</span>
                    <span>Aviso de Privacidad</span>
                  </button>
                </div>
              </div>

              <div className="bg-[#1a1b1e] border border-[#35373b] p-4 rounded-xl mt-5">
                <p className="text-xs text-[#9a9da3] leading-relaxed">
                  <span className="text-[#d9a05b] font-bold">Simulación:</span>{" "}
                  En un pedido de $200, el local recibe $
                  {(200 * (1 - comisionLocal / 100)).toFixed(2)}, el repartidor
                  ${comisionRepartidor}, la plataforma cobra ${comisionUsuario}{" "}
                  al usuario y se queda con $
                  {(
                    200 * (comisionLocal / 100) +
                    comisionUsuario -
                    comisionRepartidor
                  ).toFixed(2)}{" "}
                  de comisión total.
                </p>
              </div>

              <button
                onClick={handleSaveConfig}
                disabled={savingConfig || loadingConfig}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-[#d9a05b] to-[#b38346] shadow-lg shadow-[#d9a05b]/20 text-[#1a1b1e] font-bold text-sm mt-5 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                {savingConfig
                  ? "Guardando cambios..."
                  : showToast
                    ? "Cambios guardados ✓"
                    : "Guardar cambios"}
              </button>
            </div>
          </div>
        )}

        {activeTab === "soporte" && (
          <div>
            {!selectedConversationUser ? (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      Soporte y Mensajes
                    </h2>
                    <p className="text-xs text-[#9a9da3] mt-0.5">
                      Conversaciones en tiempo real con usuarios, locales y
                      repartidores
                    </p>
                  </div>
                  <button
                    onClick={loadConversations}
                    disabled={loadingConversations}
                    className="p-2.5 rounded-xl bg-[#232427] border border-[#35373b] text-[#c4c6ca] hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                    title="Recargar conversaciones"
                  >
                    🔄
                  </button>
                </div>

                {loadingConversations ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="bg-[#232427] border border-[#35373b] p-4 rounded-xl animate-pulse flex items-center justify-between"
                      >
                        <div className="space-y-2">
                          <div className="h-4 bg-[#35373b] rounded w-32" />
                          <div className="h-3 bg-[#35373b] rounded w-48" />
                        </div>
                        <div className="h-8 bg-[#35373b] rounded-lg w-20" />
                      </div>
                    ))}
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="bg-[#232427] border border-[#35373b] rounded-2xl p-8 text-center">
                    <span className="text-4xl block mb-2">💬</span>
                    <p className="text-white font-medium">
                      No hay mensajes de soporte
                    </p>
                    <p className="text-[#9a9da3] text-xs mt-1">
                      Los mensajes que envíen los usuarios, locales o
                      repartidores aparecerán aquí.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {conversations.map((conv) => {
                      const rolBadge =
                        conv.user.rol === "LOCAL"
                          ? {
                              text: "Local",
                              bg: "bg-blue-500/10 text-blue-400 border-blue-500/30",
                            }
                          : conv.user.rol === "REPARTIDOR"
                            ? {
                                text: "Repartidor",
                                bg: "bg-purple-500/10 text-purple-400 border-purple-500/30",
                              }
                            : {
                                text: "Usuario",
                                bg: "bg-[#5bc827]/10 text-[#5bc827] border-[#5bc827]/30",
                              }

                      return (
                        <div
                          key={conv.user.id}
                          className="bg-[#232427] border border-[#35373b] hover:border-[#d9a05b]/40 rounded-xl p-4 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-full bg-[#1a1b1e] border border-[#35373b] flex items-center justify-center text-sm font-bold text-[#d9a05b] shrink-0">
                              {conv.user.nombre?.charAt(0).toUpperCase() || "U"}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-semibold text-white text-sm truncate">
                                  {conv.user.nombre}
                                </h3>
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${rolBadge.bg}`}
                                >
                                  {rolBadge.text}
                                </span>
                              </div>
                              <p className="text-xs text-[#9a9da3] truncate">
                                {conv.user.email}
                              </p>
                              {conv.lastMessage && (
                                <p className="text-xs text-[#c4c6ca] mt-1.5 truncate max-w-md">
                                  <span className="font-medium text-[#9a9da3]">
                                    {conv.lastMessage.autor === "SOPORTE"
                                      ? "Tú: "
                                      : ""}
                                  </span>
                                  {conv.lastMessage.mensaje}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#35373b]/50">
                            {conv.lastMessage && (
                              <span className="text-[11px] text-[#9a9da3]">
                                {new Date(
                                  conv.lastMessage.createdAt,
                                ).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            )}
                            <button
                              onClick={() => openConversation(conv.user)}
                              className="px-3.5 py-1.5 bg-[#d9a05b] hover:bg-[#b38346] text-[#1a1b1e] text-xs font-bold rounded-lg transition-colors cursor-pointer"
                            >
                              Abrir chat →
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div>
                {/* Chat detail header */}
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-[#35373b]">
                  <button
                    onClick={() => setSelectedConversationUser(null)}
                    className="p-2 rounded-xl bg-[#232427] border border-[#35373b] text-[#c4c6ca] hover:text-white transition-colors cursor-pointer text-sm font-semibold"
                  >
                    ← Volver
                  </button>
                  <div className="w-10 h-10 rounded-full bg-[#1a1b1e] border border-[#35373b] flex items-center justify-center text-sm font-bold text-[#d9a05b] shrink-0">
                    {selectedConversationUser.nombre?.charAt(0).toUpperCase() ||
                      "U"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-white">
                        {selectedConversationUser.nombre}
                      </h2>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-[#d9a05b]/10 text-[#d9a05b] border-[#d9a05b]/30">
                        {selectedConversationUser.rol}
                      </span>
                    </div>
                    <p className="text-xs text-[#9a9da3]">
                      {selectedConversationUser.email}
                    </p>
                  </div>
                </div>

                {/* Chat message history container */}
                <div className="bg-[#1a1b1e] border border-[#35373b] rounded-2xl p-4 h-[440px] overflow-y-auto flex flex-col space-y-3 mb-4">
                  {loadingConversation ? (
                    <div className="flex-1 flex items-center justify-center text-xs text-[#9a9da3]">
                      Cargando mensajes...
                    </div>
                  ) : conversationMessages.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-xs text-[#9a9da3]">
                      No hay mensajes en esta conversación aún.
                    </div>
                  ) : (
                    conversationMessages.map((msg) => {
                      const isSupport = msg.autor === "SOPORTE"
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${
                            isSupport ? "items-end" : "items-start"
                          }`}
                        >
                          <div
                            className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                              isSupport
                                ? "bg-gradient-to-r from-[#d9a05b] to-[#b38346] text-[#1a1b1e] font-medium rounded-br-none shadow-md shadow-[#d9a05b]/10"
                                : "bg-[#232427] text-white border border-[#35373b] rounded-bl-none"
                            }`}
                          >
                            {msg.orderId && (
                              <div
                                className={`text-[10px] font-bold mb-1 px-1.5 py-0.5 rounded inline-block ${
                                  isSupport
                                    ? "bg-[#1a1b1e]/20 text-[#1a1b1e]"
                                    : "bg-[#35373b] text-[#d9a05b]"
                                }`}
                              >
                                Pedido #{msg.orderId.slice(-6)}
                              </div>
                            )}
                            <p className="whitespace-pre-wrap break-words">
                              {msg.mensaje}
                            </p>
                          </div>
                          <span className="text-[10px] text-[#9a9da3] mt-1 px-1">
                            {isSupport
                              ? "Soporte (Admin)"
                              : selectedConversationUser.nombre}{" "}
                            •{" "}
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      )
                    })
                  )}
                  <div ref={chatBottomRef} />
                </div>

                {/* Reply form */}
                {replyError && (
                  <div className="mb-2 text-xs text-red-400 bg-red-400/10 border border-red-400/30 px-3 py-2 rounded-xl">
                    {replyError}
                  </div>
                )}
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleSendReply()
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Escribe una respuesta como Soporte..."
                    disabled={sendingReply}
                    className="flex-1 bg-[#232427] border border-[#35373b] focus:border-[#d9a05b] rounded-xl px-4 py-3 text-sm text-white outline-none transition-colors disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={sendingReply || !replyText.trim()}
                    className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#d9a05b] to-[#b38346] text-[#1a1b1e] font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer shrink-0"
                  >
                    {sendingReply ? "Enviando..." : "Responder"}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </main>

      {showConfirmRechazarRepartidor && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setShowConfirmRechazarRepartidor(null)}
        >
          <div
            className="bg-[#232427] border border-[#35373b] rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-white font-bold text-lg text-center mb-2">
              ¿Rechazar esta solicitud?
            </h3>
            <p className="text-[#9a9da3] text-sm text-center mb-5">
              {showConfirmRechazarRepartidor.name} no podrá unirse como
              repartidor con esta solicitud. Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmRechazarRepartidor(null)}
                className="flex-1 py-3 rounded-xl border border-[#35373b] text-[#c4c6ca] font-semibold hover:bg-[#1a1b1e] transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                disabled={updatingRepartidor}
                onClick={() =>
                  handleRejectRepartidor(showConfirmRechazarRepartidor.id)
                }
                className="flex-1 py-3 rounded-xl font-bold bg-red-600 hover:bg-red-500 text-white transition-colors cursor-pointer disabled:opacity-50"
              >
                {updatingRepartidor ? "Rechazando..." : "Sí, rechazar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs / Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#1a1b1e]/95 backdrop-blur-sm border-t border-[#35373b] flex overflow-x-auto z-50 py-2 px-2 sm:justify-center gap-1 sm:gap-6 hide-scrollbar">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex-shrink-0 flex flex-col items-center gap-1 px-3 py-1.5 transition-all min-w-[70px] ${
              activeTab === item.id
                ? "text-[#d9a05b]"
                : "text-[#9a9da3] hover:text-[#c4c6ca]"
            }`}
          >
            <span
              className={`text-xl ${
                activeTab === item.id ? "scale-110" : ""
              } transition-transform`}
            >
              {item.icon}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider">
              {item.label}
            </span>
            {activeTab === item.id && (
              <span className="w-1 h-1 rounded-full bg-[#d9a05b] mt-0.5 absolute bottom-1" />
            )}
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
      {/* Modal de edición de perfil para Admin */}
      <EditProfileModal
        isOpen={editProfileOpen}
        onClose={() => setEditProfileOpen(false)}
        user={currentUser}
        onUserUpdate={onUserUpdate}
        onLogout={onLogout}
      />

      {/* Modal Añadir Zona de Cobertura */}
      {zoneModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#232427] border border-[#35373b] rounded-2xl w-full max-w-sm p-5 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Añadir Zona de Cobertura</h3>
            <p className="text-xs text-[#9a9da3] mb-4">
              Ingresa el nombre del área o sector para el servicio de entregas.
            </p>
            <form onSubmit={handleAddZone}>
              <input
                type="text"
                value={newZoneName}
                onChange={(e) => setNewZoneName(e.target.value)}
                placeholder="Ej. El Brillante, Centro, Norte..."
                autoFocus
                className="w-full bg-[#1a1b1e] border border-[#35373b] focus:border-[#d9a05b] rounded-xl px-4 py-3 text-sm text-white placeholder-[#9a9da3] outline-none mb-4"
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setZoneModalOpen(false)}
                  disabled={savingZone}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#9a9da3] hover:text-white transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!newZoneName.trim() || savingZone}
                  className="px-4 py-2 rounded-xl bg-[#d9a05b] hover:bg-[#b38346] text-[#1a1b1e] text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {savingZone ? "Guardando..." : "Guardar zona"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

const InfoRow = ({ label, value }: { label: string; value: string }) => (
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
  onClick,
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
      <div className="text-2xl group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div>
        <p className="text-white font-bold text-lg leading-tight">{value}</p>
        <p className="text-[#9a9da3] group-hover:text-[#c4c6ca] text-[10px] uppercase tracking-widest transition-colors">
          {label}
        </p>
      </div>
    </button>
  )
}

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { getSocket } from '@/lib/socket'

interface NotificationItem {
  id: string
  tipo: string
  titulo: string
  mensaje: string
  leido: boolean
  createdAt: string
}

export default function Notifications({ onBack }: { onBack: () => void }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [markingAll, setMarkingAll] = useState(false)

  const loadNotifications = async () => {
    try {
      setLoading(true)
      const data = await api.get<NotificationItem[]>('/api/notifications')
      if (Array.isArray(data)) {
        setNotifications(data)
      }
    } catch (err) {
      console.error('Error cargando notificaciones:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications()
  }, [])

  useEffect(() => {
    const socket = getSocket()
    if (!socket) return

    const handleNewNotification = (newNotif: NotificationItem) => {
      setNotifications(prev => {
        if (prev.some(n => n.id === newNotif.id)) return prev
        return [newNotif, ...prev]
      })
    }

    socket.on('notification:new', handleNewNotification)
    return () => {
      socket.off('notification:new', handleNewNotification)
    }
  }, [])

  const handleMarkAsRead = async (id: string, currentlyRead: boolean) => {
    if (currentlyRead) return
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, leido: true } : n)))
    try {
      await api.patch(`/api/notifications/${id}/read`)
    } catch (err) {
      console.error('Error marcando notificación como leída:', err)
    }
  }

  const handleMarkAllAsRead = async () => {
    setMarkingAll(true)
    setNotifications(prev => prev.map(n => ({ ...n, leido: true })))
    try {
      await api.patch('/api/notifications/read-all')
    } catch (err) {
      console.error('Error marcando todas como leídas:', err)
      loadNotifications()
    } finally {
      setMarkingAll(false)
    }
  }

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString)
      const now = new Date()
      const diffMs = now.getTime() - d.getTime()
      const diffMin = Math.floor(diffMs / 60000)
      if (diffMin < 1) return 'Hace un momento'
      if (diffMin < 60) return `Hace ${diffMin} min`
      const diffHours = Math.floor(diffMin / 60)
      if (diffHours < 24) return `Hace ${diffHours} h`
      return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    } catch {
      return ''
    }
  }

  const getIconForType = (tipo: string) => {
    const t = tipo?.toLowerCase() || ''
    if (t.includes('order') || t.includes('pedido')) return '🛵'
    if (t.includes('promo') || t.includes('descuento')) return '🏷️'
    if (t.includes('account') || t.includes('cuenta') || t.includes('perfil')) return '👤'
    if (t.includes('admin') || t.includes('alerta')) return '⚠️'
    return '🔔'
  }

  const unreadCount = notifications.filter(n => !n.leido).length

  return (
    <div className="min-h-screen bg-[#1a1b1e] text-white flex flex-col">
      <header className="sticky top-0 z-40 bg-[#1a1b1e]/95 backdrop-blur-sm border-b border-[#35373b] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-[#9a9da3] hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold uppercase tracking-wide" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
            Notificaciones
          </h1>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            disabled={markingAll}
            className="text-xs text-[#5bc827] hover:text-[#7ed944] font-medium transition-colors disabled:opacity-50"
          >
            {markingAll ? 'Marcando...' : 'Marcar todas como leídas'}
          </button>
        )}
      </header>

      <div className="max-w-lg mx-auto w-full flex-1">
        {loading && notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-[#9a9da3]">
            <div className="w-8 h-8 border-2 border-[#5bc827] border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs uppercase tracking-wider">Cargando notificaciones...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-[#9a9da3]">
            <div className="w-16 h-16 rounded-full bg-[#232427] flex items-center justify-center text-3xl mb-3 border border-[#35373b]">
              🔔
            </div>
            <p className="font-semibold text-white text-sm">No tienes notificaciones</p>
            <p className="text-xs text-[#9a9da3] mt-1 max-w-xs">
              Aquí verás las actualizaciones de tus pedidos, avisos de cuenta y promociones.
            </p>
          </div>
        ) : (
          <div>
            {notifications.map(n => {
              const unread = !n.leido
              return (
                <div
                  key={n.id}
                  onClick={() => handleMarkAsRead(n.id, n.leido)}
                  className={`p-4 border-b border-[#35373b] flex gap-3 transition-colors cursor-pointer ${
                    unread ? 'bg-[#232427] hover:bg-[#282a2e]' : 'bg-transparent hover:bg-[#1f2023]'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0 ${
                      unread ? 'bg-[#5bc827]/20 text-[#5bc827]' : 'bg-[#2a2b2f] text-[#9a9da3]'
                    }`}
                  >
                    {getIconForType(n.tipo)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${unread ? 'font-bold text-white' : 'font-medium text-[#c4c6ca]'}`}>
                      {n.titulo}
                    </p>
                    <p className="text-xs text-[#9a9da3] mt-0.5 leading-relaxed break-words">
                      {n.mensaje}
                    </p>
                    <p className="text-[#6d7075] text-[11px] mt-1.5">
                      {formatTime(n.createdAt)}
                    </p>
                  </div>
                  {unread && (
                    <div className="w-2.5 h-2.5 rounded-full bg-[#5bc827] mt-1.5 shrink-0" />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

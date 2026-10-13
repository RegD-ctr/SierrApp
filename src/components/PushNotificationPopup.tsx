import { useEffect, useState } from "react"

export interface PushNotificationData {
  id?: string
  titulo: string
  mensaje: string
  tipo?: string
}

interface Props {
  notification: PushNotificationData | null
  onClose: () => void
  durationMs?: number
}

function getIconForType(tipo?: string): string {
  const t = (tipo || "").toLowerCase()
  if (t.includes("registro") && t.includes("repartidor")) return "🏍️"
  if (t.includes("registro") && t.includes("local")) return "🏪"
  if (t.includes("registro")) return "📝"
  if (t.includes("pedido") || t.includes("order")) return "🛵"
  if (t.includes("soporte") || t.includes("chat")) return "💬"
  if (t.includes("admin")) return "🛡️"
  if (t.includes("promo")) return "🏷️"
  return "🔔"
}

export default function PushNotificationPopup({
  notification,
  onClose,
  durationMs = 2800,
}: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!notification) {
      setVisible(false)
      return
    }

    // Activa la animación de entrada
    setVisible(true)

    // Ocultar tras la duración establecida (~2-3 segundos)
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(onClose, 300) // Espera que termine animación de salida
    }, durationMs)

    return () => clearTimeout(timer)
  }, [notification, durationMs, onClose])

  if (!notification && !visible) return null

  const icon = getIconForType(notification?.tipo)

  return (
    <div
      role="alert"
      aria-live="assertive"
      data-testid="push-notification-popup"
      onClick={() => {
        setVisible(false)
        setTimeout(onClose, 200)
      }}
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-[92%] max-w-sm pointer-events-auto cursor-pointer transition-all duration-300 ease-out transform ${
        visible
          ? "opacity-100 translate-y-0 scale-100"
          : "opacity-0 -translate-y-8 scale-95 pointer-events-none"
      }`}
    >
      <div className="bg-[#232427]/95 backdrop-blur-md border border-[#5bc827]/40 shadow-2xl shadow-black/80 rounded-2xl p-3.5 flex items-start gap-3 select-none hover:border-[#5bc827] transition-colors">
        {/* Ícono de la app con badge temático */}
        <div className="w-10 h-10 rounded-xl bg-[#1a1b1e] border border-[#35373b] flex items-center justify-center text-xl flex-shrink-0 shadow-inner">
          <span>{icon}</span>
        </div>

        {/* Contenido de la notificación estilo celular */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#5bc827]">
              Sierra App
            </span>
            <span className="text-[10px] text-[#9a9da3]">Ahora</span>
          </div>
          <p className="font-bold text-sm text-white leading-tight truncate">
            {notification?.titulo}
          </p>
          <p className="text-xs text-[#c4c6ca] mt-0.5 line-clamp-2 leading-relaxed">
            {notification?.mensaje}
          </p>
        </div>

        {/* Botón de cierre sutil */}
        <button
          type="button"
          aria-label="Cerrar notificación"
          onClick={(e) => {
            e.stopPropagation()
            setVisible(false)
            setTimeout(onClose, 200)
          }}
          className="text-[#9a9da3] hover:text-white text-xs p-1 -mr-1 -mt-1 rounded-lg transition-colors cursor-pointer"
        >
          ✕
        </button>
      </div>
    </div>
  )
}


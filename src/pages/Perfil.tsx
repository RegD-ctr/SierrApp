import { useState } from "react"
import logoImg from "@/imports/logo.jpeg"
import { getImageUrl, type CurrentUser } from "@/lib/api"
import EditProfileModal from "@/components/EditProfileModal"

type Role = "usuario" | "local" | "repartidor" | "admin"

const roleLabels: Record<Role, { label: string; icon: string; color: string }> = {
  usuario: { label: "Usuario", icon: "🛵", color: "text-[#5bc827]" },
  local: { label: "Local Asociado", icon: "🏪", color: "text-[#4dbd5a]" },
  repartidor: { label: "Repartidor", icon: "🏍️", color: "text-[#7ed944]" },
  admin: { label: "Administrador", icon: "🛡️", color: "text-[#d9a05b]" },
}

const menuItems = [
  { icon: "📍", label: "Mis direcciones", sub: null, view: "addresses" },
  { icon: "💳", label: "Métodos de pago", sub: null, view: "payment-methods" },
  { icon: "🎁", label: "Promociones y cupones", sub: null, view: "promotions" },
  { icon: "⭐", label: "Favoritos", sub: null, view: "favorites" },
  {
    icon: "🔔",
    label: "Notificaciones",
    sub: "Activadas",
    view: "notifications",
  },
  {
    icon: "🔒",
    label: "Privacidad y seguridad",
    sub: "Aviso de privacidad y datos",
    view: "privacidad",
  },
  { icon: "❓", label: "Ayuda y soporte", sub: null, view: "support" },
  { icon: "📋", label: "Términos y condiciones", sub: null, view: "terminos" },
]

const stats = [
  { n: "0", l: "Pedidos" },
  { n: "$0", l: "Gastado" },
  { n: "—", l: "Mi rating" },
]

interface PerfilProps {
  role: Role
  onLogout: () => void
  onNavigate: (view: string) => void
  user?: CurrentUser | null
  onUserUpdate?: (updatedUser: CurrentUser) => void
}

/**
 * Componente que muestra el perfil de usuario.
 * Incluye acceso rápido a configuraciones (direcciones, pagos), estadísticas básicas y la opción de cerrar sesión.
 *
 * @param {PerfilProps} props - Propiedades que incluyen rol actual, y callbacks para cerrar sesión y navegar.
 */
export default function Perfil({
  role,
  onLogout,
  onNavigate,
  user,
  onUserUpdate,
}: PerfilProps) {
  const roleInfo = roleLabels[role] || roleLabels.usuario
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editModalTab, setEditModalTab] = useState<"perfil" | "password">(
    "perfil",
  )

  return (
    <div className="min-h-screen bg-[#1a1b1e] pb-24">
      {/* Header hero */}
      <div className="relative bg-gradient-to-b from-[#232427] to-[#1a1b1e] px-4 pt-8 pb-6 border-b border-[#35373b]">
        <h1
          className="text-2xl font-bold text-white uppercase mb-4"
          style={{ fontFamily: "Barlow Condensed, sans-serif" }}
        >
          Mi Perfil
        </h1>

        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-[#5bc827]/20 border-2 border-[#5bc827] flex items-center justify-center text-2xl font-bold text-[#5bc827] overflow-hidden">
              {user?.driverProfile?.fotoUrl ? (
                <img
                  src={getImageUrl(user.driverProfile.fotoUrl)}
                  alt={user.nombre}
                  className="w-full h-full object-cover"
                />
              ) : (
                "👤"
              )}
            </div>
            <button
              onClick={() => {
                setEditModalTab("perfil")
                setEditModalOpen(true)
              }}
              title="Editar perfil"
              className="absolute bottom-0 right-0 bg-[#5bc827] hover:bg-[#7ed944] rounded-full w-5 h-5 flex items-center justify-center text-[8px] text-[#1a1b1e] cursor-pointer transition-transform hover:scale-110 shadow-md"
            >
              ✏️
            </button>
          </div>
          <div className="flex-1">
            <h2 className="text-white font-bold text-lg leading-tight">
              {user?.nombre || "Usuario"}
            </h2>
            <p className="text-[#9a9da3] text-xs">{user?.email || "—"}</p>
            <div
              className={`inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-1 rounded-full bg-[#1a1b1e] border border-[#35373b]`}
            >
              <span className="text-xs">{roleInfo.icon}</span>
              <span className={`text-[10px] font-bold ${roleInfo.color}`}>
                {roleInfo.label}
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              setEditModalTab("perfil")
              setEditModalOpen(true)
            }}
            title="Editar perfil"
            className="text-[#9a9da3] hover:text-[#5bc827] transition-colors p-2 cursor-pointer rounded-lg hover:bg-[#232427]"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
        </div>

        {/* Botón directo de editar perfil */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => {
              setEditModalTab("perfil")
              setEditModalOpen(true)
            }}
            className="flex-1 py-2 px-3 bg-[#232427] hover:bg-[#2e3034] border border-[#35373b] hover:border-[#5bc827]/40 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>✏️</span>
            <span>Editar perfil</span>
          </button>
          <button
            onClick={() => {
              setEditModalTab("password")
              setEditModalOpen(true)
            }}
            className="py-2 px-3 bg-[#232427] hover:bg-[#2e3034] border border-[#35373b] hover:border-[#5bc827]/40 rounded-xl text-xs font-semibold text-[#9a9da3] hover:text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>🔒</span>
            <span>Cambiar contraseña</span>
          </button>
        </div>

        {/* Stats */}
        <div className="flex mt-4 bg-[#1a1b1e] rounded-2xl border border-[#35373b] overflow-hidden">
          {stats.map((s, i) => (
            <div
              key={s.l}
              className={`flex-1 py-3 text-center ${
                i < stats.length - 1 ? "border-r border-[#35373b]" : ""
              }`}
            >
              <p
                className="text-[#5bc827] font-bold text-xl"
                style={{ fontFamily: "Barlow Condensed, sans-serif" }}
              >
                {s.n}
              </p>
              <p className="text-[#9a9da3] text-[10px]">{s.l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Menu */}
      <div className="px-4 pt-5 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.label}
            onClick={() => {
              if (item.view) {
                onNavigate(item.view)
              }
            }}
            className="w-full flex items-center gap-3 px-3 py-3.5 rounded-xl hover:bg-[#232427] transition-colors text-left group cursor-pointer"
          >
            <span className="text-xl w-7 text-center">{item.icon}</span>
            <div className="flex-1">
              <p className="text-sm text-white font-medium group-hover:text-[#5bc827] transition-colors">
                {item.label}
              </p>
              {item.sub && (
                <p className="text-[10px] text-[#9a9da3] mt-0.5">{item.sub}</p>
              )}
            </div>
            <svg
              className="w-4 h-4 text-[#35373b] group-hover:text-[#5bc827] transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        ))}
      </div>

      {/* Sierra App branding + logout */}
      <div className="px-4 mt-6">
        <div className="flex items-center gap-2 justify-center mb-5 opacity-40">
          <img
            src={logoImg}
            alt="Sierra App"
            className="w-5 h-5 rounded object-cover"
          />
          <span
            className="text-[#5bc827] text-xs font-bold tracking-widest"
            style={{ fontFamily: "Barlow Condensed, sans-serif" }}
          >
            SIERRA APP v1.0
          </span>
        </div>
        <button
          onClick={onLogout}
          className="w-full py-3 rounded-xl border border-red-800/50 text-red-400 text-sm font-semibold hover:bg-red-900/20 transition-colors cursor-pointer"
        >
          Cerrar sesión
        </button>
      </div>

      {/* Modal de edición de perfil y contraseña */}
      <EditProfileModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        user={user || null}
        onUserUpdate={(u) => onUserUpdate?.(u)}
        onLogout={onLogout}
        initialTab={editModalTab}
      />
    </div>
  )
}

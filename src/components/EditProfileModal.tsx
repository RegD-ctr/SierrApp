import { useState, useRef, useEffect } from "react"
import { api, getImageUrl, type CurrentUser } from "@/lib/api"

interface Props {
  isOpen: boolean
  onClose: () => void
  user?: CurrentUser | null
  onUserUpdate?: (updatedUser: CurrentUser) => void
  onLogout?: () => void
  initialTab?: "perfil" | "password"
}

export default function EditProfileModal({
  isOpen,
  onClose,
  user,
  onUserUpdate,
  onLogout,
  initialTab = "perfil",
}: Props) {
  const [activeTab, setActiveTab] = useState<"perfil" | "password">(initialTab)

  // Datos personales
  const [nombre, setNombre] = useState("")
  const [telefono, setTelefono] = useState("")
  const [tieneVehiculo, setTieneVehiculo] = useState(false)
  const [vehiculo, setVehiculo] = useState("")
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Contraseña
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  // Estados de carga y feedback
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Sincronizar datos al abrir
  useEffect(() => {
    if (isOpen && user) {
      setNombre(user.nombre || "")
      setTelefono(user.telefono || "")
      setTieneVehiculo(Boolean(user.driverProfile?.tieneVehiculo))
      setVehiculo(user.driverProfile?.vehiculo || "")
      setFotoFile(null)
      setFotoPreview(
        user.driverProfile?.fotoUrl
          ? getImageUrl(user.driverProfile.fotoUrl)
          : null,
      )
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setError(null)
      setSuccess(null)
      setActiveTab(initialTab)
    }
  }, [isOpen, user, initialTab])

  if (!isOpen || !user) return null

  const isRepartidor = user.rol === "REPARTIDOR"

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("El archivo seleccionado debe ser una imagen.")
        return
      }
      setFotoFile(file)
      setFotoPreview(URL.createObjectURL(file))
      setError(null)
    }
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (nombre.trim().length < 2) {
      setError("El nombre debe tener al menos 2 caracteres.")
      return
    }
    if (!telefono.trim()) {
      setError("El teléfono es obligatorio.")
      return
    }

    setLoading(true)
    try {
      // 1. Si es repartidor y seleccionó una nueva foto, subirla
      let uploadedFotoPath: string | undefined = undefined
      if (isRepartidor && fotoFile) {
        const formData = new FormData()
        formData.append("file", fotoFile)
        const uploadRes = await api.upload<{ path: string }>(
          "/api/uploads/driver-photo/me",
          formData,
        )
        uploadedFotoPath = uploadRes.path
      }

      // 2. Si es repartidor, actualizar perfil de conductor si hubo cambios en vehículo o foto
      if (isRepartidor) {
        await api.patch<CurrentUser>("/api/auth/me/driver-profile", {
          tieneVehiculo,
          vehiculo: tieneVehiculo ? vehiculo.trim() || undefined : undefined,
          fotoUrl:
            uploadedFotoPath || (user.driverProfile?.fotoUrl ?? undefined),
        })
      }

      // 3. Actualizar datos base (nombre y teléfono para todos los roles)
      const updatedUser = await api.patch<CurrentUser>("/api/auth/me", {
        nombre: nombre.trim(),
        telefono: telefono.trim(),
      })

      onUserUpdate?.(updatedUser)
      setSuccess("Perfil actualizado correctamente.")
      setTimeout(() => {
        onClose()
      }, 1200)
    } catch (err: any) {
      setError(err?.message || "Error al actualizar el perfil.")
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!currentPassword) {
      setError("Debes ingresar tu contraseña actual.")
      return
    }
    if (newPassword.length < 10) {
      setError("La nueva contraseña debe tener al menos 10 caracteres.")
      return
    }
    if (newPassword !== confirmPassword) {
      setError("La nueva contraseña y su confirmación no coinciden.")
      return
    }

    setLoading(true)
    try {
      const res = await api.patch<{ message: string }>(
        "/api/auth/me/password",
        {
          currentPassword,
          newPassword,
        },
      )
      setSuccess(
        res.message || "Contraseña actualizada. Vuelve a iniciar sesión.",
      )
      setTimeout(() => {
        alert(
          "Contraseña actualizada con éxito. Por seguridad, vuelve a iniciar sesión con tu nueva contraseña.",
        )
        onLogout?.()
      }, 1000)
    } catch (err: any) {
      setError(err?.message || "Error al cambiar la contraseña.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#232427] border border-[#35373b] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#35373b]">
          <div>
            <h2
              className="text-xl font-bold text-white uppercase tracking-wide"
              style={{ fontFamily: "Barlow Condensed, sans-serif" }}
            >
              Configuración de Cuenta
            </h2>
            <p className="text-xs text-[#9a9da3]">{user.email}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#1a1b1e] text-[#9a9da3] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#35373b] bg-[#1a1b1e]">
          <button
            onClick={() => {
              setActiveTab("perfil")
              setError(null)
              setSuccess(null)
            }}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider text-center transition-colors cursor-pointer ${
              activeTab === "perfil"
                ? "text-[#5bc827] border-b-2 border-[#5bc827] bg-[#232427]"
                : "text-[#9a9da3] hover:text-white"
            }`}
          >
            👤 Datos Personales
          </button>
          <button
            onClick={() => {
              setActiveTab("password")
              setError(null)
              setSuccess(null)
            }}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider text-center transition-colors cursor-pointer ${
              activeTab === "password"
                ? "text-[#5bc827] border-b-2 border-[#5bc827] bg-[#232427]"
                : "text-[#9a9da3] hover:text-white"
            }`}
          >
            🔒 Contraseña
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-xs flex items-center gap-2">
              <span>✅</span>
              <span>{success}</span>
            </div>
          )}

          {activeTab === "perfil" ? (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Foto de perfil para repartidores */}
              {isRepartidor && (
                <div className="flex flex-col items-center gap-2 pb-2">
                  <div className="relative w-20 h-20 rounded-full bg-[#1a1b1e] border-2 border-[#5bc827] overflow-hidden flex items-center justify-center text-3xl">
                    {fotoPreview ? (
                      <img
                        src={fotoPreview}
                        alt="Foto perfil"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      "🏍️"
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs text-[#5bc827] hover:underline font-semibold cursor-pointer"
                  >
                    📷 Cambiar fotografía
                  </button>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#9a9da3] uppercase mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Tu nombre completo"
                  className="w-full bg-[#1a1b1e] border border-[#35373b] rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#5bc827] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#9a9da3] uppercase mb-1">
                  Teléfono *
                </label>
                <input
                  type="tel"
                  required
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="Ej. 618 123 4567"
                  className="w-full bg-[#1a1b1e] border border-[#35373b] rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#5bc827] transition-colors"
                />
              </div>

              {/* Opciones específicas de Repartidor */}
              {isRepartidor && (
                <div className="pt-2 border-t border-[#35373b] space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tieneVehiculo}
                      onChange={(e) => setTieneVehiculo(e.target.checked)}
                      className="w-4 h-4 accent-[#5bc827] rounded"
                    />
                    <span className="text-xs font-semibold text-white">
                      Cuento con vehículo propio
                    </span>
                  </label>

                  {tieneVehiculo && (
                    <div>
                      <label className="block text-xs font-semibold text-[#9a9da3] uppercase mb-1">
                        Descripción del vehículo
                      </label>
                      <input
                        type="text"
                        value={vehiculo}
                        onChange={(e) => setVehiculo(e.target.value)}
                        placeholder="Ej. Motocicleta Italika 150cc / Automóvil"
                        className="w-full bg-[#1a1b1e] border border-[#35373b] rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#5bc827] transition-colors"
                      />
                    </div>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3.5 rounded-xl font-bold text-sm uppercase tracking-wider transition-all shadow-lg ${
                  loading
                    ? "bg-[#35373b] text-[#9a9da3] cursor-not-allowed"
                    : "bg-[#5bc827] hover:bg-[#7ed944] text-[#1a1b1e] cursor-pointer"
                }`}
              >
                {loading ? "Guardando..." : "Guardar Cambios"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#9a9da3] uppercase mb-1">
                  Contraseña Actual *
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Tu contraseña actual"
                  className="w-full bg-[#1a1b1e] border border-[#35373b] rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#5bc827] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#9a9da3] uppercase mb-1">
                  Nueva Contraseña (mínimo 10 caracteres) *
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nueva contraseña segura"
                  className="w-full bg-[#1a1b1e] border border-[#35373b] rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#5bc827] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#9a9da3] uppercase mb-1">
                  Confirmar Nueva Contraseña *
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la nueva contraseña"
                  className="w-full bg-[#1a1b1e] border border-[#35373b] rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#5bc827] transition-colors"
                />
              </div>

              <p className="text-[11px] text-[#9a9da3] leading-relaxed">
                Al cambiar tu contraseña, todas tus sesiones activas en otros
                dispositivos se cerrarán automáticamente por seguridad.
              </p>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3.5 rounded-xl font-bold text-sm uppercase tracking-wider transition-all shadow-lg ${
                  loading
                    ? "bg-[#35373b] text-[#9a9da3] cursor-not-allowed"
                    : "bg-[#5bc827] hover:bg-[#7ed944] text-[#1a1b1e] cursor-pointer"
                }`}
              >
                {loading ? "Actualizando..." : "Actualizar Contraseña"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

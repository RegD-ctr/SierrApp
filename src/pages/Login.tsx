import { useState, useRef } from 'react'
import logoImg from '@/imports/logo.jpeg'
import Onboarding from '@/pages/Onboarding'
import { api, setAccessToken, type CurrentUser } from '@/lib/api'

export type Role = 'usuario' | 'local' | 'repartidor' | 'admin'
type Screen =
  | 'roleSelect'
  | 'login'
  | 'register_roleSelect'
  | 'register_usuario_intro'
  | 'register_usuario'
  | 'register_local'
  | 'register_local_platillos'
  | 'register_repartidor'
  | 'register_repartidor_result'

const repartidorRole = { id: 'repartidor' as Role, label: 'Repartidor', desc: 'Gestiona tus entregas', icon: '🏍️', border: 'border-[#7ed944]', text: 'text-[#7ed944]', gradient: 'from-[#35373b] to-[#232427]' }
const adminRole = { id: 'admin' as Role, label: 'Administrador', desc: 'Panel de control', icon: '🛡️', border: 'border-[#d9a05b]', text: 'text-[#d9a05b]', gradient: 'from-[#5e4526] to-[#2d2112]' }

const roles = [
  { id: 'usuario' as Role, label: 'Usuario', desc: 'Pide comida, súper y más', icon: '👤', border: 'border-[#5bc827]', text: 'text-[#5bc827]', gradient: 'from-[#5bc827] to-[#3d8c18]' },
  { id: 'local' as Role,   label: 'Colaborador', desc: 'Administra tu negocio', icon: '🏪', border: 'border-[#2a8c3a]', text: 'text-[#4dbd5a]', gradient: 'from-[#1a5c27] to-[#0d3318]' },
]

/**
 * Genera una matrícula aleatoria para los repartidores (fallback visual).
 * 
 * @returns {string} Matrícula con formato REP-XXXXXX
 */
function genMatricula() {
  const n = Math.floor(100000 + Math.random() * 900000)
  return `REP-${n}`
}

interface Props {
  onLogin: (user: CurrentUser) => void
}

/**
 * Componente principal para el inicio de sesión y registro de la aplicación.
 * Gestiona diferentes pantallas de registro y login según el rol seleccionado.
 * 
 * @param {Props} props - Propiedades que incluyen la función onLogin.
 */
export default function Login({ onLogin }: Props) {
  const [screen, setScreen] = useState<Screen>('roleSelect')
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [prefilledRole, setPrefilledRole] = useState<Role | null>(null)
  const [prefilledEmail, setPrefilledEmail] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Usuario register fields
  const [uNombre, setUNombre] = useState('')
  const [uEmail, setUEmail] = useState('')
  const [uPass, setUPass] = useState('')
  const [uPass2, setUPass2] = useState('')
  const [uTel, setUTel] = useState('')
  const [uCalle, setUCalle] = useState('')
  const [uNumero, setUNumero] = useState('')
  const [uColonia, setUColonia] = useState('')
  const [uCP, setUCP] = useState('')
  const [uCiudad, setUCiudad] = useState('')
  const [uEstado, setUEstado] = useState('')
  const [uReferencias, setUReferencias] = useState('')
  const [uAceptaTerminos, setUAceptaTerminos] = useState(false)

  // Local register fields
  const [lNombre, setLNombre] = useState('')
  const [lEmail, setLEmail] = useState('')
  const [lPass, setLPass] = useState('')
  const [lPass2, setLPass2] = useState('')
  const [lDir, setLDir] = useState('')
  const [lTel, setLTel] = useState('')
  const [lAceptaTerminos, setLAceptaTerminos] = useState(false)

  // Repartidor register fields
  const [rNombre, setRNombre] = useState('')
  const [rEmail, setREmail] = useState('')
  const [rPass, setRPass] = useState('')
  const [rPass2, setRPass2] = useState('')
  const [rTelefono, setRTelefono] = useState('')
  const [rTieneVehiculo, setRTieneVehiculo] = useState<boolean | null>(null)
  const [rVehiculo, setRVehiculo] = useState('')
  const [rFoto, setRFoto] = useState<string | null>(null)
  const [rFotoFile, setRFotoFile] = useState<File | null>(null)
  const [backendMatricula, setBackendMatricula] = useState<string | null>(null)
  const [rMatricula] = useState(genMatricula)
  const [rAceptaTerminos, setRAceptaTerminos] = useState(false)
  const [showTermsModal, setShowTermsModal] = useState(false)
  const fotoRef = useRef<HTMLInputElement>(null)

  const activeRole = selectedRole === 'repartidor' ? repartidorRole : selectedRole === 'admin' ? adminRole : roles.find(r => r.id === selectedRole)

  const changeScreen = (to: Screen) => {
    setError(null)
    setSuccess(null)
    setScreen(to)
  }

  const handleSelectRole = (role: Role) => {
    setError(null)
    if (role === prefilledRole) {
      setEmail(prefilledEmail)
    } else {
      setEmail('')
      setSuccess(null)
    }
    setPassword('')
    setSelectedRole(role)
    setScreen('login')
  }

  /**
   * Maneja la subida y previsualización de la fotografía del repartidor.
   */
  const handleFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setRFotoFile(file)
    const reader = new FileReader()
    reader.onload = ev => setRFoto(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)
    try {
      const res = await api.post<{ accessToken: string }>('/api/auth/login', {
        email: email.trim(),
        password,
      })
      setAccessToken(res.accessToken)
      const user = await api.get<CurrentUser>('/api/auth/me')
      onLogin(user)
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión.')
    } finally {
      setLoading(false)
    }
  }

  const handleRegisterUsuario = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!uAceptaTerminos) {
      setError('Debes aceptar los términos y condiciones para continuar.')
      return
    }
    if (uPass !== uPass2) {
      setError('Las contraseñas no coinciden.')
      return
    }
    setError(null)
    setSuccess(null)
    setLoading(true)
    try {
      await api.post('/api/auth/register/usuario', {
        nombre: uNombre.trim(),
        email: uEmail.trim(),
        password: uPass,
        telefono: uTel.trim(),
        direccion: {
          calle: uCalle.trim(),
          numero: uNumero.trim(),
          colonia: uColonia.trim(),
          cp: uCP.trim(),
          ciudad: uCiudad.trim(),
          estado: uEstado.trim(),
          referencias: uReferencias.trim() || undefined,
        },
      })
      setPrefilledRole('usuario')
      setPrefilledEmail(uEmail.trim())
      setEmail(uEmail.trim())
      setPassword('')
      setSelectedRole('usuario')
      setSuccess('¡Cuenta creada con éxito! Revisa tu correo para verificarla e inicia sesión.')
      setScreen('login')
    } catch (err: any) {
      setError(err.message || 'Error al registrar usuario.')
    } finally {
      setLoading(false)
    }
  }

  const handleRegisterLocal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!lAceptaTerminos) {
      setError('Debes aceptar los términos y condiciones para continuar.')
      return
    }
    if (lPass !== lPass2) {
      setError('Las contraseñas no coinciden.')
      return
    }
    setError(null)
    setSuccess(null)
    setLoading(true)
    try {
      await api.post('/api/auth/register/local', {
        nombreNegocio: lNombre.trim(),
        email: lEmail.trim(),
        password: lPass,
        telefono: lTel.trim(),
        direccion: lDir.trim(),
      })
      setScreen('register_local_platillos')
    } catch (err: any) {
      setError(err.message || 'Error al registrar el restaurante.')
    } finally {
      setLoading(false)
    }
  }

  const handleRegisterRepartidor = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rTieneVehiculo === null) {
      setError('Debes seleccionar si cuentas con vehículo para repartir.')
      return
    }
    if (!rAceptaTerminos) {
      setError('Debes aceptar los términos y condiciones.')
      return
    }
    if (rPass !== rPass2) {
      setError('Las contraseñas no coinciden.')
      return
    }
    setError(null)
    setSuccess(null)
    setLoading(true)
    try {
      let fotoUrl: string | undefined = undefined
      if (rFotoFile) {
        const formData = new FormData()
        formData.append('file', rFotoFile)
        const uploadRes = await api.upload<{ path: string }>('/api/uploads/driver-photo', formData)
        fotoUrl = uploadRes.path
      }

      const res = await api.post<{ userId: string; matricula: string }>('/api/auth/register/repartidor', {
        nombre: rNombre.trim(),
        email: rEmail.trim(),
        password: rPass,
        telefono: rTelefono.trim(),
        tieneVehiculo: rTieneVehiculo,
        vehiculo: rVehiculo.trim() || undefined,
        fotoUrl,
      })

      setBackendMatricula(res.matricula)
      setScreen('register_repartidor_result')
    } catch (err: any) {
      setError(err.message || 'Error al registrar repartidor.')
    } finally {
      setLoading(false)
    }
  }

  const BG = (
    <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle, #5bc827 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
  )

  /**
   * Componente interno que renderiza el encabezado con el logo en las pantallas de login.
   */
  const LogoHeader = () => (
    <div className="flex flex-col items-center mb-8">
      <img src={logoImg} alt="Sierra App" className="w-20 h-20 rounded-2xl object-cover shadow-2xl shadow-[#5bc827]/20 mb-3" />
      <h1 className="text-4xl font-bold text-[#5bc827] tracking-widest uppercase" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>SIERRA APP</h1>
      <p className="text-[#9a9da3] text-xs tracking-widest uppercase mt-1">Todo lo que necesitas, a un toque.</p>
    </div>
  )

  /**
   * Componente interno para renderizar el botón de retroceso.
   */
  const BackBtn = ({ to, label = 'Volver' }: { to: Screen; label?: string }) => (
    <button type="button" onClick={() => changeScreen(to)} className="flex items-center gap-1 text-[#9a9da3] hover:text-[#5bc827] text-sm mb-5 transition-colors cursor-pointer">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
      {label}
    </button>
  )

  // ---- Role Select ----
  if (screen === 'roleSelect') return (
    <div className="min-h-screen bg-[#1a1b1e] flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {BG}
      <button onClick={() => handleSelectRole('admin')} className="absolute bottom-4 right-4 text-[#7aaa70] text-[10px] hover:underline opacity-60 hover:opacity-100 transition-opacity z-10 cursor-pointer">
        Acceso administrador
      </button>
      <div className="relative w-full max-w-sm">
        <LogoHeader />
        <p className="text-center text-[#c4c6ca] text-sm mb-5">¿Cómo quieres ingresar?</p>
        <div className="space-y-3 mb-5">
          {roles.map(role => (
            <button key={role.id} onClick={() => handleSelectRole(role.id)}
              className="w-full flex items-center gap-4 p-4 rounded-2xl border border-[#2a4830] bg-[#142a17] hover:bg-[#1a3320] hover:border-[#5bc827]/50 transition-all hover:scale-[1.02] active:scale-[0.98] text-left cursor-pointer">
              <span className="text-3xl">{role.icon}</span>
              <div className="flex-1">
                <p className="font-bold text-base text-white">{role.label}</p>
                <p className="text-[#9a9da3] text-xs">{role.desc}</p>
              </div>
              <svg className="w-4 h-4 text-[#5bc827]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
            </button>
          ))}
        </div>
        <p className="text-center text-[#9a9da3] text-sm">
          ¿No tienes cuenta?{' '}
          <button onClick={() => changeScreen('register_roleSelect')} className="text-[#5bc827] font-semibold hover:underline cursor-pointer">
            Crear cuenta
          </button>
        </p>
        <div className="w-full h-px bg-[#35373b] my-5"></div>
        <p className="text-center text-[#9a9da3] text-sm">
          ¿Eres o quieres ser repartidor?{' '}
          <button onClick={() => handleSelectRole('repartidor')} className="text-[#7ed944] font-semibold hover:underline cursor-pointer">
            Ingresa aquí
          </button>
        </p>
      </div>
    </div>
  )

  // ---- Login form ----
  if (screen === 'login' && activeRole) return (
    <div className="min-h-screen bg-[#1a1b1e] flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {BG}
      <div className="relative w-full max-w-sm">
        <BackBtn to="roleSelect" label="Cambiar tipo de acceso" />
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#232427] border ${activeRole.border} mb-5`}>
          <span>{activeRole.icon}</span>
          <span className={`text-xs font-bold ${activeRole.text}`}>{activeRole.label}</span>
        </div>
        <h2 className="text-3xl font-bold text-white mb-1 uppercase" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Iniciar sesión</h2>
        <p className="text-[#9a9da3] text-xs mb-6">
          ¿No tienes cuenta?{' '}
          <button
            type="button"
            onClick={() => {
              if (selectedRole === 'usuario') changeScreen('register_usuario_intro')
              else if (selectedRole === 'local') changeScreen('register_local')
              else if (selectedRole === 'repartidor') changeScreen('register_repartidor')
              else changeScreen('register_roleSelect')
            }}
            className={`${activeRole.text} font-semibold hover:underline cursor-pointer`}
          >
            Regístrate aquí
          </button>
        </p>

        {success && (
          <div className="mb-4 p-3 bg-[#5bc827]/10 border border-[#5bc827]/40 rounded-xl text-xs text-[#5bc827] flex items-center gap-2">
            <span>✅</span>
            <span>{success}</span>
          </div>
        )}

        <form key={selectedRole || 'login'} onSubmit={handleLogin} className="space-y-3" autoComplete="off">
          <div>
            <label htmlFor={`login-email-${selectedRole}`} className="text-[#c4c6ca] text-xs font-semibold block mb-1">Correo electrónico</label>
            <input
              id={`login-email-${selectedRole}`}
              name={`login_email_${selectedRole}`}
              type="email"
              autoComplete="email"
              placeholder="ejemplo@correo.com"
              value={email}
              onChange={e => {
                setEmail(e.target.value)
                if (error) setError(null)
              }}
              required
              className="w-full bg-[#232427] border border-[#35373b] focus:border-[#5bc827] rounded-xl px-4 py-3 text-sm text-white placeholder-[#9a9da3] outline-none transition-colors"
            />
          </div>
          <div className="relative">
            <label htmlFor={`login-password-${selectedRole}`} className="text-[#c4c6ca] text-xs font-semibold block mb-1">Contraseña</label>
            <input
              id={`login-password-${selectedRole}`}
              name={`login_password_${selectedRole}`}
              type={showPass ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={e => {
                setPassword(e.target.value)
                if (error) setError(null)
              }}
              required
              className="w-full bg-[#232427] border border-[#35373b] focus:border-[#5bc827] rounded-xl px-4 py-3 text-sm text-white placeholder-[#9a9da3] outline-none transition-colors pr-10"
            />
            <button type="button" onClick={() => setShowPass(s => !s)} className="absolute right-3 bottom-3 text-[#9a9da3] cursor-pointer">{showPass ? '🙈' : '👁️'}</button>
          </div>
          <button type="button" className={`text-xs ${activeRole.text} hover:underline w-full text-right cursor-pointer`}>¿Olvidaste tu contraseña?</button>

          {error && (
            <div className="p-3 bg-red-950/40 border border-red-500/50 rounded-xl text-xs text-red-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] mt-2 bg-gradient-to-r ${activeRole.gradient} text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2`}
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Entrando...</span>
              </>
            ) : (
              'Entrar'
            )}
          </button>
        </form>
      </div>
    </div>
  )

  // ---- Register: choose role ----
  if (screen === 'register_roleSelect') return (
    <div className="min-h-screen bg-[#1a1b1e] flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {BG}
      <div className="relative w-full max-w-sm">
        <BackBtn to="roleSelect" />
        <h2 className="text-3xl font-bold text-white mb-1 uppercase" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Crear cuenta</h2>
        <p className="text-[#9a9da3] text-sm mb-6">¿Qué tipo de cuenta deseas crear?</p>
        <div className="space-y-3">
          {[
            { id: 'usuario', label: 'Usuario / Cliente', desc: 'Realiza pedidos de comida y más', icon: '👤', screen: 'register_usuario_intro' as Screen },
            { id: 'local', label: 'Restaurante', desc: 'Registra y administra tu negocio', icon: '🏪', screen: 'register_local' as Screen },
          ].map(opt => (
            <button key={opt.id} onClick={() => changeScreen(opt.screen)}
              className="w-full flex items-center gap-4 p-4 rounded-2xl border border-[#2a4830] bg-[#142a17] hover:bg-[#1a3320] hover:border-[#5bc827]/50 transition-all text-left cursor-pointer">
              <span className="text-3xl">{opt.icon}</span>
              <div className="flex-1">
                <p className="font-bold text-sm text-white">{opt.label}</p>
                <p className="text-[#9a9da3] text-xs">{opt.desc}</p>
              </div>
              <svg className="w-4 h-4 text-[#5bc827]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
            </button>
          ))}
        </div>
        <div className="w-full h-px bg-[#35373b] my-5"></div>
        <p className="text-center text-[#9a9da3] text-sm">
          ¿Eres o quieres ser repartidor?{' '}
          <button onClick={() => changeScreen('register_repartidor')} className="text-[#7ed944] font-semibold hover:underline cursor-pointer">
            Regístrate aquí
          </button>
        </p>
      </div>
    </div>
  )

  // ---- Register: Usuario Intro (Onboarding para usuarios únicamente) ----
  if (screen === 'register_usuario_intro') return (
    <Onboarding
      onComplete={() => changeScreen('register_usuario')}
      onBack={() => changeScreen('register_roleSelect')}
    />
  )

  // ---- Register: Usuario ----
  if (screen === 'register_usuario') return (
    <div className="min-h-screen bg-[#1a1b1e] px-4 py-6 relative overflow-hidden">
      {BG}
      <div className="relative w-full max-w-sm mx-auto">
        <BackBtn to="register_roleSelect" />
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-full bg-[#5bc827] flex items-center justify-center text-[#1a1b1e] font-bold text-sm">👤</div>
          <h2 className="text-2xl font-bold text-white uppercase" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Crear cuenta de usuario</h2>
        </div>

        <form onSubmit={handleRegisterUsuario} className="space-y-3">
          <SectionTitle>Datos personales</SectionTitle>
          <Field label="Nombre completo" value={uNombre} onChange={setUNombre} placeholder="Juan Sierra" />
          <Field label="Correo electrónico" value={uEmail} onChange={setUEmail} placeholder="juan@correo.com" type="email" />
          <Field label="Contraseña" value={uPass} onChange={setUPass} placeholder="Mínimo 10 caracteres" type="password" />
          <Field label="Confirmar contraseña" value={uPass2} onChange={setUPass2} placeholder="••••••••" type="password"
            error={uPass2 && uPass !== uPass2 ? 'Las contraseñas no coinciden' : ''} />
          <Field label="Teléfono" value={uTel} onChange={setUTel} placeholder="+52 614 000 0000" type="tel" />

          <SectionTitle>Dirección de entrega</SectionTitle>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Calle" value={uCalle} onChange={setUCalle} placeholder="Av. Sierra" />
            <Field label="Número" value={uNumero} onChange={setUNumero} placeholder="#45" />
          </div>
          <Field label="Colonia" value={uColonia} onChange={setUColonia} placeholder="Col. Centro" />
          <div className="grid grid-cols-2 gap-2">
            <Field label="C.P." value={uCP} onChange={setUCP} placeholder="31000" />
            <Field label="Ciudad" value={uCiudad} onChange={setUCiudad} placeholder="Chihuahua" />
          </div>
          <Field label="Estado" value={uEstado} onChange={setUEstado} placeholder="Chihuahua" />
          <div>
            <label className="text-[#c4c6ca] text-xs font-semibold block mb-1">Detalles para encontrar tu dirección</label>
            <textarea value={uReferencias} onChange={e => setUReferencias(e.target.value)}
              placeholder="Casa con portón negro, enfrente del parque..." rows={2}
              className="w-full bg-[#232427] border border-[#35373b] focus:border-[#5bc827] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#9a9da3] outline-none transition-colors resize-none" />
          </div>

          {/* Map placeholder */}
          <div>
            <label className="text-[#c4c6ca] text-xs font-semibold block mb-1">Ubicación en mapa</label>
            <div className="relative h-36 rounded-xl overflow-hidden border border-[#35373b] bg-[#0a1a0c]">
              <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(42,72,48,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(42,72,48,0.4) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-[#5bc827]/30 animate-ping" />
                  <div className="relative w-8 h-8 bg-[#5bc827] rounded-full border-2 border-white flex items-center justify-center text-sm z-10">📍</div>
                </div>
                <span className="text-[#5bc827] text-xs font-semibold mt-1">Tu ubicación</span>
              </div>
            </div>
          </div>

          {/* Términos y condiciones */}
          <div className="flex items-start gap-2.5 pt-2">
            <input
              id="u-terminos"
              type="checkbox"
              checked={uAceptaTerminos}
              onChange={e => setUAceptaTerminos(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-[#35373b] bg-[#232427] text-[#5bc827] focus:ring-[#5bc827]/40 focus:ring-2 cursor-pointer accent-[#5bc827]"
              required
            />
            <label htmlFor="u-terminos" className="text-xs text-[#c4c6ca] leading-tight cursor-pointer select-none">
              Acepto los{' '}
              <button
                type="button"
                onClick={() => setShowTermsModal(true)}
                className="text-[#5bc827] underline hover:text-[#7ed944] font-semibold cursor-pointer"
              >
                términos y condiciones
              </button>{' '}
              del servicio y la política de privacidad de Sierra App.
            </label>
          </div>

          {error && (
            <div className="p-3 bg-red-950/40 border border-red-500/50 rounded-xl text-xs text-red-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !uAceptaTerminos}
            className="w-full py-3.5 rounded-xl bg-[#5bc827] hover:bg-[#7ed944] text-[#1a1b1e] font-bold text-sm transition-all hover:scale-[1.02] mt-2 shadow-lg shadow-[#5bc827]/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-[#1a1b1e] border-t-transparent rounded-full animate-spin" />
                <span>Creando cuenta...</span>
              </>
            ) : (
              'Crear cuenta'
            )}
          </button>
        </form>
      </div>
      {showTermsModal && <TermsModal onClose={() => setShowTermsModal(false)} />}
    </div>
  )

  // ---- Register: Local/Restaurante ----
  if (screen === 'register_local') return (
    <div className="min-h-screen bg-[#1a1b1e] px-4 py-6 relative overflow-hidden">
      {BG}
      <div className="relative w-full max-w-sm mx-auto">
        <BackBtn to="register_roleSelect" />
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-full bg-[#4dbd5a] flex items-center justify-center text-[#1a1b1e] font-bold text-sm">🏪</div>
          <h2 className="text-2xl font-bold text-white uppercase" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Registrar restaurante</h2>
        </div>

        <form onSubmit={handleRegisterLocal} className="space-y-3">
          <Field label="Nombre del restaurante" value={lNombre} onChange={setLNombre} placeholder="Ej. Taquería El Gordo" />
          <Field label="Correo electrónico de acceso" value={lEmail} onChange={setLEmail} placeholder="restaurante@correo.com" type="email" />
          <Field label="Contraseña" value={lPass} onChange={setLPass} placeholder="Mínimo 10 caracteres" type="password" />
          <Field label="Confirmar contraseña" value={lPass2} onChange={setLPass2} placeholder="••••••••" type="password"
            error={lPass2 && lPass !== lPass2 ? 'Las contraseñas no coinciden' : ''} />
          <Field label="Dirección" value={lDir} onChange={setLDir} placeholder="Av. Sierra #45, Col. Centro" />
          <Field label="Teléfono de contacto" value={lTel} onChange={setLTel} placeholder="+52 614 000 0000" type="tel" />

          <div>
            <label className="text-[#c4c6ca] text-xs font-semibold block mb-1">Logo del restaurante</label>
            <div className="h-24 border-2 border-dashed border-[#35373b] hover:border-[#5bc827] rounded-xl flex items-center justify-center cursor-pointer transition-colors">
              <div className="flex flex-col items-center gap-1 text-[#9a9da3]"><span className="text-2xl">🖼️</span><span className="text-xs">Subir logo</span></div>
            </div>
          </div>
          <div>
            <label className="text-[#c4c6ca] text-xs font-semibold block mb-1">Imagen de portada</label>
            <div className="h-24 border-2 border-dashed border-[#35373b] hover:border-[#5bc827] rounded-xl flex items-center justify-center cursor-pointer transition-colors">
              <div className="flex flex-col items-center gap-1 text-[#9a9da3]"><span className="text-2xl">📷</span><span className="text-xs">Subir portada</span></div>
            </div>
          </div>

          <div>
            <label className="text-[#c4c6ca] text-xs font-semibold block mb-1">Ubicación del restaurante</label>
            <div className="relative h-36 rounded-xl overflow-hidden border border-[#35373b] bg-[#0a1a0c]">
              <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(42,72,48,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(42,72,48,0.4) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-[#4dbd5a]/30 animate-ping" />
                  <div className="relative w-8 h-8 bg-[#4dbd5a] rounded-full border-2 border-white flex items-center justify-center text-sm z-10">🏪</div>
                </div>
                <span className="text-[#4dbd5a] text-xs font-semibold mt-1">Marcador del local</span>
              </div>
            </div>
          </div>

          {/* Términos y condiciones */}
          <div className="flex items-start gap-2.5 pt-2">
            <input
              id="l-terminos"
              type="checkbox"
              checked={lAceptaTerminos}
              onChange={e => setLAceptaTerminos(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-[#35373b] bg-[#232427] text-[#4dbd5a] focus:ring-[#4dbd5a]/40 focus:ring-2 cursor-pointer accent-[#4dbd5a]"
              required
            />
            <label htmlFor="l-terminos" className="text-xs text-[#c4c6ca] leading-tight cursor-pointer select-none">
              Acepto los{' '}
              <button
                type="button"
                onClick={() => setShowTermsModal(true)}
                className="text-[#4dbd5a] underline hover:text-[#7ed944] font-semibold cursor-pointer"
              >
                términos y condiciones
              </button>{' '}
              para comercios asociados y aliados de Sierra App.
            </label>
          </div>

          {error && (
            <div className="p-3 bg-red-950/40 border border-red-500/50 rounded-xl text-xs text-red-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !lAceptaTerminos}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#1a5c27] to-[#0d3318] border border-[#2a8c3a] text-white font-bold text-sm transition-all hover:scale-[1.02] mt-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Registrando restaurante...</span>
              </>
            ) : (
              'Crear restaurante y continuar →'
            )}
          </button>
        </form>
      </div>
      {showTermsModal && <TermsModal onClose={() => setShowTermsModal(false)} />}
    </div>
  )

  // ---- Register: Local → Solicitud enviada ----
  if (screen === 'register_local_platillos') return (
    <div className="min-h-screen bg-[#1a1b1e] flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {BG}
      <div className="relative w-full max-w-sm text-center">
        <div className="w-16 h-16 bg-[#4dbd5a]/20 border-2 border-[#4dbd5a] rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">✅</div>
        <h2 className="text-3xl font-bold text-white uppercase mb-2" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
          ¡Solicitud enviada!
        </h2>
        <p className="text-[#c4c6ca] text-sm mb-2 font-medium">¡Tu restaurante <span className="text-[#4dbd5a] font-bold">{lNombre || 'Tu restaurante'}</span> fue registrado!</p>
        <p className="text-[#9a9da3] text-xs mb-6 leading-relaxed">
          Tu cuenta está en revisión. Un administrador validará tu información y te avisaremos por correo cuando tu panel esté activo para que puedas agregar tus primeros platillos.
        </p>
        <button onClick={() => {
          setPrefilledRole('local')
          setPrefilledEmail(lEmail.trim())
          setSelectedRole('local')
          setEmail(lEmail.trim())
          setPassword('')
          changeScreen('login')
        }}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#1a5c27] to-[#0d3318] border border-[#2a8c3a] text-white font-bold text-sm transition-all hover:scale-[1.02] shadow-lg cursor-pointer">
          Ir a iniciar sesión 🏪
        </button>
        <button onClick={() => changeScreen('roleSelect')} className="text-[#9a9da3] text-xs mt-3 hover:text-white transition-colors cursor-pointer block w-full text-center">
          Volver al inicio
        </button>
      </div>
    </div>
  )

  // ---- Register: Repartidor form ----
  if (screen === 'register_repartidor') return (
    <div className="min-h-screen bg-[#1a1b1e] flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {BG}
      <div className="relative w-full max-w-sm">
        <BackBtn to="register_roleSelect" />
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-full bg-[#7ed944] flex items-center justify-center text-[#1a1b1e] font-bold text-sm">🏍️</div>
          <h2 className="text-2xl font-bold text-white uppercase" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Registro de repartidor</h2>
        </div>

        <form onSubmit={handleRegisterRepartidor} className="space-y-4">
          <div>
            <label className="text-[#c4c6ca] text-xs font-semibold block mb-1">Nombre completo</label>
            <input value={rNombre} onChange={e => setRNombre(e.target.value)} required placeholder="Juan Pérez"
              className="w-full bg-[#232427] border border-[#35373b] focus:border-[#7ed944] rounded-xl px-4 py-3 text-sm text-white placeholder-[#9a9da3] outline-none transition-colors" />
          </div>
          <div>
            <label className="text-[#c4c6ca] text-xs font-semibold block mb-1">Correo electrónico</label>
            <input type="email" value={rEmail} onChange={e => setREmail(e.target.value)} required placeholder="repartidor@correo.com"
              className="w-full bg-[#232427] border border-[#35373b] focus:border-[#7ed944] rounded-xl px-4 py-3 text-sm text-white placeholder-[#9a9da3] outline-none transition-colors" />
          </div>
          <div>
            <label className="text-[#c4c6ca] text-xs font-semibold block mb-1">Contraseña</label>
            <input type="password" value={rPass} onChange={e => setRPass(e.target.value)} required placeholder="Mínimo 10 caracteres"
              className="w-full bg-[#232427] border border-[#35373b] focus:border-[#7ed944] rounded-xl px-4 py-3 text-sm text-white placeholder-[#9a9da3] outline-none transition-colors" />
          </div>
          <div>
            <label className="text-[#c4c6ca] text-xs font-semibold block mb-1">Confirmar contraseña</label>
            <input type="password" value={rPass2} onChange={e => setRPass2(e.target.value)} required placeholder="••••••••"
              className={`w-full bg-[#232427] border ${rPass2 && rPass !== rPass2 ? 'border-red-600' : 'border-[#35373b] focus:border-[#7ed944]'} rounded-xl px-4 py-3 text-sm text-white placeholder-[#9a9da3] outline-none transition-colors`} />
            {rPass2 && rPass !== rPass2 && <p className="text-red-400 text-[10px] mt-0.5">Las contraseñas no coinciden</p>}
          </div>
          <div>
            <label className="text-[#c4c6ca] text-xs font-semibold block mb-1">Número de teléfono</label>
            <input type="tel" value={rTelefono} onChange={e => setRTelefono(e.target.value)} required placeholder="618 123 4567"
              className="w-full bg-[#232427] border border-[#35373b] focus:border-[#7ed944] rounded-xl px-4 py-3 text-sm text-white placeholder-[#9a9da3] outline-none transition-colors" />
          </div>
          <div>
            <label className="text-[#c4c6ca] text-xs font-semibold block mb-1">Fotografía de perfil</label>
            <div onClick={() => fotoRef.current?.click()}
              className="h-32 border-2 border-dashed border-[#35373b] hover:border-[#7ed944] rounded-xl flex items-center justify-center cursor-pointer overflow-hidden transition-colors">
              {rFoto ? (
                <img src={rFoto} alt="preview" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-1 text-[#9a9da3]"><span className="text-3xl">📷</span><span className="text-xs">Subir foto</span></div>
              )}
            </div>
            <input ref={fotoRef} type="file" accept="image/*" onChange={handleFoto} className="hidden" />
          </div>

          <div>
            <label className="text-[#c4c6ca] text-xs font-semibold block mb-2">¿Cuentas con vehículo para repartir?</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRTieneVehiculo(true)}
                className={`flex items-center gap-2 py-3 px-3 rounded-xl border-2 transition-colors cursor-pointer ${
                  rTieneVehiculo === true
                    ? 'border-[#7ed944] bg-[#7ed944]/10 text-[#7ed944]'
                    : 'border-[#35373b] bg-[#232427] text-[#9a9da3] hover:border-[#7ed944]/50'
                }`}
              >
                <span className={`w-4 h-4 rounded flex items-center justify-center border-2 shrink-0 ${rTieneVehiculo === true ? 'bg-[#7ed944] border-[#7ed944]' : 'border-[#35373b]'}`}>
                  {rTieneVehiculo === true && <span className="text-[#1a1b1e] text-[10px] font-bold">✓</span>}
                </span>
                <span className="text-sm font-semibold">Sí, tengo</span>
              </button>
              <button
                type="button"
                onClick={() => { setRTieneVehiculo(false); setRVehiculo('') }}
                className={`flex items-center gap-2 py-3 px-3 rounded-xl border-2 transition-colors cursor-pointer ${
                  rTieneVehiculo === false
                    ? 'border-[#7ed944] bg-[#7ed944]/10 text-[#7ed944]'
                    : 'border-[#35373b] bg-[#232427] text-[#9a9da3] hover:border-[#7ed944]/50'
                }`}
              >
                <span className={`w-4 h-4 rounded flex items-center justify-center border-2 shrink-0 ${rTieneVehiculo === false ? 'bg-[#7ed944] border-[#7ed944]' : 'border-[#35373b]'}`}>
                  {rTieneVehiculo === false && <span className="text-[#1a1b1e] text-[10px] font-bold">✓</span>}
                </span>
                <span className="text-sm font-semibold">No tengo</span>
              </button>
            </div>
          </div>

          {rTieneVehiculo && (
            <div>
              <label className="text-[#c4c6ca] text-xs font-semibold block mb-1">Tipo o modelo de vehículo (opcional)</label>
              <input value={rVehiculo} onChange={e => setRVehiculo(e.target.value)} placeholder="Ej. Motocicleta Italika FT150, Bicicleta..."
                className="w-full bg-[#232427] border border-[#35373b] focus:border-[#7ed944] rounded-xl px-4 py-3 text-sm text-white placeholder-[#9a9da3] outline-none transition-colors" />
            </div>
          )}

          {/* Términos y condiciones */}
          <div className="flex items-start gap-2.5 pt-1">
            <input
              id="r-terminos"
              type="checkbox"
              checked={rAceptaTerminos}
              onChange={e => setRAceptaTerminos(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-[#35373b] bg-[#232427] text-[#7ed944] focus:ring-[#7ed944]/40 focus:ring-2 cursor-pointer accent-[#7ed944]"
              required
            />
            <label htmlFor="r-terminos" className="text-xs text-[#c4c6ca] leading-tight cursor-pointer select-none">
              Acepto los{' '}
              <button
                type="button"
                onClick={() => setShowTermsModal(true)}
                className="text-[#7ed944] underline hover:text-white font-semibold cursor-pointer"
              >
                términos y condiciones
              </button>{' '}
              del servicio de repartidores y las normas de entrega de Sierra App.
            </label>
          </div>

          {error && (
            <div className="p-3 bg-red-950/40 border border-red-500/50 rounded-xl text-xs text-red-300">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading || rTieneVehiculo === null || !rAceptaTerminos}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#35373b] to-[#232427] border border-[#7ed944] text-[#7ed944] font-bold text-sm transition-all hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-[#7ed944] border-t-transparent rounded-full animate-spin" />
                <span>Registrando repartidor...</span>
              </>
            ) : (
              'Generar matrícula y registrarme'
            )}
          </button>
        </form>
      </div>
      {showTermsModal && <TermsModal onClose={() => setShowTermsModal(false)} />}
    </div>
  )

  // ---- Repartidor result ----
  if (screen === 'register_repartidor_result') return (
    <div className="min-h-screen bg-[#1a1b1e] flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {BG}
      <div className="relative w-full max-w-sm text-center">
        <div className="w-20 h-20 rounded-full mx-auto mb-4 overflow-hidden border-2 border-[#7ed944] bg-[#232427] flex items-center justify-center">
          {rFoto ? <img src={rFoto} alt="foto" className="w-full h-full object-cover" /> : <span className="text-4xl">👤</span>}
        </div>
        <h2 className="text-3xl font-bold text-white uppercase" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>¡Solicitud enviada!</h2>
        <p className="text-[#9a9da3] text-sm mt-1 mb-6">Bienvenido a Sierra App, {rNombre || 'Repartidor'}</p>

        <div className="bg-[#232427] border border-[#7ed944]/50 rounded-2xl p-5 mb-6 text-left space-y-3">
          <div className="pb-3 border-b border-[#35373b]">
            <p className="text-[#9a9da3] text-[10px] uppercase tracking-widest">Nombre</p>
            <p className="text-white font-bold text-base">{rNombre || 'Juan Pérez'}</p>
          </div>
          <div className="pb-3 border-b border-[#35373b]">
            <p className="text-[#9a9da3] text-[10px] uppercase tracking-widest">Teléfono</p>
            <p className="text-white font-bold text-base">{rTelefono || '618 123 4567'}</p>
          </div>
          <div className="pb-3 border-b border-[#35373b]">
            <p className="text-[#9a9da3] text-[10px] uppercase tracking-widest">Vehículo propio</p>
            <p className="text-white font-bold text-base">{rTieneVehiculo ? (rVehiculo ? `Sí (${rVehiculo})` : 'Sí') : 'No'}</p>
          </div>
          <div className="pb-3 border-b border-[#35373b]">
            <p className="text-[#9a9da3] text-[10px] uppercase tracking-widest">Matrícula asignada</p>
            <p className="text-[#7ed944] font-bold text-2xl tracking-widest" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>{backendMatricula || rMatricula}</p>
            <p className="text-[#9a9da3] text-[10px] mt-0.5">Asignada oficialmente por el sistema · No la compartas</p>
          </div>
          <div className="pb-3 border-b border-[#35373b]">
            <p className="text-[#9a9da3] text-[10px] uppercase tracking-widest">Estado de cuenta</p>
            <p className="text-yellow-400 font-bold text-sm">Pendiente de aprobación</p>
            <p className="text-[#9a9da3] text-[10px] mt-0.5">Un administrador revisará tus datos antes de activar tus entregas.</p>
          </div>
          {rFoto && (
            <div>
              <p className="text-[#9a9da3] text-[10px] uppercase tracking-widest mb-1">Foto</p>
              <img src={rFoto} alt="Foto repartidor" className="w-14 h-14 rounded-xl object-cover" />
            </div>
          )}
        </div>

        <button onClick={() => {
          setPrefilledRole('repartidor')
          setPrefilledEmail(rEmail.trim())
          setSelectedRole('repartidor')
          setEmail(rEmail.trim())
          setPassword('')
          changeScreen('login')
        }}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#35373b] to-[#232427] border border-[#7ed944] text-[#7ed944] font-bold text-sm transition-all hover:scale-[1.02] shadow-lg cursor-pointer">
          Ir a iniciar sesión 🏍️
        </button>
        <button onClick={() => changeScreen('roleSelect')} className="text-[#9a9da3] text-xs mt-3 hover:text-white transition-colors cursor-pointer block w-full text-center">
          Volver al inicio
        </button>
      </div>
    </div>
  )

  return null
}

/**
 * Componente auxiliar para los títulos de sección en los formularios de registro.
 */
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[#5bc827] text-xs font-bold uppercase tracking-widest pt-2 border-t border-[#35373b]">{children}</p>
  )
}

/**
 * Componente reutilizable para los campos de entrada (inputs) en los formularios.
 * 
 * @param {Object} props - Propiedades como label, valor, onChange, placeholder, tipo y mensaje de error.
 */
function Field({ label, value, onChange, placeholder, type = 'text', error = '' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string; error?: string
}) {
  return (
    <div>
      <label className="text-[#c4c6ca] text-xs font-semibold block mb-1">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className={`w-full bg-[#232427] border ${error ? 'border-red-600' : 'border-[#35373b] focus:border-[#5bc827]'} rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#9a9da3] outline-none transition-colors`} />
      {error && <p className="text-red-400 text-[10px] mt-0.5">{error}</p>}
    </div>
  )
}

/**
 * Modal interactivo con los Términos y Condiciones de Sierra App.
 */
function TermsModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-[#232427] border border-[#35373b] w-full max-w-md max-h-[85vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-[#35373b] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">📋</span>
            <h3 className="font-bold text-white text-base uppercase" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
              Términos y Condiciones
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#9a9da3] hover:text-white text-xl leading-none p-1 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4 text-xs text-[#c4c6ca] leading-relaxed">
          <p className="text-[#9a9da3]">
            Última actualización: Septiembre 2026 · Sierra App (El Salto, Pueblo Nuevo, Durango).
          </p>

          <div>
            <h4 className="font-bold text-[#5bc827] text-sm mb-1">1. Objeto y Alcance de la Plataforma</h4>
            <p>
              Sierra App es una plataforma digital de intermediación que conecta a usuarios consumidores, comercios y restaurantes aliados, y repartidores independientes dentro de la región de El Salto, Pueblo Nuevo, Durango.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-[#5bc827] text-sm mb-1">2. Registro y Veracidad de la Información</h4>
            <p>
              Al crear una cuenta como Usuario, Comercio Colaborador o Repartidor, te comprometes a proporcionar información real, vigente y verificable. Eres responsable de mantener la confidencialidad de tus credenciales de acceso.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-[#5bc827] text-sm mb-1">3. Pedidos, Pagos y Precios</h4>
            <p>
              Los precios de los platillos y productos son fijados directamente por cada comercio afiliado. Sierra App gestiona la comunicación, comisiones de servicio y logística de entrega en tiempo real. Los métodos de pago aceptados incluyen tarjeta, efectivo y pago en ventanilla según disponibilidad.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-[#5bc827] text-sm mb-1">4. Normas para Comercios y Repartidores</h4>
            <p>
              Los colaboradores comerciales garantizan la higiene y calidad de los alimentos preparados. Los repartidores se comprometen a respetar las normas de tránsito locales, cuidar la integridad de los pedidos y mantener un trato respetuoso hacia clientes y comercios.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-[#5bc827] text-sm mb-1">5. Privacidad y Protección de Datos</h4>
            <p>
              Tus datos personales y de ubicación se emplean exclusivamente para procesar tus pedidos, calcular tiempos de entrega y contactarte en caso de incidencias con tu orden, de conformidad con las leyes de privacidad aplicables.
            </p>
          </div>
        </div>

        <div className="p-4 border-t border-[#35373b] bg-[#1a1b1e]">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-[#5bc827] hover:bg-[#7ed944] text-[#1a1b1e] font-bold text-sm transition-all cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  )
}


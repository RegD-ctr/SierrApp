import { useState, useRef } from 'react'
import logoImg from '@/imports/logo.jpeg'

export type Role = 'usuario' | 'local' | 'repartidor' | 'admin'
type Screen =
  | 'roleSelect'
  | 'login'
  | 'register_roleSelect'
  | 'register_usuario'
  | 'register_local'
  | 'register_local_platillos'
  | 'register_repartidor'
  | 'register_repartidor_result'

const repartidorRole = { id: 'repartidor' as Role, label: 'Repartidor', desc: 'Gestiona tus entregas', icon: '🏍️', border: 'border-[#7ed944]', text: 'text-[#7ed944]', gradient: 'from-[#35373b] to-[#232427]' }
const adminRole = { id: 'admin' as Role, label: 'Administrador', desc: 'Panel de control', icon: '🛡️', border: 'border-[#d9a05b]', text: 'text-[#d9a05b]', gradient: 'from-[#5e4526] to-[#2d2112]' }

const roles = [
  { id: 'usuario' as Role, label: 'Usuario', desc: 'Pide comida, súper y más', icon: '🛵', border: 'border-[#5bc827]', text: 'text-[#5bc827]', gradient: 'from-[#5bc827] to-[#3d8c18]' },
  { id: 'local' as Role,   label: 'Local Asociado', desc: 'Administra tu negocio', icon: '🏪', border: 'border-[#2a8c3a]', text: 'text-[#4dbd5a]', gradient: 'from-[#1a5c27] to-[#0d3318]' },
]

function genMatricula() {
  const n = Math.floor(100000 + Math.random() * 900000)
  return `REP-${n}`
}

interface Props {
  onLogin: (role: Role) => void
}

export default function Login({ onLogin }: Props) {
  const [screen, setScreen] = useState<Screen>('roleSelect')
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)

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

  // Local register fields
  const [lNombre, setLNombre] = useState('')
  const [lDir, setLDir] = useState('')
  const [lTel, setLTel] = useState('')

  // Repartidor register fields
  const [rNombre, setRNombre] = useState('')
  const [rFoto, setRFoto] = useState<string | null>(null)
  const [rMatricula] = useState(genMatricula)
  const fotoRef = useRef<HTMLInputElement>(null)

  const activeRole = selectedRole === 'repartidor' ? repartidorRole : selectedRole === 'admin' ? adminRole : roles.find(r => r.id === selectedRole)

  const handleFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setRFoto(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const BG = (
    <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle, #5bc827 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
  )

  const LogoHeader = () => (
    <div className="flex flex-col items-center mb-8">
      <img src={logoImg} alt="Sierra App" className="w-20 h-20 rounded-2xl object-cover shadow-2xl shadow-[#5bc827]/20 mb-3" />
      <h1 className="text-4xl font-bold text-[#5bc827] tracking-widest uppercase" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>SIERRA APP</h1>
      <p className="text-[#9a9da3] text-xs tracking-widest uppercase mt-1">Todo lo que necesitas, a un toque.</p>
    </div>
  )

  const BackBtn = ({ to, label = 'Volver' }: { to: Screen; label?: string }) => (
    <button onClick={() => setScreen(to)} className="flex items-center gap-1 text-[#9a9da3] hover:text-[#5bc827] text-sm mb-5 transition-colors">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
      {label}
    </button>
  )

  // ---- Role Select ----
  if (screen === 'roleSelect') return (
    <div className="min-h-screen bg-[#1a1b1e] flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {BG}
      <button onClick={() => { setSelectedRole('admin'); setScreen('login') }} className="absolute bottom-4 right-4 text-[#7aaa70] text-[10px] hover:underline opacity-60 hover:opacity-100 transition-opacity z-10">
        Acceso administrador
      </button>
      <div className="relative w-full max-w-sm">
        <LogoHeader />
        <p className="text-center text-[#c4c6ca] text-sm mb-5">¿Cómo quieres ingresar?</p>
        <div className="space-y-3 mb-5">
          {roles.map(role => (
            <button key={role.id} onClick={() => { setSelectedRole(role.id); setScreen('login') }}
              className="w-full flex items-center gap-4 p-4 rounded-2xl border border-[#2a4830] bg-[#142a17] hover:bg-[#1a3320] hover:border-[#5bc827]/50 transition-all hover:scale-[1.02] active:scale-[0.98] text-left">
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
          <button onClick={() => setScreen('register_roleSelect')} className="text-[#5bc827] font-semibold hover:underline">
            Crear cuenta
          </button>
        </p>
        <div className="w-full h-px bg-[#35373b] my-5"></div>
        <p className="text-center text-[#9a9da3] text-sm">
          ¿Eres o quieres ser repartidor?{' '}
          <button onClick={() => { setSelectedRole('repartidor'); setScreen('login') }} className="text-[#7ed944] font-semibold hover:underline">
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
          <button onClick={() => setScreen('register_roleSelect')} className={`${activeRole.text} font-semibold hover:underline`}>Regístrate aquí</button>
        </p>
        <form onSubmit={e => { e.preventDefault(); onLogin(selectedRole!) }} className="space-y-3">
          <div>
            <label className="text-[#c4c6ca] text-xs font-semibold block mb-1">Correo electrónico</label>
            <input type="email" placeholder="ejemplo@correo.com" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full bg-[#232427] border border-[#35373b] focus:border-[#5bc827] rounded-xl px-4 py-3 text-sm text-white placeholder-[#9a9da3] outline-none transition-colors" />
          </div>
          <div className="relative">
            <label className="text-[#c4c6ca] text-xs font-semibold block mb-1">Contraseña</label>
            <input type={showPass ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required
              className="w-full bg-[#232427] border border-[#35373b] focus:border-[#5bc827] rounded-xl px-4 py-3 text-sm text-white placeholder-[#9a9da3] outline-none transition-colors pr-10" />
            <button type="button" onClick={() => setShowPass(s => !s)} className="absolute right-3 bottom-3 text-[#9a9da3]">{showPass ? '🙈' : '👁️'}</button>
          </div>
          <button type="button" className={`text-xs ${activeRole.text} hover:underline w-full text-right`}>¿Olvidaste tu contraseña?</button>
          <button type="submit" className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] mt-2 bg-gradient-to-r ${activeRole.gradient} text-white shadow-lg`}>
            Entrar
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
            { id: 'usuario', label: 'Usuario / Cliente', desc: 'Realiza pedidos de comida y más', icon: '👤', screen: 'register_usuario' as Screen },
            { id: 'local', label: 'Restaurante', desc: 'Registra y administra tu negocio', icon: '🏪', screen: 'register_local' as Screen },
          ].map(opt => (
            <button key={opt.id} onClick={() => setScreen(opt.screen)}
              className="w-full flex items-center gap-4 p-4 rounded-2xl border border-[#2a4830] bg-[#142a17] hover:bg-[#1a3320] hover:border-[#5bc827]/50 transition-all text-left">
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
          <button onClick={() => setScreen('register_repartidor')} className="text-[#7ed944] font-semibold hover:underline">
            Regístrate aquí
          </button>
        </p>
      </div>
    </div>
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

        <form onSubmit={e => { e.preventDefault(); onLogin('usuario') }} className="space-y-3">
          <SectionTitle>Datos personales</SectionTitle>
          <Field label="Nombre completo" value={uNombre} onChange={setUNombre} placeholder="Juan Sierra" />
          <Field label="Correo electrónico" value={uEmail} onChange={setUEmail} placeholder="juan@correo.com" type="email" />
          <Field label="Contraseña" value={uPass} onChange={setUPass} placeholder="••••••••" type="password" />
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

          <button type="submit" className="w-full py-3.5 rounded-xl bg-[#5bc827] hover:bg-[#7ed944] text-[#1a1b1e] font-bold text-sm transition-all hover:scale-[1.02] mt-2 shadow-lg shadow-[#5bc827]/20">
            Crear cuenta
          </button>
        </form>
      </div>
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

        <form onSubmit={e => { e.preventDefault(); setScreen('register_local_platillos') }} className="space-y-3">
          <Field label="Nombre del restaurante" value={lNombre} onChange={setLNombre} placeholder="Ej. Taquería El Gordo" />
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

          <button type="submit" className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#1a5c27] to-[#0d3318] border border-[#2a8c3a] text-white font-bold text-sm transition-all hover:scale-[1.02] mt-2">
            Crear restaurante y agregar platillos →
          </button>
        </form>
      </div>
    </div>
  )

  // ---- Register: Local → Agregar platillos ----
  if (screen === 'register_local_platillos') return (
    <div className="min-h-screen bg-[#1a1b1e] flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {BG}
      <div className="relative w-full max-w-sm text-center">
        <div className="w-16 h-16 bg-[#4dbd5a]/20 border-2 border-[#4dbd5a] rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">✅</div>
        <h2 className="text-3xl font-bold text-white uppercase mb-2" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
          ¡{lNombre || 'Tu restaurante'} creado!
        </h2>
        <p className="text-[#9a9da3] text-sm mb-6">Ahora agrega tus primeros platillos para que los clientes puedan ordenar.</p>
        <button onClick={() => onLogin('local')}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#1a5c27] to-[#0d3318] border border-[#2a8c3a] text-white font-bold text-sm transition-all hover:scale-[1.02] shadow-lg">
          Ir a agregar platillos 🍽️
        </button>
        <button onClick={() => onLogin('local')} className="text-[#9a9da3] text-xs mt-3 hover:text-white transition-colors">
          Saltar por ahora →
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

        <form onSubmit={e => { e.preventDefault(); setScreen('register_repartidor_result') }} className="space-y-4">
          <div>
            <label className="text-[#c4c6ca] text-xs font-semibold block mb-1">Nombre completo</label>
            <input value={rNombre} onChange={e => setRNombre(e.target.value)} required placeholder="Juan Pérez"
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
          <button type="submit" className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#35373b] to-[#232427] border border-[#7ed944] text-[#7ed944] font-bold text-sm transition-all hover:scale-[1.02]">
            Generar matrícula y registrarme
          </button>
        </form>
      </div>
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
        <h2 className="text-3xl font-bold text-white uppercase" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>¡Registro exitoso!</h2>
        <p className="text-[#9a9da3] text-sm mt-1 mb-6">Bienvenido a Sierra App, {rNombre || 'Repartidor'}</p>

        <div className="bg-[#232427] border border-[#7ed944]/50 rounded-2xl p-5 mb-6 text-left">
          <div className="mb-3 pb-3 border-b border-[#35373b]">
            <p className="text-[#9a9da3] text-[10px] uppercase tracking-widest">Nombre</p>
            <p className="text-white font-bold text-base">{rNombre || 'Juan Pérez'}</p>
          </div>
          <div className="mb-3 pb-3 border-b border-[#35373b]">
            <p className="text-[#9a9da3] text-[10px] uppercase tracking-widest">Matrícula</p>
            <p className="text-[#7ed944] font-bold text-2xl tracking-widest" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>{rMatricula}</p>
            <p className="text-[#9a9da3] text-[10px] mt-0.5">Generada automáticamente · No la compartas</p>
          </div>
          {rFoto && (
            <div>
              <p className="text-[#9a9da3] text-[10px] uppercase tracking-widest mb-1">Foto</p>
              <img src={rFoto} alt="Foto repartidor" className="w-14 h-14 rounded-xl object-cover" />
            </div>
          )}
        </div>

        <button onClick={() => onLogin('repartidor')}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#35373b] to-[#232427] border border-[#7ed944] text-[#7ed944] font-bold text-sm transition-all hover:scale-[1.02] shadow-lg">
          Ir a mi panel de repartidor 🏍️
        </button>
      </div>
    </div>
  )

  return null
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[#5bc827] text-xs font-bold uppercase tracking-widest pt-2 border-t border-[#35373b]">{children}</p>
  )
}

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

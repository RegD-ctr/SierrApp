import logoImg from '@/imports/logo.jpeg'

type Role = 'usuario' | 'local' | 'repartidor'

const roleLabels: Record<Role, { label: string; icon: string; color: string }> = {
  usuario: { label: 'Usuario', icon: '🛵', color: 'text-[#5bc827]' },
  local: { label: 'Local Asociado', icon: '🏪', color: 'text-[#4dbd5a]' },
  repartidor: { label: 'Repartidor', icon: '🏍️', color: 'text-[#7ed944]' },
}

const menuItems = [
  { icon: '📍', label: 'Mis direcciones', sub: 'Calle Pino #24, Sierra Norte', view: 'addresses' },
  { icon: '💳', label: 'Métodos de pago', sub: '•••• 4821 · Efectivo', view: 'payment-methods' },
  { icon: '🎁', label: 'Promociones y cupones', sub: 'SIERRA1 disponible', view: 'promotions' },
  { icon: '⭐', label: 'Favoritos', sub: '3 restaurantes guardados', view: 'favorites' },
  { icon: '🔔', label: 'Notificaciones', sub: 'Activadas', view: 'notifications' },
  { icon: '🔒', label: 'Privacidad y seguridad', sub: null, view: null },
  { icon: '❓', label: 'Ayuda y soporte', sub: null, view: 'support' },
  { icon: '📋', label: 'Términos y condiciones', sub: null, view: null },
]

const stats = [
  { n: '12', l: 'Pedidos' },
  { n: '$1,840', l: 'Gastado' },
  { n: '4.9', l: 'Mi rating' },
]

interface PerfilProps {
  role: Role
  onLogout: () => void
  onNavigate: (view: string) => void
}

/**
 * Componente que muestra el perfil de usuario.
 * Incluye acceso rápido a configuraciones (direcciones, pagos), estadísticas básicas y la opción de cerrar sesión.
 * 
 * @param {PerfilProps} props - Propiedades que incluyen rol actual, y callbacks para cerrar sesión y navegar.
 */
export default function Perfil({ role, onLogout, onNavigate }: PerfilProps) {
  const roleInfo = roleLabels[role]

  return (
    <div className="min-h-screen bg-[#1a1b1e] pb-24">
      {/* Header hero */}
      <div className="relative bg-gradient-to-b from-[#232427] to-[#1a1b1e] px-4 pt-8 pb-6 border-b border-[#35373b]">
        <h1
          className="text-2xl font-bold text-white uppercase mb-4"
          style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
        >
          Mi Perfil
        </h1>

        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-[#5bc827]/20 border-2 border-[#5bc827] flex items-center justify-center text-2xl font-bold text-[#5bc827]">
              JS
            </div>
            <button className="absolute bottom-0 right-0 bg-[#5bc827] rounded-full w-5 h-5 flex items-center justify-center text-[8px] text-[#1a1b1e]">
              ✏️
            </button>
          </div>
          <div className="flex-1">
            <h2 className="text-white font-bold text-lg leading-tight">Juan Sierra</h2>
            <p className="text-[#9a9da3] text-xs">juan.sierra@email.com</p>
            <div className={`inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-1 rounded-full bg-[#1a1b1e] border border-[#35373b]`}>
              <span className="text-xs">{roleInfo.icon}</span>
              <span className={`text-[10px] font-bold ${roleInfo.color}`}>{roleInfo.label}</span>
            </div>
          </div>
          <button className="text-[#9a9da3] hover:text-[#5bc827] transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        </div>

        {/* Stats */}
        <div className="flex mt-5 bg-[#1a1b1e] rounded-2xl border border-[#35373b] overflow-hidden">
          {stats.map((s, i) => (
            <div key={s.l} className={`flex-1 py-3 text-center ${i < stats.length - 1 ? 'border-r border-[#35373b]' : ''}`}>
              <p
                className="text-[#5bc827] font-bold text-xl"
                style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
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
        {menuItems.map(item => (
          <button
            key={item.label}
            onClick={() => item.view && onNavigate(item.view)}
            className="w-full flex items-center gap-3 px-3 py-3.5 rounded-xl hover:bg-[#232427] transition-colors text-left group"
          >
            <span className="text-xl w-7 text-center">{item.icon}</span>
            <div className="flex-1">
              <p className="text-sm text-white font-medium group-hover:text-[#5bc827] transition-colors">{item.label}</p>
              {item.sub && <p className="text-[10px] text-[#9a9da3] mt-0.5">{item.sub}</p>}
            </div>
            <svg className="w-4 h-4 text-[#35373b] group-hover:text-[#5bc827] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ))}
      </div>

      {/* Sierra App branding + logout */}
      <div className="px-4 mt-6">
        <div className="flex items-center gap-2 justify-center mb-5 opacity-40">
          <img src={logoImg} alt="Sierra App" className="w-5 h-5 rounded object-cover" />
          <span className="text-[#5bc827] text-xs font-bold tracking-widest" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
            SIERRA APP v1.0
          </span>
        </div>
        <button
          onClick={onLogout}
          className="w-full py-3 rounded-xl border border-red-800/50 text-red-400 text-sm font-semibold hover:bg-red-900/20 transition-colors"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}

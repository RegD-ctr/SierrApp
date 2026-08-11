import { useState } from 'react'

type Tab = 'dashboard' | 'usuarios' | 'locales' | 'repartidores' | 'pedidos' | 'config'

interface Props {
  onLogout: () => void
}

export default function AdminPanel({ onLogout }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')

  const navItems: { id: Tab, label: string, icon: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'usuarios', label: 'Usuarios', icon: '👥' },
    { id: 'locales', label: 'Locales', icon: '🏪' },
    { id: 'repartidores', label: 'Repartidores', icon: '🏍️' },
    { id: 'pedidos', label: 'Pedidos', icon: '📦' },
    { id: 'config', label: 'Ajustes', icon: '⚙️' },
  ]

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

  const Title = ({ text }: { text: string }) => (
    <h2 className="text-2xl font-bold text-white uppercase tracking-wide mb-4" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
      {text}
    </h2>
  )

  return (
    <div className="min-h-screen bg-[#1a1b1e] text-white pb-20">
      <TopBar />
      <main className="p-4 max-w-5xl mx-auto">
        {activeTab === 'dashboard' && (
          <div>
            <Title text="Dashboard" />
            <div className="grid grid-cols-2 gap-3 mb-6">
              <StatCard label="Usuarios Totales" value="1,245" icon="👥" />
              <StatCard label="Locales Activos" value="34" icon="🏪" />
              <StatCard label="Repartidores" value="89" icon="🏍️" />
              <StatCard label="Pedidos de Hoy" value="215" icon="📦" />
            </div>
            <div className="bg-gradient-to-r from-[#232427] to-[#1a1b1e] border border-[#d9a05b]/30 rounded-2xl p-5 shadow-lg shadow-[#d9a05b]/5 relative overflow-hidden">
              <div className="absolute right-0 top-0 w-32 h-32 bg-[#d9a05b]/5 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2"></div>
              <p className="text-[#9a9da3] text-xs uppercase tracking-widest mb-1">Ingresos de la plataforma</p>
              <p className="text-4xl font-bold text-[#d9a05b]" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>$45,200.00</p>
            </div>
          </div>
        )}

        {activeTab === 'usuarios' && (
          <div>
            <Title text="Usuarios" />
            <div className="space-y-3">
              {[
                { name: 'Juan Pérez', email: 'juan@email.com', status: 'Activo' },
                { name: 'María García', email: 'maria@email.com', status: 'Activo' },
                { name: 'Pedro Sánchez', email: 'pedro@email.com', status: 'Suspendido' },
              ].map((u, i) => (
                <div key={i} className="bg-[#232427] border border-[#35373b] hover:border-[#d9a05b]/50 p-4 rounded-xl flex items-center justify-between transition-colors">
                  <div>
                    <p className="font-bold text-sm text-white">{u.name}</p>
                    <p className="text-[#9a9da3] text-xs">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`${u.status === 'Activo' ? 'text-[#5bc827] bg-[#5bc827]/10' : 'text-red-400 bg-red-400/10'} text-[10px] uppercase font-bold px-2 py-1 rounded`}>{u.status}</span>
                    <button className="text-[#9a9da3] hover:text-white transition-colors">⋮</button>
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
            <Title text="Configuración" />
            <div className="space-y-5">
              <div className="bg-[#232427] p-5 rounded-xl border border-[#35373b]">
                <label className="text-[#c4c6ca] text-xs font-semibold block mb-2">Comisión a los locales (%)</label>
                <input type="number" defaultValue={15} className="w-full bg-[#1a1b1e] border border-[#35373b] focus:border-[#d9a05b] rounded-xl px-4 py-3 text-sm text-white outline-none transition-colors" />
              </div>
              <div className="bg-[#232427] p-5 rounded-xl border border-[#35373b]">
                <label className="text-[#c4c6ca] text-xs font-semibold block mb-2">Costos de uso de los repartidores ($)</label>
                <input type="number" defaultValue={20} className="w-full bg-[#1a1b1e] border border-[#35373b] focus:border-[#d9a05b] rounded-xl px-4 py-3 text-sm text-white outline-none transition-colors" />
              </div>
              <div className="bg-[#232427] p-5 rounded-xl border border-[#35373b]">
                <label className="text-[#c4c6ca] text-xs font-semibold block mb-2">Gastos al usuario ($)</label>
                <input type="number" defaultValue={10} className="w-full bg-[#1a1b1e] border border-[#35373b] focus:border-[#d9a05b] rounded-xl px-4 py-3 text-sm text-white outline-none transition-colors" />
              </div>
              <div className="bg-[#232427] p-5 rounded-xl border border-[#35373b]">
                <label className="text-[#c4c6ca] text-xs font-semibold block mb-3">Zonas de cobertura activas</label>
                <div className="flex gap-2 flex-wrap">
                  <span className="bg-[#d9a05b]/20 border border-[#d9a05b]/50 text-[#d9a05b] px-3 py-1.5 rounded-full text-xs font-bold">Norte</span>
                  <span className="bg-[#d9a05b]/20 border border-[#d9a05b]/50 text-[#d9a05b] px-3 py-1.5 rounded-full text-xs font-bold">Centro</span>
                  <button className="border border-dashed border-[#9a9da3] text-[#9a9da3] px-3 py-1.5 rounded-full text-xs hover:border-[#d9a05b] hover:text-[#d9a05b] transition-colors">+ Añadir zona</button>
                </div>
              </div>
              <button className="w-full py-4 rounded-xl bg-gradient-to-r from-[#d9a05b] to-[#b38346] shadow-lg shadow-[#d9a05b]/20 text-[#1a1b1e] font-bold text-sm mt-2 transition-all hover:scale-[1.02] active:scale-[0.98]">
                Guardar cambios
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Tabs / Bottom Nav - Similar to other panels */}
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
      
      {/* Hide scrollbar for webkit */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  )
}

function StatCard({ label, value, icon }: { label: string, value: string, icon: string }) {
  return (
    <div className="bg-[#232427] border border-[#35373b] p-3 rounded-xl flex items-center gap-3">
      <div className="text-2xl">{icon}</div>
      <div>
        <p className="text-white font-bold text-lg leading-tight">{value}</p>
        <p className="text-[#9a9da3] text-[10px] uppercase tracking-widest">{label}</p>
      </div>
    </div>
  )
}

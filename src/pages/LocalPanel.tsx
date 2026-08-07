import { useState, useRef } from 'react'
import logoImg from '@/imports/WhatsApp_Image_2026-08-04_at_3.46.56_PM-1.jpeg'

type Role = 'usuario' | 'local' | 'repartidor'
type Filter = 'todos' | 'disponibles' | 'agotados'
type LocalView = 'dashboard' | 'platillos' | 'pedidos' | 'perfil'

interface Platillo {
  id: number
  nombre: string
  descripcion: string
  categoria: string
  precio: string
  imagen: string | null
  disponible: boolean
}

const categorias = ['Entradas', 'Platos fuertes', 'Postres', 'Bebidas', 'Combos', 'Ensaladas', 'Tacos', 'Pizzas', 'Burgers', 'Otro']

const initialPlatillos: Platillo[] = [
  { id: 1, nombre: 'Burger Clásica', descripcion: 'Carne 200g, lechuga, tomate, queso cheddar, papas incluidas.', categoria: 'Burgers', precio: '120', imagen: 'https://images.unsplash.com/photo-1512152272829-e3139592d56f?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&w=200&h=200', disponible: true },
  { id: 2, nombre: 'Papas Fritas', descripcion: 'Papas crujientes con sal y ajo, porción grande.', categoria: 'Entradas', precio: '55', imagen: 'https://images.unsplash.com/photo-1517434324-1db605ff03c7?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&w=200&h=200', disponible: true },
  { id: 3, nombre: 'Refresco 600ml', descripcion: 'Variedad de sabores: cola, naranja, limón.', categoria: 'Bebidas', precio: '30', imagen: null, disponible: false },
]

const statsData = [
  { label: 'Ventas hoy', value: '$1,240', icon: '💰', trend: '+12%' },
  { label: 'Pedidos activos', value: '3', icon: '📦', trend: null },
  { label: 'Platillos activos', value: '8', icon: '🍽️', trend: null },
  { label: 'Rating promedio', value: '4.7 ★', icon: '⭐', trend: '+0.2' },
]

interface Props {
  onLogout: () => void
}

export default function LocalPanel({ onLogout }: Props) {
  const [view, setView] = useState<LocalView>('dashboard')
  const [platillos, setPlatillos] = useState<Platillo[]>(initialPlatillos)
  const [filter, setFilter] = useState<Filter>('todos')
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [confirmSoldOut, setConfirmSoldOut] = useState<number | null>(null)

  const emptyForm = { nombre: '', descripcion: '', categoria: categorias[0], precio: '', imagen: null as string | null, disponible: true }
  const [form, setForm] = useState(emptyForm)
  const fileRef = useRef<HTMLInputElement>(null)

  const filtered = platillos.filter(p =>
    filter === 'todos' ? true : filter === 'disponibles' ? p.disponible : !p.disponible
  )

  const openAdd = () => { setForm(emptyForm); setEditId(null); setShowForm(true) }

  const openEdit = (p: Platillo) => {
    setForm({ nombre: p.nombre, descripcion: p.descripcion, categoria: p.categoria, precio: p.precio, imagen: p.imagen, disponible: p.disponible })
    setEditId(p.id)
    setShowForm(true)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setForm(f => ({ ...f, imagen: ev.target?.result as string }))
    reader.readAsDataURL(file)
  }

  const handleSave = () => {
    if (!form.nombre.trim() || !form.precio.trim()) return
    if (editId !== null) {
      setPlatillos(ps => ps.map(p => p.id === editId ? { ...p, ...form } : p))
    } else {
      setPlatillos(ps => [...ps, { id: Date.now(), ...form }])
    }
    setShowForm(false)
  }

  const toggleDisponible = (id: number) => {
    setPlatillos(ps => ps.map(p => p.id === id ? { ...p, disponible: !p.disponible } : p))
    setConfirmSoldOut(null)
  }

  const navItems: { icon: string; label: string; view: LocalView }[] = [
    { icon: '📊', label: 'Panel', view: 'dashboard' },
    { icon: '🍽️', label: 'Platillos', view: 'platillos' },
    { icon: '📦', label: 'Pedidos', view: 'pedidos' },
    { icon: '👤', label: 'Perfil', view: 'perfil' },
  ]

  return (
    <div className="min-h-screen bg-[#0d1a0f] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0d1a0f]/95 backdrop-blur-sm border-b border-[#2a4830]">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <img src={logoImg} alt="Sierra App" className="w-9 h-9 rounded-lg object-cover" />
            <div>
              <p className="text-[#5bc827] text-xs font-bold tracking-widest uppercase" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Sierra App</p>
              <p className="text-[#7aaa70] text-[10px]">Panel de Local</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#5bc827] animate-pulse" />
            <span className="text-[#5bc827] text-xs font-semibold">Abierto</span>
            <span className="text-[#2a4830] mx-1">|</span>
            <span className="text-[#7aaa70] text-xs">Sierra Burger Co.</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 pb-28">

        {/* DASHBOARD */}
        {view === 'dashboard' && (
          <div className="pt-5">
            <h1 className="text-3xl font-bold text-white uppercase mb-1" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
              ¡Buen día, Sierra Burger! 👋
            </h1>
            <p className="text-[#7aaa70] text-sm mb-6">Resumen de tu negocio hoy</p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-7">
              {statsData.map(s => (
                <div key={s.label} className="bg-[#142a17] border border-[#2a4830] rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xl">{s.icon}</span>
                    {s.trend && <span className="text-[#5bc827] text-[10px] font-bold">{s.trend}</span>}
                  </div>
                  <p className="text-white font-bold text-xl" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>{s.value}</p>
                  <p className="text-[#7aaa70] text-[10px]">{s.label}</p>
                </div>
              ))}
            </div>

            <h2 className="text-xl font-bold text-white uppercase mb-3" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Acciones rápidas</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { icon: '➕', label: 'Agregar platillo', action: () => { setView('platillos'); openAdd() } },
                { icon: '📋', label: 'Ver mis platillos', action: () => setView('platillos') },
                { icon: '📦', label: 'Órdenes activas', action: () => setView('pedidos') },
              ].map(a => (
                <button
                  key={a.label}
                  onClick={a.action}
                  className="bg-[#142a17] border border-[#2a4830] hover:border-[#5bc827]/60 rounded-2xl p-5 flex flex-col items-start gap-2 transition-all hover:bg-[#1a3320] text-left group"
                >
                  <span className="text-2xl">{a.icon}</span>
                  <span className="text-sm font-semibold text-[#a8d89a] group-hover:text-white transition-colors">{a.label}</span>
                </button>
              ))}
            </div>

            <div className="mt-6 bg-[#142a17] border border-[#5bc827]/30 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-[#5bc827] animate-pulse" />
                <h3 className="text-sm font-bold text-white">3 pedidos activos</h3>
              </div>
              {[
                { id: '#SRR-4821', items: 'Burger Clásica x2, Papas x2', status: 'Preparando' },
                { id: '#SRR-4820', items: 'Combo Doble x1', status: 'Listo para recoger' },
                { id: '#SRR-4819', items: 'Burger Clásica x1, Refresco x1', status: 'Nuevo pedido' },
              ].map(p => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-[#2a4830] last:border-0">
                  <div>
                    <span className="text-xs font-bold text-[#5bc827]">{p.id}</span>
                    <p className="text-[#7aaa70] text-[10px]">{p.items}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    p.status === 'Nuevo pedido' ? 'bg-yellow-900/40 text-yellow-400' :
                    p.status === 'Listo para recoger' ? 'bg-[#5bc827]/20 text-[#5bc827]' :
                    'bg-blue-900/30 text-blue-400'
                  }`}>
                    {p.status}
                  </span>
                </div>
              ))}
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
                className="bg-[#5bc827] hover:bg-[#7ed944] text-[#0d1a0f] font-bold text-sm px-4 py-2 rounded-full flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95"
              >
                <span className="text-base leading-none">+</span> Agregar platillo
              </button>
            </div>

            {/* Filters */}
            <div className="flex bg-[#142a17] rounded-full p-1 w-fit gap-1 mb-5">
              {(['todos', 'disponibles', 'agotados'] as Filter[]).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold capitalize transition-all ${
                    filter === f ? 'bg-[#5bc827] text-[#0d1a0f]' : 'text-[#7aaa70] hover:text-white'
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
                <p className="text-[#7aaa70] text-sm mt-1">
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
                    onToggle={() => p.disponible ? setConfirmSoldOut(p.id) : toggleDisponible(p.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* PEDIDOS */}
        {view === 'pedidos' && (
          <div className="pt-5">
            <h1 className="text-3xl font-bold text-white uppercase mb-5" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Pedidos Activos</h1>
            <div className="space-y-3">
              {[
                { id: '#SRR-4821', cliente: 'Juan Sierra', items: ['Burger Clásica x2', 'Papas Fritas x2'], total: '$350', hora: '8:42 pm', status: 'Preparando', statusColor: 'bg-blue-900/30 text-blue-400' },
                { id: '#SRR-4820', cliente: 'María López', items: ['Combo Doble x1'], total: '$190', hora: '8:38 pm', status: 'Listo para recoger', statusColor: 'bg-[#5bc827]/20 text-[#5bc827]' },
                { id: '#SRR-4819', cliente: 'Carlos R.', items: ['Burger Clásica x1', 'Refresco x1'], total: '$150', hora: '8:31 pm', status: 'Nuevo pedido', statusColor: 'bg-yellow-900/40 text-yellow-400' },
              ].map(order => (
                <div key={order.id} className="bg-[#142a17] border border-[#2a4830] rounded-2xl p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="text-[#5bc827] text-sm font-bold">{order.id}</span>
                      <p className="text-white text-xs font-semibold">{order.cliente}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${order.statusColor}`}>{order.status}</span>
                  </div>
                  <p className="text-[#7aaa70] text-xs mb-2">{order.items.join(' · ')}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#7aaa70]">⏱ {order.hora}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[#5bc827] font-bold text-sm">{order.total}</span>
                      <button className="bg-[#5bc827] hover:bg-[#7ed944] text-[#0d1a0f] text-xs font-bold px-3 py-1 rounded-full transition-colors">
                        Marcar listo
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PERFIL */}
        {view === 'perfil' && (
          <div className="pt-5">
            <h1 className="text-3xl font-bold text-white uppercase mb-5" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Mi Negocio</h1>
            <div className="bg-[#142a17] border border-[#2a4830] rounded-2xl p-5 mb-4 flex items-center gap-4">
              <div className="w-16 h-16 bg-[#5bc827]/20 border-2 border-[#5bc827] rounded-2xl flex items-center justify-center text-2xl">🏪</div>
              <div>
                <h2 className="text-white font-bold text-lg">Sierra Burger Co.</h2>
                <p className="text-[#7aaa70] text-xs">Hamburguesas · Centro Sierra</p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#5bc827]" />
                  <span className="text-[#5bc827] text-[10px] font-bold">Verificado</span>
                </div>
              </div>
            </div>
            {[
              { icon: '⏰', label: 'Horario de atención', sub: 'Lun–Dom 9:00 am – 11:00 pm' },
              { icon: '📍', label: 'Dirección', sub: 'Av. Sierra #45, Col. Centro' },
              { icon: '📞', label: 'Teléfono', sub: '+52 614 000 0000' },
              { icon: '🏦', label: 'Datos bancarios', sub: 'Cuenta registrada' },
            ].map(item => (
              <button key={item.label} className="w-full flex items-center gap-3 px-3 py-3.5 rounded-xl hover:bg-[#142a17] transition-colors text-left">
                <span className="text-xl w-7 text-center">{item.icon}</span>
                <div className="flex-1">
                  <p className="text-sm text-white font-medium">{item.label}</p>
                  <p className="text-[10px] text-[#7aaa70]">{item.sub}</p>
                </div>
                <svg className="w-4 h-4 text-[#2a4830]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
            <div className="mt-6">
              <button onClick={onLogout} className="w-full py-3 rounded-xl border border-red-800/50 text-red-400 text-sm font-semibold hover:bg-red-900/20 transition-colors">
                Cerrar sesión
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#0d1a0f]/95 backdrop-blur-sm border-t border-[#2a4830] flex justify-around py-2 z-50">
        {navItems.map(item => (
          <button
            key={item.view}
            onClick={() => setView(item.view)}
            className={`flex flex-col items-center gap-0.5 px-4 py-1 transition-colors ${view === item.view ? 'text-[#5bc827]' : 'text-[#7aaa70]'}`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-[10px] font-medium">{item.label}</span>
            {view === item.view && <span className="w-1 h-1 rounded-full bg-[#5bc827] mt-0.5" />}
          </button>
        ))}
      </nav>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[#0d1a0f] border border-[#2a4830] rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
            <div className="px-5 pt-5 pb-2 flex items-center justify-between border-b border-[#2a4830]">
              <h2 className="text-xl font-bold text-white uppercase" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                {editId !== null ? 'Editar platillo' : 'Nuevo platillo'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-[#7aaa70] hover:text-white transition-colors text-xl">✕</button>
            </div>
            <div className="px-5 py-4 space-y-3">
              {/* Image upload */}
              <div>
                <label className="text-[#a8d89a] text-xs font-semibold block mb-1">Fotografía</label>
                <div
                  onClick={() => fileRef.current?.click()}
                  className="w-full h-32 rounded-xl border-2 border-dashed border-[#2a4830] hover:border-[#5bc827] flex items-center justify-center cursor-pointer overflow-hidden transition-colors"
                >
                  {form.imagen ? (
                    <img src={form.imagen} alt="preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-[#7aaa70]">
                      <span className="text-3xl">📷</span>
                      <span className="text-xs">Subir imagen</span>
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </div>

              {[
                { key: 'nombre', label: 'Nombre del platillo', placeholder: 'Ej. Burger Clásica', type: 'text' },
                { key: 'descripcion', label: 'Descripción', placeholder: 'Ingredientes, porciones...', type: 'textarea' },
                { key: 'precio', label: 'Precio ($)', placeholder: '0.00', type: 'number' },
              ].map(field => (
                <div key={field.key}>
                  <label className="text-[#a8d89a] text-xs font-semibold block mb-1">{field.label}</label>
                  {field.type === 'textarea' ? (
                    <textarea
                      value={(form as Record<string, string>)[field.key] as string}
                      onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                      rows={2}
                      className="w-full bg-[#142a17] border border-[#2a4830] focus:border-[#5bc827] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#7aaa70] outline-none transition-colors resize-none"
                    />
                  ) : (
                    <input
                      type={field.type}
                      value={(form as Record<string, string>)[field.key] as string}
                      onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                      className="w-full bg-[#142a17] border border-[#2a4830] focus:border-[#5bc827] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#7aaa70] outline-none transition-colors"
                    />
                  )}
                </div>
              ))}

              <div>
                <label className="text-[#a8d89a] text-xs font-semibold block mb-1">Categoría</label>
                <select
                  value={form.categoria}
                  onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}
                  className="w-full bg-[#142a17] border border-[#2a4830] focus:border-[#5bc827] rounded-xl px-4 py-2.5 text-sm text-white outline-none transition-colors"
                >
                  {categorias.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="flex items-center justify-between bg-[#142a17] border border-[#2a4830] rounded-xl px-4 py-3">
                <div>
                  <p className="text-white text-sm font-semibold">Disponible</p>
                  <p className="text-[#7aaa70] text-xs">Visible para clientes</p>
                </div>
                <button
                  onClick={() => setForm(f => ({ ...f, disponible: !f.disponible }))}
                  className={`w-12 h-6 rounded-full transition-all relative ${form.disponible ? 'bg-[#5bc827]' : 'bg-[#2a4830]'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${form.disponible ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-3 rounded-xl border border-[#2a4830] text-[#7aaa70] text-sm font-semibold hover:border-[#5bc827]/50 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 py-3 rounded-xl bg-[#5bc827] hover:bg-[#7ed944] text-[#0d1a0f] font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Guardar platillo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sold-out confirmation */}
      {confirmSoldOut !== null && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d1a0f] border border-[#2a4830] rounded-2xl w-full max-w-sm p-6 text-center">
            <span className="text-4xl block mb-3">🚫</span>
            <h3 className="text-white font-bold text-lg mb-1">¿Marcar como agotado?</h3>
            <p className="text-[#7aaa70] text-sm mb-5">El platillo no podrá ser ordenado por clientes hasta que lo vuelvas a habilitar.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmSoldOut(null)} className="flex-1 py-2.5 rounded-xl border border-[#2a4830] text-[#7aaa70] text-sm font-semibold hover:text-white transition-colors">
                Cancelar
              </button>
              <button
                onClick={() => toggleDisponible(confirmSoldOut)}
                className="flex-1 py-2.5 rounded-xl bg-red-900/60 border border-red-800 text-red-400 text-sm font-bold hover:bg-red-900/80 transition-colors"
              >
                Marcar agotado
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function PlatilloCard({ p, onEdit, onToggle }: { p: Platillo; onEdit: () => void; onToggle: () => void }) {
  return (
    <div className={`bg-[#142a17] border rounded-2xl overflow-hidden transition-all ${p.disponible ? 'border-[#2a4830]' : 'border-red-900/50 opacity-70'}`}>
      <div className="relative h-36 bg-[#1a3320] overflow-hidden">
        {p.imagen ? (
          <img src={p.imagen} alt={p.nombre} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl opacity-30">🍽️</div>
        )}
        {!p.disponible && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-red-900/80 text-red-400 text-xs font-bold px-3 py-1 rounded-full border border-red-800">AGOTADO</span>
          </div>
        )}
        <span className="absolute top-2 left-2 bg-[#0d1a0f]/80 text-[#5bc827] text-[10px] px-2 py-0.5 rounded-full border border-[#2a4830]">
          {p.categoria}
        </span>
      </div>
      <div className="p-3">
        <div className="flex items-start justify-between gap-1 mb-1">
          <h3 className="font-bold text-sm text-white leading-tight">{p.nombre}</h3>
          <span className="text-[#5bc827] font-bold text-sm shrink-0">${p.precio}</span>
        </div>
        <p className="text-[#7aaa70] text-xs mb-3 line-clamp-2">{p.descripcion}</p>
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="flex-1 py-1.5 rounded-lg border border-[#2a4830] hover:border-[#5bc827]/60 text-[#a8d89a] text-xs font-semibold transition-colors hover:text-white"
          >
            ✏️ Editar
          </button>
          <button
            onClick={onToggle}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              p.disponible
                ? 'bg-red-900/30 border border-red-800/50 text-red-400 hover:bg-red-900/50'
                : 'bg-[#5bc827]/20 border border-[#5bc827]/40 text-[#5bc827] hover:bg-[#5bc827]/30'
            }`}
          >
            {p.disponible ? 'Agotar' : '✅ Habilitar'}
          </button>
        </div>
      </div>
    </div>
  )
}

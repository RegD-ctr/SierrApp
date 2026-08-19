import { useState } from 'react'

export interface AddressItem {
  id: number
  name: string
  street: string
  col: string
  default: boolean
}

interface Props {
  onBack: () => void
  addresses: AddressItem[]
  onAddAddress: (a: { name: string; street: string; col: string }) => void
  onDeleteAddress: (id: number) => void
  onSetDefault: (id: number) => void
  onEditAddress?: (a: { id: number; name: string; street: string; col: string }) => void
  selectable?: boolean
  selectedId?: number
  onSelect?: (id: number) => void
}

export default function Addresses({
  onBack,
  addresses,
  onAddAddress,
  onDeleteAddress,
  onSetDefault,
  onEditAddress,
  selectable = false,
  selectedId,
  onSelect,
}: Props) {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    name: 'Casa',
    street: '',
    col: '',
    zip: '',
    city: 'Sierra Norte',
    references: '',
  })

  const openAddForm = () => {
    setEditingId(null)
    setFormData({
      name: 'Casa',
      street: '',
      col: '',
      zip: '',
      city: 'Sierra Norte',
      references: '',
    })
    setShowForm(true)
  }

  const openEditForm = (a: AddressItem) => {
    setEditingId(a.id)
    setFormData({
      name: a.name,
      street: a.street,
      col: a.col,
      zip: '',
      city: 'Sierra Norte',
      references: '',
    })
    setShowForm(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.street.trim() || !formData.col.trim()) return

    if (editingId !== null) {
      if (onEditAddress) {
        onEditAddress({
          id: editingId,
          name: formData.name,
          street: formData.street.trim(),
          col: formData.col.trim(),
        })
      }
    } else {
      onAddAddress({
        name: formData.name,
        street: formData.street.trim(),
        col: formData.col.trim(),
      })
    }
    setShowForm(false)
    setEditingId(null)
  }

  const handleDelete = (id: number) => {
    if (window.confirm('¿Estás seguro de eliminar esta dirección?')) {
      onDeleteAddress(id)
    }
  }

  return (
    <div className="min-h-screen bg-[#1a1b1e] text-white flex flex-col">
      <header className="sticky top-0 z-40 bg-[#1a1b1e]/95 backdrop-blur-sm border-b border-[#35373b] px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="text-[#9a9da3] hover:text-white transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold uppercase tracking-wide" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
          {selectable ? 'Seleccionar Dirección' : 'Mis direcciones'}
        </h1>
      </header>

      <div className="p-4 space-y-4 max-w-lg mx-auto w-full flex-1 pb-24">
        {showForm ? (
          <form onSubmit={handleSubmit} className="bg-[#232427] border border-[#35373b] rounded-2xl p-5 space-y-4">
            <h2 className="text-lg font-bold text-white uppercase tracking-wide" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
              {editingId !== null ? 'Editar Dirección' : 'Nueva Dirección'}
            </h2>

            <div>
              <label className="block text-xs font-semibold text-[#9a9da3] mb-1 uppercase">Etiqueta</label>
              <select
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-[#1a1b1e] border border-[#35373b] rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#5bc827]"
              >
                <option value="Casa">Casa</option>
                <option value="Oficina">Oficina</option>
                <option value="Trabajo">Trabajo</option>
                <option value="Otro">Otro</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#9a9da3] mb-1 uppercase">Calle y número *</label>
              <input
                type="text"
                required
                placeholder="Ej. Calle Pino #24"
                value={formData.street}
                onChange={e => setFormData({ ...formData, street: e.target.value })}
                className="w-full bg-[#1a1b1e] border border-[#35373b] rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#5bc827]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#9a9da3] mb-1 uppercase">Colonia *</label>
              <input
                type="text"
                required
                placeholder="Ej. Sierra Norte"
                value={formData.col}
                onChange={e => setFormData({ ...formData, col: e.target.value })}
                className="w-full bg-[#1a1b1e] border border-[#35373b] rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#5bc827]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#9a9da3] mb-1 uppercase">Código postal</label>
                <input
                  type="text"
                  placeholder="Ej. 68000"
                  value={formData.zip}
                  onChange={e => setFormData({ ...formData, zip: e.target.value })}
                  className="w-full bg-[#1a1b1e] border border-[#35373b] rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#5bc827]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#9a9da3] mb-1 uppercase">Ciudad</label>
                <input
                  type="text"
                  placeholder="Ej. Oaxaca"
                  value={formData.city}
                  onChange={e => setFormData({ ...formData, city: e.target.value })}
                  className="w-full bg-[#1a1b1e] border border-[#35373b] rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#5bc827]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#9a9da3] mb-1 uppercase">Referencias (Opcional)</label>
              <input
                type="text"
                placeholder="Ej. Fachada azul, portón negro..."
                value={formData.references}
                onChange={e => setFormData({ ...formData, references: e.target.value })}
                className="w-full bg-[#1a1b1e] border border-[#35373b] rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#5bc827]"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditingId(null) }}
                className="flex-1 py-3 rounded-xl border border-[#35373b] hover:bg-[#1a1b1e] text-[#c4c6ca] text-sm font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 py-3 rounded-xl bg-[#5bc827] hover:bg-[#7ed944] text-[#1a1b1e] text-sm font-bold transition-colors"
              >
                Guardar Dirección
              </button>
            </div>
          </form>
        ) : (
          <>
            {addresses.length === 0 ? (
              <div className="text-center py-8 text-[#9a9da3]">
                <p>No tienes direcciones guardadas.</p>
              </div>
            ) : (
              addresses.map(a => {
                const isSelected = selectable && a.id === selectedId
                return (
                  <div
                    key={a.id}
                    onClick={() => {
                      if (selectable && onSelect) {
                        onSelect(a.id)
                      }
                    }}
                    className={`bg-[#232427] border ${
                      isSelected ? 'border-[#5bc827] ring-1 ring-[#5bc827]' : 'border-[#35373b]'
                    } rounded-2xl p-4 flex items-center justify-between transition-all ${
                      selectable ? 'cursor-pointer hover:border-[#5bc827]/60' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="text-2xl shrink-0">📍</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm text-white">{a.name}</p>
                          {a.default && (
                            <span className="bg-[#5bc827]/20 text-[#5bc827] text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wide">
                              Predeterminada
                            </span>
                          )}
                        </div>
                        <p className="text-[#9a9da3] text-xs truncate mt-0.5">
                          {a.street}, {a.col}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 ml-2">
                      {isSelected && (
                        <span className="bg-[#5bc827] text-[#1a1b1e] rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs">
                          ✓
                        </span>
                      )}
                      <div className="flex flex-col items-end gap-1 text-xs">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            openEditForm(a)
                          }}
                          className="text-[#5bc827] hover:text-[#7ed944] font-semibold"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(a.id)
                          }}
                          className="text-red-400 hover:text-red-300"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}

            <button
              onClick={openAddForm}
              className="w-full py-4 border-2 border-dashed border-[#35373b] rounded-2xl text-[#c4c6ca] font-semibold flex items-center justify-center gap-2 hover:border-[#5bc827] hover:text-[#5bc827] transition-colors"
            >
              <span className="text-xl">+</span> Agregar nueva dirección
            </button>
          </>
        )}
      </div>
    </div>
  )
}


import { useState, useEffect } from 'react'
import { api } from '@/lib/api'

export interface AddressItem {
  id: string
  name: string
  street: string
  col: string
  default: boolean
  etiqueta?: string
  calle?: string
  numero?: string
  colonia?: string
  cp?: string
  ciudad?: string
  estado?: string
  referencias?: string
}

interface Props {
  onBack: () => void
  addresses?: AddressItem[]
  onAddressesChange?: (addresses: AddressItem[]) => void
  onAddAddress?: (a: { name: string; street: string; col: string }) => void
  onDeleteAddress?: (id: string) => void
  onSetDefault?: (id: string) => void
  onEditAddress?: (a: { id: string; name: string; street: string; col: string }) => void
  selectable?: boolean
  selectedId?: string
  onSelect?: (id: string) => void
}

const defaultFormData = {
  etiqueta: 'Casa',
  calle: '',
  numero: '',
  colonia: '',
  cp: '',
  ciudad: 'Oaxaca de Juárez',
  estado: 'Oaxaca',
  referencias: '',
}

export default function Addresses({
  onBack,
  addresses: initialAddresses,
  onAddressesChange,
  selectable = false,
  selectedId,
  onSelect,
}: Props) {
  const [addressesList, setAddressesList] = useState<AddressItem[]>(initialAddresses || [])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formData, setFormData] = useState(defaultFormData)

  const fetchAddresses = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await api.get<any[]>('/api/users/me/addresses')
      const mapped: AddressItem[] = data.map(a => ({
        id: a.id,
        name: a.etiqueta,
        street: `${a.calle} #${a.numero}`,
        col: a.colonia,
        default: a.predeterminada,
        etiqueta: a.etiqueta,
        calle: a.calle,
        numero: a.numero,
        colonia: a.colonia,
        cp: a.cp,
        ciudad: a.ciudad,
        estado: a.estado,
        referencias: a.referencias || '',
      }))
      setAddressesList(mapped)
      onAddressesChange?.(mapped)
    } catch (err: any) {
      setError(err.message || 'Error al cargar las direcciones.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAddresses()
  }, [])

  const openAddForm = () => {
    setEditingId(null)
    setFormData(defaultFormData)
    setFormError(null)
    setShowForm(true)
  }

  const openEditForm = (a: AddressItem) => {
    setEditingId(a.id)
    setFormData({
      etiqueta: a.etiqueta || a.name || 'Casa',
      calle: a.calle || a.street.split('#')[0].trim(),
      numero: a.numero || (a.street.includes('#') ? a.street.split('#')[1].trim() : 'S/N'),
      colonia: a.colonia || a.col || '',
      cp: a.cp || '68000',
      ciudad: a.ciudad || 'Oaxaca de Juárez',
      estado: a.estado || 'Oaxaca',
      referencias: a.referencias || '',
    })
    setFormError(null)
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!formData.calle.trim()) { setFormError('La calle es obligatoria.'); return }
    if (!formData.numero.trim()) { setFormError('El número es obligatorio.'); return }
    if (!formData.colonia.trim()) { setFormError('La colonia es obligatoria.'); return }
    if (!formData.cp.trim() || formData.cp.trim().length < 4) { setFormError('El código postal debe tener al menos 4 caracteres.'); return }
    if (!formData.ciudad.trim()) { setFormError('La ciudad es obligatoria.'); return }
    if (!formData.estado.trim()) { setFormError('El estado es obligatorio.'); return }

    const payload = {
      etiqueta: formData.etiqueta.trim(),
      calle: formData.calle.trim(),
      numero: formData.numero.trim(),
      colonia: formData.colonia.trim(),
      cp: formData.cp.trim(),
      ciudad: formData.ciudad.trim(),
      estado: formData.estado.trim(),
      referencias: formData.referencias.trim() || undefined,
    }

    try {
      setSubmitting(true)
      if (editingId) {
        await api.patch(`/api/users/me/addresses/${editingId}`, payload)
      } else {
        await api.post('/api/users/me/addresses', payload)
      }
      setShowForm(false)
      setEditingId(null)
      await fetchAddresses()
    } catch (err: any) {
      setFormError(err.message || 'Error al guardar la dirección.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar esta dirección?')) {
      try {
        await api.delete(`/api/users/me/addresses/${id}`)
        await fetchAddresses()
      } catch (err: any) {
        alert(err.message || 'Error al eliminar la dirección.')
      }
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      await api.patch(`/api/users/me/addresses/${id}/default`)
      await fetchAddresses()
    } catch (err: any) {
      alert(err.message || 'Error al marcar como predeterminada.')
    }
  }

  return (
    <div className="min-h-screen bg-[#1a1b1e] text-white flex flex-col">
      <header className="sticky top-0 z-40 bg-[#1a1b1e]/95 backdrop-blur-sm border-b border-[#35373b] px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="text-[#9a9da3] hover:text-white transition-colors cursor-pointer">
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
          <form noValidate onSubmit={handleSubmit} className="bg-[#232427] border border-[#35373b] rounded-2xl p-5 space-y-4">
            <h2 className="text-lg font-bold text-white uppercase tracking-wide" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
              {editingId !== null ? 'Editar Dirección' : 'Nueva Dirección'}
            </h2>

            {formError && (
              <div className="p-3 bg-red-900/30 border border-red-800 text-red-300 text-xs rounded-xl">
                {formError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#9a9da3] mb-1 uppercase">Etiqueta</label>
              <select
                value={formData.etiqueta}
                onChange={e => setFormData({ ...formData, etiqueta: e.target.value })}
                className="w-full bg-[#1a1b1e] border border-[#35373b] rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#5bc827]"
              >
                <option value="Casa">Casa</option>
                <option value="Oficina">Oficina</option>
                <option value="Trabajo">Trabajo</option>
                <option value="Otro">Otro</option>
              </select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-[#9a9da3] mb-1 uppercase">Calle *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Calle Pino"
                  value={formData.calle}
                  onChange={e => setFormData({ ...formData, calle: e.target.value })}
                  className="w-full bg-[#1a1b1e] border border-[#35373b] rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#5bc827]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#9a9da3] mb-1 uppercase">Número *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. 24"
                  value={formData.numero}
                  onChange={e => setFormData({ ...formData, numero: e.target.value })}
                  className="w-full bg-[#1a1b1e] border border-[#35373b] rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#5bc827]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#9a9da3] mb-1 uppercase">Colonia *</label>
              <input
                type="text"
                required
                placeholder="Ej. Sierra Norte"
                value={formData.colonia}
                onChange={e => setFormData({ ...formData, colonia: e.target.value })}
                className="w-full bg-[#1a1b1e] border border-[#35373b] rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#5bc827]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#9a9da3] mb-1 uppercase">Código postal *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. 68000"
                  value={formData.cp}
                  onChange={e => setFormData({ ...formData, cp: e.target.value })}
                  className="w-full bg-[#1a1b1e] border border-[#35373b] rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#5bc827]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#9a9da3] mb-1 uppercase">Ciudad *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Oaxaca"
                  value={formData.ciudad}
                  onChange={e => setFormData({ ...formData, ciudad: e.target.value })}
                  className="w-full bg-[#1a1b1e] border border-[#35373b] rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#5bc827]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#9a9da3] mb-1 uppercase">Estado *</label>
              <input
                type="text"
                required
                placeholder="Ej. Oaxaca"
                value={formData.estado}
                onChange={e => setFormData({ ...formData, estado: e.target.value })}
                className="w-full bg-[#1a1b1e] border border-[#35373b] rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#5bc827]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#9a9da3] mb-1 uppercase">Referencias (Opcional)</label>
              <input
                type="text"
                placeholder="Ej. Fachada azul, portón negro..."
                value={formData.referencias}
                onChange={e => setFormData({ ...formData, referencias: e.target.value })}
                className="w-full bg-[#1a1b1e] border border-[#35373b] rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#5bc827]"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditingId(null) }}
                className="flex-1 py-3 rounded-xl border border-[#35373b] hover:bg-[#1a1b1e] text-[#c4c6ca] text-sm font-semibold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-3 rounded-xl bg-[#5bc827] hover:bg-[#7ed944] text-[#1a1b1e] text-sm font-bold transition-colors disabled:opacity-60 cursor-pointer"
              >
                {submitting ? 'Guardando...' : 'Guardar Dirección'}
              </button>
            </div>
          </form>
        ) : (
          <>
            {loading ? (
              <div className="space-y-3 py-4">
                {[1, 2].map(n => (
                  <div key={n} className="animate-pulse bg-[#232427] border border-[#35373b] rounded-2xl p-4 h-24" />
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-8 text-white space-y-2">
                <p className="text-red-400 text-sm">{error}</p>
                <button
                  onClick={fetchAddresses}
                  className="px-4 py-1.5 bg-[#5bc827] text-[#1a1b1e] font-bold text-xs rounded-full hover:bg-[#7ed944] transition-all cursor-pointer"
                >
                  Reintentar
                </button>
              </div>
            ) : addressesList.length === 0 ? (
              <div className="text-center py-8 text-[#9a9da3]">
                <p>No tienes direcciones guardadas.</p>
              </div>
            ) : (
              addressesList.map(a => {
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
                        {!a.default && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleSetDefault(a.id)
                            }}
                            className="text-[#9a9da3] hover:text-[#5bc827] text-[11px] transition-colors cursor-pointer"
                          >
                            Hacer predeterminada
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            openEditForm(a)
                          }}
                          className="text-[#5bc827] hover:text-[#7ed944] font-semibold cursor-pointer"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(a.id)
                          }}
                          className="text-red-400 hover:text-red-300 cursor-pointer"
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
              className="w-full py-4 border-2 border-dashed border-[#35373b] rounded-2xl text-[#c4c6ca] font-semibold flex items-center justify-center gap-2 hover:border-[#5bc827] hover:text-[#5bc827] transition-colors cursor-pointer"
            >
              <span className="text-xl">+</span> Agregar nueva dirección
            </button>
          </>
        )}
      </div>
    </div>
  )
}



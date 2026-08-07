import { useState, useEffect } from 'react'
import type { Platillo, Restaurant, CartItem } from '@/data'

interface Props {
  platillo: Platillo
  restaurant: Restaurant
  onClose: () => void
  onAdd: (item: CartItem) => void
}

export default function CustomizeModal({ platillo, restaurant, onClose, onAdd }: Props) {
  const [selecciones, setSelecciones] = useState<Record<string, string | string[]>>({})
  const [cantidad, setCantidad] = useState(1)
  const [notas, setNotas] = useState('')
  const [missingRequired, setMissingRequired] = useState<string[]>([])

  useEffect(() => {
    const initial: Record<string, string | string[]> = {}
    platillo.opciones?.forEach(g => {
      if (g.tipo === 'radio' && g.obligatoria && g.opciones.length > 0) {
        initial[g.id] = g.opciones[0].id
      } else if (g.tipo === 'checkbox') {
        initial[g.id] = []
      }
    })
    setSelecciones(initial)
  }, [platillo])

  const extrasTotal = (() => {
    let ex = 0
    platillo.opciones?.forEach(g => {
      const sel = selecciones[g.id]
      if (g.tipo === 'radio' && typeof sel === 'string') {
        const opt = g.opciones.find(o => o.id === sel)
        if (opt) ex += opt.extra
      } else if (g.tipo === 'checkbox' && Array.isArray(sel)) {
        sel.forEach(id => {
          const opt = g.opciones.find(o => o.id === id)
          if (opt) ex += opt.extra
        })
      }
    })
    return ex
  })()

  const unitPrice = platillo.precio + extrasTotal
  const totalPrice = unitPrice * cantidad

  const handleRadio = (groupId: string, optId: string) => {
    setSelecciones(s => ({ ...s, [groupId]: optId }))
    setMissingRequired(m => m.filter(id => id !== groupId))
  }

  const handleCheckbox = (groupId: string, optId: string) => {
    setSelecciones(s => {
      const current = (s[groupId] as string[]) ?? []
      return {
        ...s,
        [groupId]: current.includes(optId) ? current.filter(x => x !== optId) : [...current, optId],
      }
    })
  }

  const getSelLabel = (groupId: string, optId: string) => {
    const g = platillo.opciones?.find(g => g.id === groupId)
    return g?.opciones.find(o => o.id === optId)?.label ?? optId
  }

  const buildSelsForCart = () => {
    const out: Record<string, string | string[]> = {}
    platillo.opciones?.forEach(g => {
      const sel = selecciones[g.id]
      if (g.tipo === 'radio' && typeof sel === 'string') {
        out[g.titulo] = getSelLabel(g.id, sel)
      } else if (g.tipo === 'checkbox' && Array.isArray(sel) && sel.length > 0) {
        out[g.titulo] = sel.map(id => getSelLabel(g.id, id))
      }
    })
    return out
  }

  const handleAdd = () => {
    const missing: string[] = []
    platillo.opciones?.forEach(g => {
      if (g.obligatoria && g.tipo === 'radio' && !selecciones[g.id]) missing.push(g.id)
    })
    if (missing.length > 0) { setMissingRequired(missing); return }

    onAdd({
      cartId: `${platillo.id}-${Date.now()}`,
      platillo,
      restaurant,
      cantidad,
      selecciones: buildSelsForCart(),
      extrasTotal,
      notas,
    })
    onClose()
  }

  const hasOptions = platillo.opciones && platillo.opciones.length > 0

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-[#0d1a0f] border border-[#2a4830] rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md max-h-[90vh] flex flex-col overflow-hidden">
        {/* Image header */}
        <div className="relative h-40 shrink-0">
          {platillo.imagen ? (
            <img src={platillo.imagen} alt={platillo.nombre} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-[#142a17] flex items-center justify-center text-5xl opacity-40">🍽️</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d1a0f] to-transparent" />
          <button onClick={onClose} className="absolute top-3 right-3 bg-[#0d1a0f]/70 rounded-full w-8 h-8 flex items-center justify-center text-white hover:bg-[#0d1a0f] transition-colors">
            ✕
          </button>
          <div className="absolute bottom-3 left-4 right-4">
            <h2 className="text-white font-bold text-lg leading-tight">{platillo.nombre}</h2>
            <p className="text-[#7aaa70] text-xs">{platillo.descripcion}</p>
          </div>
        </div>

        {/* Scrollable options */}
        <div className="overflow-y-auto flex-1 px-4 py-3">
          {hasOptions && platillo.opciones!.map(group => (
            <div key={group.id} className="mb-5">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-white font-bold text-sm">{group.titulo}</h3>
                {group.obligatoria && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${missingRequired.includes(group.id) ? 'bg-red-900/50 text-red-400 border border-red-800' : 'bg-[#5bc827]/20 text-[#5bc827]'}`}>
                    {missingRequired.includes(group.id) ? '¡Requerido!' : 'Obligatorio'}
                  </span>
                )}
                {!group.obligatoria && <span className="text-[#7aaa70] text-[10px]">Opcional</span>}
              </div>
              <div className="space-y-1.5">
                {group.opciones.map(opt => {
                  const sel = selecciones[group.id]
                  const isSelected = group.tipo === 'radio'
                    ? sel === opt.id
                    : Array.isArray(sel) && sel.includes(opt.id)
                  return (
                    <button
                      key={opt.id}
                      onClick={() => group.tipo === 'radio' ? handleRadio(group.id, opt.id) : handleCheckbox(group.id, opt.id)}
                      className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border transition-all text-left ${
                        isSelected ? 'bg-[#5bc827]/15 border-[#5bc827] text-white' : 'bg-[#142a17] border-[#2a4830] text-[#a8d89a] hover:border-[#5bc827]/50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-4 h-4 shrink-0 flex items-center justify-center border transition-all ${
                          group.tipo === 'radio' ? 'rounded-full' : 'rounded'
                        } ${isSelected ? 'border-[#5bc827] bg-[#5bc827]' : 'border-[#2a4830]'}`}>
                          {isSelected && <span className="text-[#0d1a0f] text-[8px] font-black">✓</span>}
                        </div>
                        <span className="text-sm">{opt.label}</span>
                      </div>
                      {opt.extra !== 0 && (
                        <span className={`text-xs font-semibold ${opt.extra > 0 ? 'text-[#5bc827]' : 'text-[#7aaa70]'}`}>
                          {opt.extra > 0 ? `+$${opt.extra}` : `-$${Math.abs(opt.extra)}`}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Notas */}
          <div className="mb-3">
            <label className="text-[#a8d89a] text-xs font-semibold block mb-1">
              Instrucciones especiales <span className="text-[#7aaa70] font-normal">(opcional)</span>
            </label>
            <textarea
              value={notas}
              onChange={e => setNotas(e.target.value)}
              placeholder="Ej: sin cebolla, extra picante, alergias..."
              rows={2}
              className="w-full bg-[#142a17] border border-[#2a4830] focus:border-[#5bc827] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#7aaa70] outline-none transition-colors resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 pb-5 pt-3 border-t border-[#2a4830] bg-[#0d1a0f] shrink-0">
          {/* Quantity */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-[#a8d89a] text-sm font-semibold">Cantidad</span>
            <div className="flex items-center gap-3 bg-[#142a17] border border-[#2a4830] rounded-full px-2 py-1">
              <button onClick={() => setCantidad(c => Math.max(1, c - 1))} className="w-7 h-7 rounded-full flex items-center justify-center text-[#5bc827] hover:bg-[#0d1a0f] transition-colors font-bold text-lg leading-none">−</button>
              <span className="text-white font-bold text-base w-6 text-center">{cantidad}</span>
              <button onClick={() => setCantidad(c => c + 1)} className="w-7 h-7 rounded-full flex items-center justify-center text-[#5bc827] hover:bg-[#0d1a0f] transition-colors font-bold text-lg leading-none">+</button>
            </div>
          </div>
          <button
            onClick={handleAdd}
            className="w-full py-3.5 rounded-xl bg-[#5bc827] hover:bg-[#7ed944] text-[#0d1a0f] font-bold text-base transition-all hover:scale-[1.01] active:scale-[0.98] shadow-lg shadow-[#5bc827]/20 flex items-center justify-center gap-2"
          >
            <span>Agregar al carrito</span>
            <span className="bg-[#0d1a0f]/20 px-2 py-0.5 rounded-full text-sm">${totalPrice.toFixed(0)}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

import type { CartItem } from '@/data'

interface Props {
  open: boolean
  onClose: () => void
  items: CartItem[]
  onUpdateQty: (cartId: string, delta: number) => void
  onRemove: (cartId: string) => void
  onCheckout: () => void
  onExplore: () => void
}

/**
 * Componente que muestra el carrito de compras como un cajón (drawer) lateral.
 * Permite actualizar cantidades, eliminar productos y proceder al checkout.
 * 
 * @param {Props} props - Propiedades que incluyen el estado de apertura, items y callbacks.
 */
export default function CartDrawer({ open, onClose, items, onUpdateQty, onRemove, onCheckout, onExplore }: Props) {
  const subtotal = items.reduce((s, i) => s + (i.platillo.precio + i.extrasTotal) * i.cantidad, 0)
  const envio = items.length > 0 ? (items[0].restaurant.deliveryFee ?? 0) : 0
  const total = subtotal + envio

  const formatSelecciones = (item: CartItem) => {
    const parts: string[] = []
    for (const [, val] of Object.entries(item.selecciones)) {
      if (Array.isArray(val)) val.forEach(v => parts.push(v))
      else if (val) parts.push(val)
    }
    if (item.notas) parts.push(`Nota: ${item.notas}`)
    return parts.join(' · ')
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 z-50 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      {/* Drawer */}
      <div className={`fixed top-0 right-0 bottom-0 w-full sm:w-96 bg-[#1a1b1e] border-l border-[#35373b] z-50 flex flex-col transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#35373b] flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white uppercase" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
              Tu carrito
            </h2>
            {items.length > 0 && (
              <p className="text-[#9a9da3] text-xs">{items.reduce((s, i) => s + i.cantidad, 0)} producto{items.reduce((s, i) => s + i.cantidad, 0) !== 1 ? 's' : ''}</p>
            )}
          </div>
          <button onClick={onClose} className="text-[#9a9da3] hover:text-white transition-colors text-2xl leading-none">✕</button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <span className="text-5xl mb-4">🛒</span>
              <p className="text-white font-semibold text-lg">Tu carrito está vacío</p>
              <p className="text-[#9a9da3] text-sm mt-1 mb-6">Agrega productos desde un restaurante</p>
              <button
                onClick={() => { onClose(); onExplore() }}
                className="bg-[#5bc827] hover:bg-[#7ed944] text-[#1a1b1e] font-bold px-6 py-2.5 rounded-full text-sm transition-all hover:scale-105"
              >
                Explorar restaurantes
              </button>
            </div>
          ) : (
            items.map(item => {
              const unitPrice = item.platillo.precio + item.extrasTotal
              const sels = formatSelecciones(item)
              return (
                <div key={item.cartId} className="bg-[#232427] border border-[#35373b] rounded-2xl p-3">
                  <div className="flex gap-3">
                    {item.platillo.imagen ? (
                      <img src={item.platillo.imagen} alt={item.platillo.nombre} className="w-14 h-14 rounded-xl object-cover shrink-0" />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-[#1a3320] flex items-center justify-center text-xl shrink-0">🍽️</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-white font-semibold text-sm leading-tight">{item.platillo.nombre}</p>
                        <button onClick={() => onRemove(item.cartId)} className="text-[#9a9da3] hover:text-red-400 transition-colors shrink-0 text-xs mt-0.5">✕</button>
                      </div>
                      <p className="text-[#9a9da3] text-[10px] mt-0.5">{item.restaurant.name}</p>
                      {sels && <p className="text-[#5bc827] text-[10px] mt-0.5 truncate">{sels}</p>}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2 bg-[#1a1b1e] border border-[#35373b] rounded-full px-1 py-0.5">
                      <button
                        onClick={() => onUpdateQty(item.cartId, -1)}
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[#5bc827] hover:bg-[#232427] transition-colors font-bold text-base leading-none"
                      >
                        −
                      </button>
                      <span className="text-white text-sm font-bold w-5 text-center">{item.cantidad}</span>
                      <button
                        onClick={() => onUpdateQty(item.cartId, 1)}
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[#5bc827] hover:bg-[#232427] transition-colors font-bold text-base leading-none"
                      >
                        +
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="text-[#5bc827] font-bold text-sm">${(unitPrice * item.cantidad).toFixed(0)}</p>
                      {item.cantidad > 1 && <p className="text-[#9a9da3] text-[10px]">${unitPrice}/u</p>}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="px-5 py-4 border-t border-[#35373b] bg-[#1a1b1e] shrink-0">
            <div className="space-y-1.5 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-[#9a9da3]">Subtotal</span>
                <span className="text-white">${subtotal.toFixed(0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#9a9da3]">Envío</span>
                <span className={envio === 0 ? 'text-[#5bc827] font-semibold' : 'text-white'}>
                  {envio === 0 ? 'Gratis' : `$${envio}`}
                </span>
              </div>
              <div className="flex justify-between font-bold text-base border-t border-[#35373b] pt-2 mt-2">
                <span className="text-white">Total</span>
                <span className="text-[#5bc827]">${total.toFixed(0)}</span>
              </div>
            </div>
            <button
              onClick={onCheckout}
              className="w-full py-3.5 rounded-xl bg-[#5bc827] hover:bg-[#7ed944] text-[#1a1b1e] font-bold text-base transition-all hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-[#5bc827]/20"
            >
              Continuar con el pedido →
            </button>
          </div>
        )}
      </div>
    </>
  )
}

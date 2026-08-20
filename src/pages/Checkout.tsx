import { useState } from 'react'
import type { CartItem } from '@/data'
import type { AddressItem } from './Addresses'

interface Props {
  items: CartItem[]
  savedAddresses: AddressItem[]
  deliveryAddressId: number
  onChangeAddress: () => void
  onConfirm: () => void
  onBack: () => void
}

/**
 * Componente para el proceso de pago y finalización del pedido (Checkout).
 * Muestra el resumen del pedido, dirección de entrega, método de pago e instrucciones especiales.
 * 
 * @param {Props} props - Propiedades que incluyen los items, direcciones guardadas, ID de dirección elegida, callbacks.
 */
export default function Checkout({ items, savedAddresses, deliveryAddressId, onChangeAddress, onConfirm, onBack }: Props) {
  const [payment, setPayment] = useState('Tarjeta terminada en 4242')
  const [instructions, setInstructions] = useState('')
  const [showPaymentOptions, setShowPaymentOptions] = useState(false)

  const selectedAddr = savedAddresses.find(a => a.id === deliveryAddressId) || savedAddresses[0]
  const addressDisplay = selectedAddr ? `${selectedAddr.street}, ${selectedAddr.col}` : 'Seleccionar dirección'
  const addressNameDisplay = selectedAddr ? selectedAddr.name : ''

  const subtotal = items.reduce((s, i) => s + (i.platillo.precio + i.extrasTotal) * i.cantidad, 0)
  const envio = items.length > 0 ? (items[0].restaurant.deliveryFee ?? 0) : 0
  const total = subtotal + envio

  return (
    <div className="min-h-screen bg-[#1a1b1e] text-white flex flex-col">
      <header className="sticky top-0 z-40 bg-[#1a1b1e]/95 backdrop-blur-sm border-b border-[#35373b] px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="text-[#9a9da3] hover:text-white transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-xl font-bold uppercase tracking-wide" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Checkout</h1>
      </header>

      <div className="flex-1 p-4 max-w-lg mx-auto w-full space-y-6 pb-24">
        {/* Resumen */}
        <section>
          <h2 className="text-[#9a9da3] text-sm font-semibold mb-3 uppercase tracking-wider">Tu Pedido</h2>
          <div className="bg-[#232427] border border-[#35373b] rounded-2xl p-4 space-y-3">
            {items.map(i => (
              <div key={i.cartId} className="flex justify-between items-start text-sm">
                <div className="flex gap-2">
                  <span className="text-[#5bc827] font-bold">{i.cantidad}x</span>
                  <span>{i.platillo.nombre}</span>
                </div>
                <span className="text-[#c4c6ca]">${((i.platillo.precio + i.extrasTotal) * i.cantidad).toFixed(0)}</span>
              </div>
            ))}
            <div className="border-t border-[#35373b] pt-3 space-y-1 mt-2">
              <div className="flex justify-between text-sm text-[#9a9da3]">
                <span>Subtotal</span><span>${subtotal.toFixed(0)}</span>
              </div>
              <div className="flex justify-between text-sm text-[#9a9da3]">
                <span>Envío</span><span>{envio === 0 ? 'Gratis' : `$${envio}`}</span>
              </div>
              <div className="flex justify-between font-[#5bc827] font-bold text-lg mt-2 pt-2 border-t border-[#35373b]">
                <span className="text-white font-bold">Total</span><span className="text-[#5bc827]">${total.toFixed(0)}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Dirección */}
        <section>
          <h2 className="text-[#9a9da3] text-sm font-semibold mb-3 uppercase tracking-wider">Entregar en</h2>
          <div 
            onClick={onChangeAddress}
            className="bg-[#232427] border border-[#35373b] rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:border-[#5bc827]/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">📍</span>
              <div>
                <div className="flex items-center gap-2">
                  {addressNameDisplay && (
                    <span className="bg-[#5bc827]/20 text-[#5bc827] text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wide">
                      {addressNameDisplay}
                    </span>
                  )}
                  <p className="font-semibold text-sm">{addressDisplay}</p>
                </div>
                <p className="text-[#9a9da3] text-xs mt-0.5">Añadir instrucciones de entrega</p>
              </div>
            </div>
            <button type="button" onClick={(e) => { e.stopPropagation(); onChangeAddress() }} className="text-[#5bc827] text-sm font-semibold hover:text-[#7ed944]">
              Cambiar
            </button>
          </div>
        </section>

        {/* Pago */}
        <section>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-[#9a9da3] text-sm font-semibold uppercase tracking-wider">Método de pago</h2>
            {!showPaymentOptions && (
              <button onClick={() => setShowPaymentOptions(true)} className="text-[#5bc827] text-sm font-semibold">
                Cambiar
              </button>
            )}
          </div>
          
          {!showPaymentOptions ? (
            <div className="bg-[#232427] border border-[#35373b] rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">
                  {payment === 'Efectivo' ? '💵' : '💳'}
                </span>
                <p className="font-semibold text-sm">{payment}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {[
                { id: 'Tarjeta terminada en 4242', icon: '💳', desc: '' },
                { id: 'Efectivo', icon: '💵', desc: '' }
              ].map(opt => (
                <div 
                  key={opt.id}
                  onClick={() => {
                    setPayment(opt.id)
                    setShowPaymentOptions(false)
                  }}
                  className={`bg-[#232427] border ${payment === opt.id ? 'border-[#5bc827]' : 'border-[#35373b]'} rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-colors`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{opt.icon}</span>
                    <div>
                      <p className="font-semibold text-sm">{opt.id}</p>
                      {opt.desc && <p className="text-[#9a9da3] text-xs mt-0.5">{opt.desc}</p>}
                    </div>
                  </div>
                  {payment === opt.id && <span className="text-[#5bc827] font-bold">✓</span>}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Instrucciones */}
        <section>
          <h2 className="text-[#9a9da3] text-sm font-semibold mb-3 uppercase tracking-wider">Instrucciones especiales</h2>
          <textarea
            value={instructions}
            onChange={e => setInstructions(e.target.value)}
            placeholder="Ej. Tocar el timbre, dejar en recepción..."
            className="w-full bg-[#232427] border border-[#35373b] rounded-xl p-3 text-sm focus:outline-none focus:border-[#5bc827] transition-colors resize-none h-20"
          />
        </section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#1a1b1e]/95 backdrop-blur-sm border-t border-[#35373b] z-40">
        <div className="max-w-lg mx-auto">
          <button
            onClick={onConfirm}
            className="w-full py-3.5 rounded-xl bg-[#5bc827] hover:bg-[#7ed944] text-[#1a1b1e] font-bold text-base transition-all hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-[#5bc827]/20"
          >
            Confirmar Pedido • ${total.toFixed(0)}
          </button>
        </div>
      </div>
    </div>
  )
}

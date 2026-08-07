import { useState } from 'react'
import type { CartItem } from '@/data'

interface Props {
  items: CartItem[]
  onConfirm: () => void
  onBack: () => void
}

export default function Checkout({ items, onConfirm, onBack }: Props) {
  const [address, setAddress] = useState('Calle Pino #24, Sierra Norte')
  const [payment, setPayment] = useState('Tarjeta terminada en 4242')
  const [instructions, setInstructions] = useState('')

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
              <div className="flex justify-between font-bold text-lg mt-2 pt-2 border-t border-[#35373b]">
                <span>Total</span><span className="text-[#5bc827]">${total.toFixed(0)}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Dirección */}
        <section>
          <h2 className="text-[#9a9da3] text-sm font-semibold mb-3 uppercase tracking-wider">Entregar en</h2>
          <div className="bg-[#232427] border border-[#35373b] rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:border-[#5bc827]/50 transition-colors">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📍</span>
              <div>
                <p className="font-semibold text-sm">{address}</p>
                <p className="text-[#9a9da3] text-xs">Añadir instrucciones de entrega</p>
              </div>
            </div>
            <span className="text-[#5bc827] text-sm font-semibold">Cambiar</span>
          </div>
        </section>

        {/* Pago */}
        <section>
          <h2 className="text-[#9a9da3] text-sm font-semibold mb-3 uppercase tracking-wider">Método de pago</h2>
          <div className="bg-[#232427] border border-[#35373b] rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:border-[#5bc827]/50 transition-colors">
            <div className="flex items-center gap-3">
              <span className="text-2xl">💳</span>
              <p className="font-semibold text-sm">{payment}</p>
            </div>
            <span className="text-[#5bc827] text-sm font-semibold">Cambiar</span>
          </div>
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

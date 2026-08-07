export default function Promotions({ onBack }: { onBack: () => void }) {
  const promos = [
    { id: 1, title: '¡Primer pedido GRATIS!', code: 'SIERRA1', desc: 'Descuento de hasta $100 en tu primera compra.', expire: '31 Dic 2026' },
    { id: 2, title: '20% OFF en Pizzas', code: 'PIZZA20', desc: 'Válido solo en Pizzería Napoli y restaurantes participantes.', expire: 'Hoy' },
  ]

  return (
    <div className="min-h-screen bg-[#1a1b1e] text-white flex flex-col">
      <header className="sticky top-0 z-40 bg-[#1a1b1e]/95 backdrop-blur-sm border-b border-[#35373b] px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="text-[#9a9da3] hover:text-white transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-xl font-bold uppercase tracking-wide" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Promociones</h1>
      </header>

      <div className="p-4 space-y-4 max-w-lg mx-auto w-full">
        {promos.map(p => (
          <div key={p.id} className="bg-[#232427] border border-[#35373b] rounded-2xl overflow-hidden flex">
            <div className="bg-[#5bc827] w-1.5 shrink-0" />
            <div className="p-4 flex-1">
              <h3 className="font-bold text-lg mb-1">{p.title}</h3>
              <p className="text-[#9a9da3] text-xs mb-3">{p.desc}</p>
              
              <div className="flex items-center justify-between">
                <div className="bg-[#1a1b1e] border border-[#35373b] rounded px-3 py-1 font-mono text-sm text-[#5bc827] font-bold tracking-widest">
                  {p.code}
                </div>
                <div className="text-right">
                  <p className="text-[#9a9da3] text-[10px]">Vence:</p>
                  <p className="text-xs font-semibold">{p.expire}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

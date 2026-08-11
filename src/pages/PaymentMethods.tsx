export default function PaymentMethods({ onBack }: { onBack: () => void }) {
  const methods = [
    { id: 1, type: 'Visa', last4: '4242', exp: '12/25', default: true },
    { id: 2, type: 'Mastercard', last4: '8811', exp: '08/26', default: false },
  ]

  return (
    <div className="min-h-screen bg-[#1a1b1e] text-white flex flex-col">
      <header className="sticky top-0 z-40 bg-[#1a1b1e]/95 backdrop-blur-sm border-b border-[#35373b] px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="text-[#9a9da3] hover:text-white transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-xl font-bold uppercase tracking-wide" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Métodos de pago</h1>
      </header>

      <div className="p-4 space-y-4 max-w-lg mx-auto w-full">
        {methods.map(m => (
          <div key={m.id} className="bg-[#232427] border border-[#35373b] rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-6 bg-[#1a1b1e] rounded flex items-center justify-center border border-[#35373b] text-xs font-bold">
                {m.type}
              </div>
              <div>
                <p className="font-semibold text-sm">•••• {m.last4}</p>
                <p className="text-[#9a9da3] text-xs">Vence {m.exp}</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              {m.default && <span className="bg-[#5bc827]/20 text-[#5bc827] text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wide">Predeterminado</span>}
              <button className="text-red-400 hover:text-red-300 text-xs">Eliminar</button>
            </div>
          </div>
        ))}
        
        <div className="bg-[#232427] border border-[#35373b] rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-8 bg-[#1a1b1e] rounded flex items-center justify-center border border-[#35373b] text-xl">
              🏧
            </div>
            <div>
              <p className="font-semibold text-sm">Pago en ventanilla</p>
              <p className="text-[#9a9da3] text-xs">Disponible en locales participantes</p>
            </div>
          </div>
        </div>
        
        <button className="w-full py-4 border-2 border-dashed border-[#35373b] rounded-2xl text-[#c4c6ca] font-semibold flex items-center justify-center gap-2 hover:border-[#5bc827] hover:text-[#5bc827] transition-colors">
          <span className="text-xl">+</span> Agregar nueva tarjeta
        </button>
      </div>
    </div>
  )
}

export default function EarningsRepartidor({ onBack }: { onBack: () => void }) {
  // TODO: reemplazar con datos reales del backend (GET /api/delivery/earnings/history)
  const history: { id: string; time: string; amount: string }[] = []

  return (
    <div className="min-h-screen bg-[#1a1b1e] text-white flex flex-col">
      <header className="sticky top-0 z-40 bg-[#1a1b1e]/95 backdrop-blur-sm border-b border-[#35373b] px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="text-[#9a9da3] hover:text-white transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-xl font-bold uppercase tracking-wide" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Mis Ganancias</h1>
      </header>

      <div className="p-4 max-w-lg mx-auto w-full space-y-6">
        {/* TODO: reemplazar con datos reales del backend (GET /api/delivery/earnings) */}
        <div className="bg-[#232427] border border-[#35373b] rounded-2xl p-6 text-center">
          <p className="text-[#9a9da3] text-sm uppercase tracking-wider mb-2">Ganancias de hoy</p>
          <p className="text-5xl font-bold text-[#5bc827] mb-6" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>$0.00</p>
          
          <div className="grid grid-cols-2 gap-4 border-t border-[#35373b] pt-4">
            <div>
              <p className="text-[#9a9da3] text-xs mb-1">Esta semana</p>
              <p className="font-semibold">$0.00</p>
            </div>
            <div>
              <p className="text-[#9a9da3] text-xs mb-1">Entregas hoy</p>
              <p className="font-semibold">0</p>
            </div>
          </div>
        </div>

        <button className="w-full py-4 rounded-xl bg-[#5bc827] hover:bg-[#7ed944] text-[#1a1b1e] font-bold text-base transition-all hover:scale-[1.01] active:scale-[0.99]">
          Solicitar retiro
        </button>

        <div>
          <h2 className="text-[#9a9da3] text-sm font-semibold mb-3 uppercase tracking-wider">Historial reciente</h2>
          <div className="space-y-3">
            {history.map(h => (
              <div key={h.id} className="bg-[#232427] border border-[#35373b] rounded-xl p-4 flex justify-between items-center">
                <div>
                  <p className="font-semibold text-sm">Pedido {h.id}</p>
                  <p className="text-[#9a9da3] text-xs">{h.time}</p>
                </div>
                <p className="text-[#5bc827] font-bold">{h.amount}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

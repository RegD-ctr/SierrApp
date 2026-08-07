interface Orden {
  id: string
  cliente: string
  hora: string
  estado: string
  productos: { nombre: string; cantidad: number }[]
  total: string
}

export default function LocalOrderDetail({ orden, onAceptar, onRechazar, onBack }: { 
  orden: Orden, onAceptar: () => void, onRechazar: () => void, onBack: () => void 
}) {
  return (
    <div className="min-h-screen bg-[#1a1b1e] text-white flex flex-col">
      <header className="sticky top-0 z-40 bg-[#1a1b1e]/95 backdrop-blur-sm border-b border-[#35373b] px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="text-[#9a9da3] hover:text-white transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-xl font-bold uppercase tracking-wide" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Orden {orden.id}</h1>
      </header>

      <div className="p-4 max-w-lg mx-auto w-full space-y-6">
        <section className="bg-[#232427] border border-[#35373b] rounded-2xl p-5">
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-[#9a9da3] text-xs uppercase tracking-wider mb-1">Cliente</p>
              <p className="font-bold text-lg">{orden.cliente}</p>
            </div>
            <div className="text-right">
              <p className="text-[#9a9da3] text-xs uppercase tracking-wider mb-1">Hora</p>
              <p className="font-bold">{orden.hora}</p>
            </div>
          </div>
          
          <div className="border-t border-[#35373b] pt-4 space-y-3">
            {orden.productos.map((p, i) => (
              <div key={i} className="flex gap-3">
                <span className="text-[#5bc827] font-bold">{p.cantidad}x</span>
                <span className="text-white">{p.nombre}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-[#35373b] pt-4 mt-4 flex justify-between items-center text-lg font-bold">
            <span>Total a cobrar</span>
            <span className="text-[#5bc827]">{orden.total}</span>
          </div>
        </section>

        {orden.estado === 'pendiente' && (
          <div className="flex gap-3">
            <button
              onClick={onRechazar}
              className="flex-1 py-3.5 rounded-xl border border-[#35373b] text-[#c4c6ca] font-bold hover:bg-[#232427] transition-colors"
            >
              Rechazar
            </button>
            <button
              onClick={onAceptar}
              className="flex-1 py-3.5 rounded-xl bg-[#5bc827] hover:bg-[#7ed944] text-[#1a1b1e] font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Aceptar orden
            </button>
          </div>
        )}

        {orden.estado === 'preparando' && (
          <button
            onClick={onAceptar}
            className="w-full py-3.5 rounded-xl bg-[#5bc827] hover:bg-[#7ed944] text-[#1a1b1e] font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Marcar como Listo
          </button>
        )}
      </div>
    </div>
  )
}

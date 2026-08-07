export default function Addresses({ onBack }: { onBack: () => void }) {
  const addresses = [
    { id: 1, name: 'Casa', street: 'Calle Pino #24', col: 'Sierra Norte', default: true },
    { id: 2, name: 'Oficina', street: 'Av. Las Palmas #300', col: 'Centro', default: false },
  ]

  return (
    <div className="min-h-screen bg-[#1a1b1e] text-white flex flex-col">
      <header className="sticky top-0 z-40 bg-[#1a1b1e]/95 backdrop-blur-sm border-b border-[#35373b] px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="text-[#9a9da3] hover:text-white transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-xl font-bold uppercase tracking-wide" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Mis direcciones</h1>
      </header>

      <div className="p-4 space-y-4 max-w-lg mx-auto w-full">
        {addresses.map(a => (
          <div key={a.id} className="bg-[#232427] border border-[#35373b] rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📍</span>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm">{a.name}</p>
                  {a.default && <span className="bg-[#5bc827]/20 text-[#5bc827] text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wide">Actual</span>}
                </div>
                <p className="text-[#9a9da3] text-xs">{a.street}, {a.col}</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 text-xs">
              <button className="text-[#5bc827] hover:text-[#7ed944] font-semibold">Editar</button>
              <button className="text-red-400 hover:text-red-300">Eliminar</button>
            </div>
          </div>
        ))}

        <button className="w-full py-4 border-2 border-dashed border-[#35373b] rounded-2xl text-[#c4c6ca] font-semibold flex items-center justify-center gap-2 hover:border-[#5bc827] hover:text-[#5bc827] transition-colors">
          <span className="text-xl">+</span> Agregar nueva dirección
        </button>
      </div>
    </div>
  )
}

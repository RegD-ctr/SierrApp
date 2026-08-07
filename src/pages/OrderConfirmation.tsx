export default function OrderConfirmation({ onTrack, onHome }: { onTrack: () => void, onHome: () => void }) {
  return (
    <div className="min-h-screen bg-[#1a1b1e] text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="w-24 h-24 bg-[#5bc827]/20 rounded-full flex items-center justify-center mb-6">
        <span className="text-[#5bc827] text-5xl">✓</span>
      </div>
      <h1 className="text-3xl font-bold uppercase tracking-wide mb-2" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
        ¡Pedido Confirmado!
      </h1>
      <p className="text-[#c4c6ca] mb-6">Tu pedido ha sido recibido y el restaurante ya comenzó a prepararlo.</p>
      
      <div className="bg-[#232427] border border-[#35373b] rounded-2xl p-5 w-full max-w-sm mb-8 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-[#9a9da3]">Número de orden</span>
          <span className="font-bold text-[#5bc827]">#SR-4829</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[#9a9da3]">Tiempo estimado</span>
          <span className="font-bold text-white">25 - 35 min</span>
        </div>
      </div>

      <div className="w-full max-w-sm space-y-3">
        <button
          onClick={onTrack}
          className="w-full py-3.5 rounded-xl bg-[#5bc827] hover:bg-[#7ed944] text-[#1a1b1e] font-bold text-base transition-all hover:scale-[1.01] active:scale-[0.99]"
        >
          Ver seguimiento
        </button>
        <button
          onClick={onHome}
          className="w-full py-3.5 rounded-xl border border-[#35373b] hover:bg-[#232427] text-white font-bold text-base transition-colors"
        >
          Volver al inicio
        </button>
      </div>
    </div>
  )
}
